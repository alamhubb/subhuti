/**
 * Subhuti Parser - 高能 PEG Parser 框架
 *
 * 核心特：
 * - Packrat Parsing（线性时间复杂度，LRU 缓存
 * - 返回值语义（成功返回 CST，失败返undefined
 *
 * 架构设计
 * - 继承 SubhutiTokenLookahead（前瞻能+ 按需词法分析
 * - 实现 ITokenConsumerContext（提供消费接口）
 * - 支持泛型扩展 SubhutiTokenConsumer
 *
 * @version 5.0.0
 */

import SubhutiTokenLookahead, {NextTokenInfo} from "./SubhutiTokenLookahead.ts"
import SubhutiCst from "./struct/SubhutiCst.ts";
import type SubhutiMatchToken from "./struct/SubhutiMatchToken.ts";
import {SubhutiErrorHandler, ParsingError} from "./SubhutiError.ts";
import {SubhutiTraceDebugger} from "./SubhutiDebug.ts";
import {SubhutiPackratCache, type SubhutiPackratCacheResult} from "./SubhutiPackratCache.ts";
import SubhutiTokenConsumer from "./SubhutiTokenConsumer.ts";
import {SubhutiDebugRuleTracePrint, setShowRulePath} from "./SubhutiDebugRuleTracePrint.ts";
import SubhutiLexer from "./SubhutiLexer.ts";
import {SubhutiCreateToken, DefaultMode, type LexerMode} from "./struct/SubhutiCreateToken.ts";
import {SubhutiGrammarValidator} from "./validation";


// ============================================
// 类型定义
// ============================================

export type RuleFunction = () => void

export interface SubhutiParserOr {
    alt: RuleFunction
}

export interface SubhutiBackData {
    nextTokenInfo: NextTokenInfo
    /** CST children 长度 */
    curCstChildrenLength: number
    /** 已解token 数量（用于恢parsedTokens*/
    parsedTokensLength: number
}


export interface SubhutiAllowErrorOrBranchContextBackData {
    orParserTokens: SubhutiMatchToken[]
    curCstChildren: SubhutiCst[],
    nextTokenInfo: NextTokenInfo
}

interface SubhutiAllowErrorContext {
    bestCodeIndex: number
    savedState: SubhutiBackData
    savedCst?: SubhutiCst
    bestNextTokenInfo: NextTokenInfo
    bestTokens: SubhutiMatchToken[]
    bestChildren: SubhutiCst[]
}

interface SubhutiManyTolerantFrame {
    bestMatchErrorCst: SubhutiAllowErrorContext | null
}

// ============================================
// 装饰器系统（兼容旧版 experimentalDecorators Stage 3
// ============================================

export function Subhuti<T extends new (...args: any[]) => SubhutiParser>(
    target: T,
    context?: ClassDecoratorContext
): T {
    return target
}

function wrapRuleMethod(originalMethod: Function, ruleName: string): Function {
    const wrappedFunction = function (this: SubhutiParser, ...args: any[]): SubhutiCst | undefined {
        return this.executeRuleWrapper(originalMethod, ruleName, this.constructor.name, ...args)
    }
    Object.defineProperty(wrappedFunction, 'name', {value: ruleName})
    Object.defineProperty(wrappedFunction, '__originalFunction__', {
        value: originalMethod, writable: false, enumerable: false, configurable: false
    })
    Object.defineProperty(wrappedFunction, '__isSubhutiRule__', {
        value: true, writable: false, enumerable: false, configurable: false
    })
    return wrappedFunction
}

export function SubhutiRule(
    targetOrMethod: any,
    propertyKeyOrContext: string | ClassMethodDecoratorContext,
    descriptor?: PropertyDescriptor
): any {
    const isLegacy = typeof propertyKeyOrContext === 'string'
    if (isLegacy) {
        descriptor!.value = wrapRuleMethod(descriptor!.value, propertyKeyOrContext as string)
        return descriptor
    } else {
        return wrapRuleMethod(targetOrMethod, targetOrMethod.name)
    }
}

export type SubhutiTokenConsumerConstructor<T extends SubhutiTokenConsumer<any>> =
    new (parser: SubhutiParser) => T

/**
 * Parser 构项
 */
export interface SubhutiParserOptions<T extends SubhutiTokenConsumer<any> = SubhutiTokenConsumer<any>> {
    /** TokenConsumer 类（可） */
    tokenConsumer?: SubhutiTokenConsumerConstructor<T>
    /** Token 定义（用于按霢词法分析模式*/
    tokenDefinitions?: SubhutiCreateToken[]
}

// ============================================
// SubhutiParser 核心
// ============================================

export default class SubhutiParser<T extends SubhutiTokenConsumer<any> = SubhutiTokenConsumer<any>>
    extends SubhutiTokenLookahead {
    // 核心字段
    readonly tokenConsumer: T

    private readonly cstStack: SubhutiCst[] = []
    private readonly className: string

    /**
     * 分析模式标志
     * - true: 分析模式（用于语法验证，不抛异常
     * - false: 正常模式（用于解析，抛异常）
     */
    private _analysisMode: boolean = false

    /**
     * 容错模式标志
     * - true: 容错模式（遇错继续，收集错误
     * - false: 正常模式（遇错停止）
     */
    private _tolerant: boolean = false

    /** 容错模式收集的错误列*/
    private _errors: ParsingError[] = []

    // 调试和错误处
    private _debugger?: SubhutiTraceDebugger
    private readonly _errorHandler = new SubhutiErrorHandler()

    // 无限循环棢测（调用栈状态检测）
    /**
     * 循环棢测集合：O(1) 棢(rule, position) 是否重复
     * 格式: "ruleName:position"
     */
    private readonly loopDetectionSet: Set<string> = new Set()

    // Packrat Parsing（默LRU 缓存
    enableMemoization: boolean = true
    private readonly _cache: SubhutiPackratCache
    private _activeManyTolerantFrame: SubhutiManyTolerantFrame | null = null

    getRuleStack() {
        return this.cstStack.map(item => item.name)
    }

    /**
     * 构函- 按需词法分析模式
     *
     * @param sourceCode 源代
     * @param options 配置选项
     */
    constructor(
        sourceCode: string = '',
        options?: SubhutiParserOptions<T>,
    ) {
        super()
        this.className = this.constructor.name
        this._cache = new SubhutiPackratCache()

        // 初始化源代码和位
        this._sourceCode = sourceCode

        this.initNextTokenInfo()

        this._tokenCache = new Map()
        this.initParserTokens()

        // 初始化词法分析器
        if (options?.tokenDefinitions) {
            this._lexer = new SubhutiLexer(options.tokenDefinitions)
        }

        // 初始TokenConsumer
        if (options?.tokenConsumer) {
            this.tokenConsumer = new options.tokenConsumer(this)
        } else {
            this.tokenConsumer = new SubhutiTokenConsumer(this) as T
        }
    }


    // ============================================
    // 公开TokenConsumer 使用的方
    // ============================================

    /**
     * TokenConsumer 使用consume 方法
     * @param tokenName token 名称
     * @param mode 词法模式（可选）
     */
    _consumeToken(tokenName: string, mode?: LexerMode): SubhutiCst | undefined {
        return this.consume(tokenName, mode)
    }

    // ============================================
    // Parser 内部 Getter
    // ============================================

    get curCst(): SubhutiCst | undefined {
        return this.cstStack[this.cstStack.length - 1]
    }

    // 功能弢关（链式调用
    cache(enable: boolean = true): this {
        this.enableMemoization = enable
        return this
    }

    /**
     * 解析入口方法（建议子类覆写）
     *
     * 子类应覆写此方法，调用具体的顶层规则
     * ```typescript
     * class JsParser extends SubhutiParser {
     *     parse(): SubhutiCst | undefined {
     *         return this.Module()
     *     }
     * }
     * ```
     */
    parse(): SubhutiCst | undefined {
        throw new Error(
            `${this.constructor.name}.parse() not implemented. ` +
            `Please override this method to call your entry rule.`
        )
    }

    /**
     * 启用调试模式
     * @param showRulePath - 是否显示规则执行路径（默true
     *                       传入 false 时只显示性能统计CST 验证报告
     */
    debug(showRulePath: boolean = true): this {
        setShowRulePath(showRulePath)
        this._debugger = new SubhutiTraceDebugger(this.parsedTokens)
        return this
    }

    errorHandler(enable: boolean = true): this {
        this._errorHandler.setDetailed(enable)
        return this
    }

    /**
     * 获取容错模式收集的错误列
     */
    get errors(): ParsingError[] {
        return this._errors
    }

    /**
     * 启用分析模式（用于语法验证，不抛异常
     *
     * 在分析模式下
     * - 不抛出左递归异常
     * - 不抛出无限循环异
     * - 不抛Token 消费失败异常
     * - 不抛EOF 棢测异
     *
     * @internal 仅供 SubhutiRuleCollector 使用
     */
    enableAnalysisMode(): void {
        this._analysisMode = true
    }

    /**
     * 禁用分析模式（恢复正常模式）
     *
     * @internal 仅供 SubhutiRuleCollector 使用
     */
    disableAnalysisMode(): void {
        this._analysisMode = false
    }

    /**
     * 启用语法验证（链式调用），验证语法（棢Or 规则冲突
     *
     * 用法
     * ```typescript
     * const parser = new Es2025Parser(tokens).validate()
     * const cst = parser.Script()
     * ```
     *
     * @returns this - 支持链式调用
     * @throws SubhutiGrammarValidationError - 语法有冲突时抛出
     */
    validate(): this {
        SubhutiGrammarValidator.validate(this)
        return this
    }

    /**
     * 抛出循环错误信息
     *
     * @param ruleName 当前规则名称
     */
    private throwLoopError(ruleName: string): never {
        // 分析模式：不抛异常，直接返回
        if (this._analysisMode) {
            this.setParseFail()
            return undefined as never
        }

        // Parser 只负责收集数据，错误组装ErrorHandler 负责
        throw this._errorHandler.createLoopError({
            ruleName,
            currentToken: this.nextToken,
            tokenIndex: this.currentTokenIndex,
            ruleStack: this.getRuleStack(),
            loopDetectionSet: Array.from(this.loopDetectionSet),
            cstDepth: this.cstStack.length,
            cacheStats: this._cache.getStatsReport(),
            tokenContext: this.getTokenContext(2)
        })
    }

    /**
     * 规则执行入口（由 @SubhutiRule 装饰器调用）
     * 职责：前置检循环棢Packrat 缓存 核心执行 后置处理
     */
    executeRuleWrapper(targetFun: Function, ruleName: string, className: string, ...args: any[]): SubhutiCst | undefined {
        if (this.checkRuleIsThisClass(ruleName, className)) {
            return
        }
        const isTopLevel = this.cstStack.length === 0

        if (isTopLevel) {
            this.initTopLevelData()
        }

        if (this.parserFail) {
            return
        }

        const tokenIndex = this.currentTokenIndex
        const key = `${ruleName}:${tokenIndex}`

        // O(1) 快检测是否重复（循环棢测）
        if (this.loopDetectionSet.has(key)) {
            this.throwLoopError(ruleName)
        }

        // 入栈
        this.loopDetectionSet.add(key)

        try {
            const startTime = this._debugger?.onRuleEnter(ruleName, tokenIndex)

            // Packrat Parsing 缓存查询
            if (this.enableMemoization) {
                const cached = this._cache.get(ruleName, tokenIndex)
                if (cached !== undefined) {
                    this._debugger?.onRuleExit(ruleName, true, startTime)

                    const cst = this.applyCachedResult(cached)
                    if (!cst.children?.length) {
                        cst.children = undefined
                    }
                    return cst
                }
            }

            // 核心执行
            const startTokenIndex = tokenIndex

            const cst = this.executeRuleCore(ruleName, targetFun, ...args)

            // 缓存存储
            if (this.enableMemoization) {
                // 提取本次规则消费token
                const consumedTokens = this._parseSuccess
                    ? this.parsedTokens.slice(startTokenIndex)
                    : undefined

                this._cache.set(ruleName, startTokenIndex, {
                    cst: cst,
                    parseSuccess: this._parseSuccess,
                    parsedTokens: consumedTokens,
                    nextTokenInfo: this.getNextTokenInfo(),
                })
            }

            this._debugger?.onRuleExitWithTopLevel(ruleName, cst, isTopLevel, false, startTime)

            // 顶层规则：检查是否所有源码都被消
            if (isTopLevel && this._parseSuccess) {
                if (!this.isEof) {
                    const nextToken = this.LA(1)
                    throw new Error(
                        `Parser internal error: parsing succeeded but source code remains unconsumed. ` +
                        `Next token: "${nextToken?.tokenValue}" (${nextToken?.tokenName}) at position ${nextToken.codeIndex}`
                    )
                }
            }

            // 顶层规则失败时的错误处理
            if (isTopLevel && this.parserFail) {
                this.handleTopLevelError(ruleName, startTokenIndex)
            }

            if (!cst.children?.length) {
                cst.children = undefined
            }
            return cst
        } finally {
            // 出栈（无论成功return、异常都会执行）
            this.loopDetectionSet.delete(key)
        }
    }

    private initTopLevelData() {
        // 【顶层规则开始重置解析器状
        this.setParserSuccess()
        this.cstStack.length = 0
        this.loopDetectionSet.clear()
        this._activeManyTolerantFrame = null
        this.initNextTokenInfo()
        this.initParserTokens()
        this._tokenCache.clear()

        // 重置调试器的缓存和统
        this._debugger?.resetForNewParse(this.parsedTokens)
    }

    private checkRuleIsThisClass(ruleName: string, className: string): boolean {
        if (this.hasOwnProperty(ruleName)) {
            if (className !== this.className) {
                return true
            }
        }
        return false
    }

    /**
     * 执行规则函数核心逻辑
     * 职责：创CST 执行规则 成功则添加到父节
     */
    private executeRuleCore(ruleName: string, targetFun: Function, ...args: any[]): SubhutiCst {
        const cst = new SubhutiCst()
        cst.name = ruleName
        cst.children = []

        this.cstStack.push(cst)

        // 执行规则函数
        targetFun.apply(this, args)

        this.cstStack.pop()

        // 无条件添加到父节点（容错模式霢要）
        const parentCst = this.cstStack[this.cstStack.length - 1]
        if (parentCst) {
            parentCst.children!.push(cst)
        }

        // 成功时设置位
        if (this._parseSuccess) {
            this.setLocation(cst)
        }

        return cst
    }

    private setLocation(cst: SubhutiCst): void {
        if (cst.children && cst.children[0]?.loc) {
            const lastChild = cst.children[cst.children.length - 1]
            cst.loc = {
                type: cst.name,
                start: cst.children[0].loc.start,
                // end: lastChild.loc.end || cst.children[0].loc.end
                end: lastChild?.loc?.end
            }
        }
    }

    /**
     * Or 规则 - 顺序选择（PEG 风格
     *
     * 核心逻辑
     * - 依次尝试每个分支，第丢个成功的分支生效
     * - 扢有分支都失败则择 codeIndex 变化朢多的分支
     */
    Or(alternatives: SubhutiParserOr[]): void {
        if (this.parserFail) {
            return
        }

        const savedState = this.getCurState()
        const totalCount = alternatives.length
        const parentRuleName = this.curCst?.name || 'Unknown'

        // 记录失败分支的状态快
        const failedStates: SubhutiAllowErrorOrBranchContextBackData[] = []

        // 进入 Or（整Or 调用弢始）
        this._debugger?.onOrEnter?.(parentRuleName, this.lastTokenIndex)

        const startTokenIndex = this.currentTokenIndex

        for (let i = 0; i < totalCount; i++) {
            const alt = alternatives[i]
            const isLast = i === totalCount - 1

            // 进入 Or 分支
            this._debugger?.onOrBranch?.(i, totalCount, parentRuleName)

            alt.alt()

            // 逢Or 分支（无论成功还是失败）
            this._debugger?.onOrBranchExit?.(parentRuleName, i)

            if (this._parseSuccess) {
                // 逢Or（整Or 调用成功结束
                this._debugger?.onOrExit?.(parentRuleName)
                return
            }

            const orAllowErrorData: SubhutiAllowErrorOrBranchContextBackData = {
                curCstChildren: [...this.curCst.children],
                orParserTokens: [...this.parsedTokens.slice(startTokenIndex, this.currentTokenIndex)],
                nextTokenInfo: this.getNextTokenInfo(),
            }


            // 失败：在 restoreState 之前保存当前状快
            failedStates.push(orAllowErrorData)

            // N-1 个分支：失败后回溯并重置状，继续尝试下一
            if (!isLast) {
                this.restoreState(savedState)
                this.setParserSuccess()
            }
            // 朢后一个分支：失败后不回溯，保持失败状
        }

        if (this.parserFail && failedStates.length > 0) {
            // 选择 codeIndex 变化朢多的分支
            const bestState = failedStates.reduce((a, b) => {
                return a.nextTokenInfo.codeIndex >= b.nextTokenInfo.codeIndex ? a : b
            })
            // 恢复到最优分支的状
            this.restoreAllowErrorContext(savedState, bestState)

            const frame = this._activeManyTolerantFrame
            if (frame && (
                !frame.bestMatchErrorCst ||
                bestState.nextTokenInfo.codeIndex > frame.bestMatchErrorCst.bestCodeIndex
            )) {
                frame.bestMatchErrorCst = {
                    bestCodeIndex: bestState.nextTokenInfo.codeIndex,
                    savedState: {...savedState},
                    savedCst: this.curCst,
                    bestNextTokenInfo: {...bestState.nextTokenInfo},
                    bestTokens: [...bestState.orParserTokens],
                    bestChildren: [...bestState.curCstChildren]
                }
            }
        }

        // 逢Or（整Or 调用失败结束
        this._debugger?.onOrExit?.(parentRuleName)
    }

    /**
     * Many 规则 - 0次或多次（EBNF { ... }
     *
     * 循环执行直到失败或没消费 token
     */
    Many(fn: RuleFunction): void {
        while (this.tryAndRestore(fn)) {
            // 继续循环
        }
    }

    /**
     * ManyTolerant - 容错Many（用ModuleList 等顶层循环）
     *
     * 失败但有进展（codeIndex 变化了）时，设置成功继续解析
     * 失败且没进展时，EOF 则出，否则报错
     */
    ManyTolerant(fn: RuleFunction): void {
        const previousFrame = this._activeManyTolerantFrame
        try {
            while (!this.parserFailOrIsEof) {
                const startState = this.getCurState()
                const startCodeIndex = startState.nextTokenInfo.codeIndex
                this._activeManyTolerantFrame = {
                    bestMatchErrorCst: null
                }
                fn()

                if (!this.parserFail) {
                    if (this._nextTokenInfo.codeIndex > startCodeIndex) {
                        continue
                    }
                    if (this.handleManyTolerantNoProgress(startState) === 'break') {
                        break
                    }
                    continue
                }

                const allowCtx = this._activeManyTolerantFrame.bestMatchErrorCst
                const hasAllowContextProgress = !!(
                    allowCtx &&
                    allowCtx.bestCodeIndex > startCodeIndex
                )
                const hasRawCodeProgress = this._nextTokenInfo.codeIndex > startCodeIndex

                if (hasAllowContextProgress || hasRawCodeProgress) {
                    if (
                        hasAllowContextProgress &&
                        allowCtx &&
                        allowCtx.bestCodeIndex > this._nextTokenInfo.codeIndex
                    ) {
                        this.applyAllowErrorContext(allowCtx)
                    }
                    this.setParserSuccess()
                    break
                }

                if (this.handleManyTolerantNoProgress(startState) === 'break') {
                    break
                }
            }
        } finally {
            this._activeManyTolerantFrame = previousFrame
            this.setParserSuccess()
        }
    }

    /**
     * Option 规则 - 0次或1次（EBNF [ ... ]
     *
     * 尝试执行丢次，失败则回溯，不影响整体解析状
     */

    private handleManyTolerantNoProgress(
        startState: SubhutiBackData
    ): 'break' | 'continue' {
        this.restoreState(startState)
        this.setParserSuccess()
        if (this.isEof) {
            return 'break'
        }
        if (this.skipOneTokenForRecovery()) {
            this.setParserSuccess()
            return 'continue'
        }
        throw Error('系统错误')
    }

    Option(fn: RuleFunction): void {
        this.tryAndRestore(fn)
    }

    /**
     * AtLeastOne 规则 - 1次或多次
     *
     * 第一次必须成功，后续循环执行直到失败
     */
    AtLeastOne(fn: RuleFunction): void {
        if (this.parserFail) {
            return
        }

        fn()

        while (this.tryAndRestore(fn)) {
            // 继续循环
        }
    }

    /**
     * 顶层规则失败时的错误处理
     *
     * @param ruleName 规则
     * @param startIndex 规则弢始时的源码位
     */
    private handleTopLevelError(ruleName: string, startIndex: number): void {
        // 分析模式：不抛错，用于语法验
        if (this._analysisMode) {
            return
        }

        // Parser 只负责收集数据，错误组装ErrorHandler 负责
        throw this._errorHandler.createTopLevelError({
            ruleName,
            startIndex,
            currentTokenIndex: this.currentTokenIndex,
            currentToken: this.nextToken,
            ruleStack: this.getRuleStack()
        })
    }

    get parserFailOrIsEof() {
        return this.parserFail || this.isEof
    }

    /**
     * 消费 token（智能错误管理）
     * - 失败时返undefined，不抛异
     * - protected: 必须通过 tokenConsumer 的封装方法消token
     * @param tokenName token 名称
     * @param mode 词法模式（可选，默认使用 _currentMode
     */
    protected consume(tokenName: string, mode?: LexerMode): SubhutiCst | undefined {
        if (this.parserFail) {
            return
        }

        if (this.isEof) {
            this.setParseFail()
            return
        }

        // 获取当前 token（使用传入的 mode 或默mode
        const effectiveMode = mode ?? DefaultMode
        const entry = this._getOrParseToken(
            this._nextTokenInfo,
            effectiveMode
        )

        if (!entry) {
            this.setParseFail()
            return
        }

        const token = entry.token

        if (token.tokenName !== tokenName) {
            this.setParseFail()

            this._debugger?.onTokenConsume(
                this.currentTokenIndex,
                token.tokenValue,
                token.tokenName,
                tokenName,
                false
            )

            return
        }

        this._debugger?.onTokenConsume(
            this.currentTokenIndex,
            token.tokenValue,
            token.tokenName,
            tokenName,
            true
        )

        const cst = this.generateCstByToken(token)

        // 更新位置
        this.setNextTokenIndex(entry.nextTokenInfo)

        this.parsedTokens.push(token)

        return cst
    }

    private generateCstByToken(token: SubhutiMatchToken): SubhutiCst {
        const cst = new SubhutiCst()
        cst.name = token.tokenName
        cst.value = token.tokenValue
        cst.loc = {
            type: token.tokenName,
            value: token.tokenValue,
            start: {
                index: token.codeIndex || 0,
                line: token.line || 0,
                column: token.column || 0
            },
            end: {
                index: (token.codeIndex || 0) + token.tokenValue.length,
                line: token.line || 0,
                column: (token.column + token.tokenValue.length) || 0
            }
        }

        // 添加到当CST
        const currentCst = this.curCst
        if (currentCst) {
            currentCst.children!.push(cst)
        }

        return cst
    }

    // 回溯机制
    private getCurState(): SubhutiBackData {
        const currentCst = this.curCst
        return {
            nextTokenInfo: this.getNextTokenInfo(),
            curCstChildrenLength: currentCst?.children?.length || 0,
            parsedTokensLength: this.currentTokenIndex
        }
    }

    private restoreAllowErrorContext(savedState: SubhutiBackData, backData: SubhutiAllowErrorOrBranchContextBackData) {
        this.restoreState(savedState)
        this.replaceCstChildren(this.curCst, backData.curCstChildren)
        this.parsedTokens.push(...backData.orParserTokens)
        this.setNextTokenIndex(backData.nextTokenInfo)
    }

    private applyAllowErrorContext(ctx: SubhutiAllowErrorContext): void {
        this.resetParsedTokens(ctx.savedState.parsedTokensLength, ctx.bestTokens)
        this.replaceCstChildren(ctx.savedCst, ctx.bestChildren)
        this.setNextTokenIndex(ctx.bestNextTokenInfo)
    }

    private resetParsedTokens(baseLength: number, tokens: SubhutiMatchToken[]): void {
        this.parsedTokens.length = baseLength
        this.parsedTokens.push(...tokens)
    }

    private replaceCstChildren(targetCst: SubhutiCst | undefined, children: SubhutiCst[]): void {
        if (!targetCst) {
            return
        }
        targetCst.children = [...children]
    }


    private skipOneTokenForRecovery(): boolean {
        const currentCodeIndex = this._nextTokenInfo.codeIndex
        const entry = this._getOrParseToken(this._nextTokenInfo, DefaultMode)
        if (!entry) {
            return false
        }
        if (entry.nextTokenInfo.codeIndex <= currentCodeIndex) {
            return false
        }
        this.parsedTokens.push(entry.token)
        this.setNextTokenIndex(entry.nextTokenInfo)
        return true
    }
    private restoreState(backData: SubhutiBackData): void {
        this.setNextTokenIndex(backData.nextTokenInfo)

        this.parsedTokens.length = backData.parsedTokensLength

        const currentCst = this.curCst
        if (currentCst) {
            currentCst.children!.length = backData.curCstChildrenLength
        }
    }

    /**
     * 棢查是否已到达源码末尾
     */
    get isEof(): boolean {
        // 先检查是否已经到达代码末
        if (this.lastTokenEndCodeIndex >= this._sourceCode.length) {
            return true
        }

        // 尝试获取下一token（会跳过空白
        const entry = this._getOrParseToken(
            this._nextTokenInfo,
            DefaultMode
        )
        return entry === null
    }

    /**
     * 尝试执行函数，失败时自动回溯并重置状
     *
     * @param fn 要执行的函数
     * @returns true: 成功且消费了 token，false: 失败或没消费 token
     */
    private tryAndRestore(fn: () => void): boolean {
        if (this.parserFailOrIsEof) {
            return false
        }
        const frame = this._activeManyTolerantFrame
        const previousBestMatchErrorCst = frame?.bestMatchErrorCst ?? null
        const savedState = this.getCurState()
        const startCodeIndex = this._nextTokenInfo.codeIndex
        fn()

        if (this.parserFail) {
            const progressedCtx = this.buildProgressedAllowErrorContext(frame, savedState, startCodeIndex)
            this.restoreState(savedState)
            this.restoreAndMergeFrameContext(frame, previousBestMatchErrorCst, progressedCtx)
            this.setParserSuccess()
            return false
        }

        return this._nextTokenInfo.codeIndex !== startCodeIndex
    }

    private buildProgressedAllowErrorContext(
        frame: SubhutiManyTolerantFrame | null,
        savedState: SubhutiBackData,
        startCodeIndex: number
    ): SubhutiAllowErrorContext | null {
        if (!frame || this._nextTokenInfo.codeIndex <= startCodeIndex) {
            return null
        }
        return {
            bestCodeIndex: this._nextTokenInfo.codeIndex,
            savedState: {...savedState},
            savedCst: this.curCst,
            bestNextTokenInfo: this.getNextTokenInfo(),
            bestTokens: [...this.parsedTokens.slice(savedState.parsedTokensLength, this.currentTokenIndex)],
            bestChildren: [...(this.curCst?.children || [])]
        }
    }

    private restoreAndMergeFrameContext(
        frame: SubhutiManyTolerantFrame | null,
        previousBestMatchErrorCst: SubhutiAllowErrorContext | null,
        progressedCtx: SubhutiAllowErrorContext | null
    ): void {
        if (!frame) {
            return
        }
        frame.bestMatchErrorCst = previousBestMatchErrorCst
        if (
            progressedCtx &&
            (!frame.bestMatchErrorCst || progressedCtx.bestCodeIndex > frame.bestMatchErrorCst.bestCodeIndex)
        ) {
            frame.bestMatchErrorCst = progressedCtx
        }
    }

    /**
     * 应用缓存结果（恢复状态）
     */
    private applyCachedResult(cached: SubhutiPackratCacheResult): SubhutiCst {
        // 恢复消费token
        if (cached.parsedTokens && cached.parsedTokens.length > 0) {
            this.parsedTokens.push(...cached.parsedTokens)
            this.setNextTokenIndex(cached.nextTokenInfo)
        }

        this.setParserSuccessState(cached.parseSuccess)

        // 成功时添加到父节
        if (cached.parseSuccess) {
            const parentCst = this.cstStack[this.cstStack.length - 1]
            if (parentCst) {
                parentCst.children!.push(cached.cst)
            }
        }

        return cached.cst
    }

    // ============================================
    // Error Helper Methods
    // ============================================

    /**
     * 获取 token 上下文（parsedTokens 获取朢近的 N token
     *
     * @param contextSize - 上下文大小（默认 2
     * @returns token 上下文数
     */
    private getTokenContext(contextSize: number = 2): SubhutiMatchToken[] {
        const tokens = this.parsedTokens
        const len = tokens.length
        const start = Math.max(0, len - contextSize)
        return tokens.slice(start)
    }
}
