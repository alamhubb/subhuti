/**
 * Subhuti Parser - 高性能 PEG Parser 框架
 *
 * 核心特性：
 * - Packrat Parsing（线性时间复杂度，LRU 缓存）
 * - 返回值语义（成功返回 CST，失败返回 undefined）
 *
 * 架构设计：
 * - 继承 SubhutiTokenLookahead（前瞻能力 + 按需词法分析）
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
    /** 已解析 token 数量（用于恢复 parsedTokens） */
    parsedTokensLength: number
}

// ============================================
// 装饰器系统（兼容旧版 experimentalDecorators 和 Stage 3）
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
 * Parser 构造选项
 */
export interface SubhutiParserOptions<T extends SubhutiTokenConsumer<any> = SubhutiTokenConsumer<any>> {
    /** TokenConsumer 类（可选） */
    tokenConsumer?: SubhutiTokenConsumerConstructor<T>
    /** Token 定义（用于按需词法分析模式） */
    tokenDefinitions?: SubhutiCreateToken[]
}

// ============================================
// SubhutiParser 核心类
// ============================================

export default class SubhutiParser<T extends SubhutiTokenConsumer<any> = SubhutiTokenConsumer<any>>
    extends SubhutiTokenLookahead {
    // 核心字段
    readonly tokenConsumer: T

    private readonly cstStack: SubhutiCst[] = []
    private readonly className: string

    /**
     * 分析模式标志
     * - true: 分析模式（用于语法验证，不抛异常）
     * - false: 正常模式（用于解析，抛异常）
     */
    private _analysisMode: boolean = false

    /**
     * 容错模式标志
     * - true: 容错模式（遇错继续，收集错误）
     * - false: 正常模式（遇错停止）
     */
    private _tolerant: boolean = false

    /** 容错模式收集的错误列表 */
    private _errors: ParsingError[] = []

    // 调试和错误处理
    private _debugger?: SubhutiTraceDebugger
    private readonly _errorHandler = new SubhutiErrorHandler()

    // 无限循环检测（调用栈状态检测）
    /**
     * 循环检测集合：O(1) 检测 (rule, position) 是否重复
     * 格式: "ruleName:position"
     */
    private readonly loopDetectionSet: Set<string> = new Set()

    // Packrat Parsing（默认 LRU 缓存）
    enableMemoization: boolean = true
    private readonly _cache: SubhutiPackratCache

    getRuleStack() {
        return this.cstStack.map(item => item.name)
    }

    /**
     * 构造函数 - 按需词法分析模式
     *
     * @param sourceCode 源代码
     * @param options 配置选项
     */
    constructor(
        sourceCode: string = '',
        options?: SubhutiParserOptions<T>,
    ) {
        super()
        this.className = this.constructor.name
        this._cache = new SubhutiPackratCache()

        // 初始化源代码和位置
        this._sourceCode = sourceCode

        this.initNextTokenInfo()

        this._tokenCache = new Map()
        this._parsedTokens = []

        // 初始化词法分析器
        if (options?.tokenDefinitions) {
            this._lexer = new SubhutiLexer(options.tokenDefinitions)
        }

        // 初始化 TokenConsumer
        if (options?.tokenConsumer) {
            this.tokenConsumer = new options.tokenConsumer(this)
        } else {
            this.tokenConsumer = new SubhutiTokenConsumer(this) as T
        }
    }

    /**
     * 获取已解析的 token 列表
     */
    get parsedTokens(): SubhutiMatchToken[] {
        return this._parsedTokens
    }

    /**
     * 获取最后解析的 token 索引
     * @returns token 索引，如果没有已解析的 token 则返回 -1
     */
    get lastTokenIndex(): number {
        return this.currentTokenIndex - 1
    }

    get lastToken() {
        return this._parsedTokens[this.lastTokenIndex]
    }

    get lastTokenEndCodeIndex() {
        if (!this.lastToken) return
        return this.lastToken.codeIndex + this.lastToken.tokenValue.length
    }

    /**
     * 获取当前正在处理的 token 索引（下一个将被 consume 的 token）
     * @returns 当前 token 索引
     */
    get currentTokenIndex(): number {
        return this._parsedTokens.length
    }

    // ============================================
    // 公开给 TokenConsumer 使用的方法
    // ============================================

    /**
     * 供 TokenConsumer 使用的 consume 方法
     * @param tokenName token 名称
     * @param mode 词法模式（可选）
     */
    _consumeToken(tokenName: string, mode?: LexerMode): SubhutiCst | undefined {
        return this.consume(tokenName, mode)
    }

    /**
     * 供 TokenConsumer 使用的标记解析失败方法
     * 用于软关键字检查失败时标记解析失败
     */
    _markParseFail(): void {
        this._parseSuccess = false
    }

    // ============================================
    // Parser 内部 Getter
    // ============================================

    get curCst(): SubhutiCst | undefined {
        return this.cstStack[this.cstStack.length - 1]
    }

    // 功能开关（链式调用）
    cache(enable: boolean = true): this {
        this.enableMemoization = enable
        return this
    }

    /**
     * 解析入口方法（建议子类覆写）
     *
     * 子类应覆写此方法，调用具体的顶层规则：
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
     * @param showRulePath - 是否显示规则执行路径（默认 true）
     *                       传入 false 时只显示性能统计和 CST 验证报告
     */
    debug(showRulePath: boolean = true): this {
        setShowRulePath(showRulePath)
        this._debugger = new SubhutiTraceDebugger(this._parsedTokens)
        return this
    }

    errorHandler(enable: boolean = true): this {
        this._errorHandler.setDetailed(enable)
        return this
    }

    /**
     * 启用容错模式（链式调用）
     *
     * 在容错模式下：
     * - ManyTolerant 会在所有分支失败时选择最长匹配
     * - 错误会被收集到 errors 数组中
     * - 解析会继续而不是停止
     */
    tolerant(enable: boolean = true): this {
        this._tolerant = enable
        return this
    }

    /**
     * 获取容错模式收集的错误列表
     */
    get errors(): ParsingError[] {
        return this._errors
    }

    /**
     * 启用分析模式（用于语法验证，不抛异常）
     *
     * 在分析模式下：
     * - 不抛出左递归异常
     * - 不抛出无限循环异常
     * - 不抛出 Token 消费失败异常
     * - 不抛出 EOF 检测异常
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
     * 启用语法验证（链式调用），验证语法（检测 Or 规则冲突）
     *
     * 用法：
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
            this._parseSuccess = false
            return undefined as never
        }

        // Parser 只负责收集数据，错误组装由 ErrorHandler 负责
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
     * 职责：前置检查 → 循环检测 → Packrat 缓存 → 核心执行 → 后置处理
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

        // O(1) 快速检测是否重复（循环检测）
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
                // 提取本次规则消费的 token
                const consumedTokens = this._parseSuccess
                    ? this._parsedTokens.slice(startTokenIndex)
                    : undefined

                this._cache.set(ruleName, startTokenIndex, {
                    endTokenIndex: this.currentTokenIndex,
                    cst: cst,
                    parseSuccess: this._parseSuccess,
                    parsedTokens: consumedTokens,
                    nextTokenInfo: this.cloneThisNextTokenInfo(),
                })
            }

            this._debugger?.onRuleExitWithTopLevel(ruleName, cst, isTopLevel, false, startTime)

            // 顶层规则：检查是否所有源码都被消费
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
            // 出栈（无论成功、return、异常都会执行）
            this.loopDetectionSet.delete(key)
        }
    }

    private initTopLevelData() {
        // 【顶层规则开始】重置解析器状态
        this._parseSuccess = true
        this.cstStack.length = 0
        this.loopDetectionSet.clear()
        this.initNextTokenInfo()
        this._parsedTokens = []
        this._tokenCache.clear()

        // 重置调试器的缓存和统计
        this._debugger?.resetForNewParse(this._parsedTokens)
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
     * 职责：创建 CST → 执行规则 → 成功则添加到父节点
     */
    private executeRuleCore(ruleName: string, targetFun: Function, ...args: any[]): SubhutiCst {
        const cst = new SubhutiCst()
        cst.name = ruleName
        cst.children = []

        this.cstStack.push(cst)

        // 执行规则函数
        targetFun.apply(this, args)

        this.cstStack.pop()

        // 无条件添加到父节点（容错模式需要）
        const parentCst = this.cstStack[this.cstStack.length - 1]
        if (parentCst) {
            parentCst.children!.push(cst)
        }

        // 成功时设置位置
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
                // end: lastChild?.loc?.end || cst.children[0].loc.end
                end: lastChild?.loc?.end
            }
        }
    }

    /**
     * Or 规则 - 顺序选择（PEG 风格）
     *
     * 核心逻辑：
     * - 依次尝试每个分支，第一个成功的分支生效
     * - 所有分支都失败则选择 codeIndex 变化最多的分支
     */
    Or(alternatives: SubhutiParserOr[]): void {
        if (this.parserFail) {
            return
        }

        const savedState = this.getCurState()
        const totalCount = alternatives.length
        const parentRuleName = this.curCst?.name || 'Unknown'

        // 记录失败分支的 cst
        const failedBranches: SubhutiCst[] = []

        // 进入 Or（整个 Or 调用开始）
        this._debugger?.onOrEnter?.(parentRuleName, this.lastTokenIndex)

        for (let i = 0; i < totalCount; i++) {
            const alt = alternatives[i]
            const isLast = i === totalCount - 1

            // 进入 Or 分支
            this._debugger?.onOrBranch?.(i, totalCount, parentRuleName)

            alt.alt()

            // 退出 Or 分支（无论成功还是失败）
            this._debugger?.onOrBranchExit?.(parentRuleName, i)

            if (this._parseSuccess) {
                // 退出 Or（整个 Or 调用成功结束）
                this._debugger?.onOrExit?.(parentRuleName)
                return
            }

            const cst = this.curCst

            // 失败：记录这个分支的 cst（在 restoreState 之前）
            if (cst) {
                failedBranches.push(cst)
            }

            // 前 N-1 个分支：失败后回溯并重置状态，继续尝试下一个
            if (!isLast) {
                this.restoreState(savedState)
                this._parseSuccess = true
            }
            // 最后一个分支：失败后不回溯，保持失败状态
        }

        if (this.parserFail) {
            const best = failedBranches.reduce((a, b) => {
                const aEnd = a.loc?.end?.index ?? startCodeIndex
                const bEnd = b.loc?.end?.index ?? startCodeIndex
                return aEnd >= bEnd ? a : b
            })
            this.setCurCst(best)
        }

        // 退出 Or（整个 Or 调用失败结束）
        this._debugger?.onOrExit?.(parentRuleName)
    }

    setCurCst(curCst: SubhutiCst): void {
        this.cstStack[this.cstStack.length - 1] = curCst
    }

    /**
     * Many 规则 - 0次或多次（EBNF { ... }）
     *
     * 循环执行直到失败或没消费 token
     */
    Many(fn: RuleFunction): void {
        while (this.tryAndRestore(fn)) {
            // 继续循环
        }
    }

    /**
     * ManyTolerant - 容错版 Many（用于 ModuleList 等顶层循环）
     *
     * 失败但有进展（codeIndex 变化了）时，改为 true 继续解析
     * 失败且没进展时，跳过一个 token 继续（容错恢复）
     */
    ManyTolerant(fn: RuleFunction): void {
        while (!this.isEof) {
            if (!this.tryAndRestore(fn)) {

            }
        }
    }

    /**
     * Option 规则 - 0次或1次（EBNF [ ... ]）
     *
     * 尝试执行一次，失败则回溯，不影响整体解析状态
     */
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
     * @param ruleName 规则名
     * @param startIndex 规则开始时的源码位置
     */
    private handleTopLevelError(ruleName: string, startIndex: number): void {
        // 分析模式：不抛错，用于语法验证
        if (this._analysisMode) {
            return
        }

        // Parser 只负责收集数据，错误组装由 ErrorHandler 负责
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
     * - 失败时返回 undefined，不抛异常
     * - protected: 必须通过 tokenConsumer 的封装方法消费 token
     * @param tokenName token 名称
     * @param mode 词法模式（可选，默认使用 _currentMode）
     */
    protected consume(tokenName: string, mode?: LexerMode): SubhutiCst | undefined {
        if (this.parserFail) {
            return
        }

        if (this.isEof) {
            this._parseSuccess = false
            return
        }

        // 获取当前 token（使用传入的 mode 或默认 mode）
        const effectiveMode = mode ?? DefaultMode
        const entry = this._getOrParseToken(
            this._nextTokenInfo,
            effectiveMode
        )

        if (!entry) {
            this._parseSuccess = false
            return
        }

        const token = entry.token

        if (token.tokenName !== tokenName) {
            this._parseSuccess = false

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

        this._parsedTokens.push(token)

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

        // 添加到当前 CST
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
            nextTokenInfo: this.cloneThisNextTokenInfo(),
            curCstChildrenLength: currentCst?.children?.length || 0,
            parsedTokensLength: this.currentTokenIndex
        }
    }

    private restoreState(backData: SubhutiBackData): void {
        this.setNextTokenIndex(backData.nextTokenInfo)

        this._parsedTokens.length = backData.parsedTokensLength

        const currentCst = this.curCst
        if (currentCst) {
            currentCst.children!.length = backData.curCstChildrenLength
        }
    }

    /**
     * 检查是否已到达源码末尾
     */
    get isEof(): boolean {
        // 先检查是否已经到达代码末尾
        if (this.lastTokenEndCodeIndex >= this._sourceCode.length) {
            return true
        }

        // 尝试获取下一个 token（会跳过空白）
        const entry = this._getOrParseToken(
            this._nextTokenInfo,
            DefaultMode
        )
        return entry === null
    }

    /**
     * 尝试执行函数，失败时自动回溯并重置状态
     *
     * @param fn 要执行的函数
     * @returns true: 成功且消费了 token，false: 失败或没消费 token
     */
    private tryAndRestore(fn: () => void): boolean {
        if (this.parserFailOrIsEof) {
            return false
        }
        const savedState = this.getCurState()
        const startIndex = this.lastTokenIndex

        fn()

        if (this.parserFail) {
            // 记录部分匹配并回溯
            this.restoreState(savedState)
            this._parseSuccess = true
            return false
        }

        // 成功但没消费 token → 返回 false（防止无限循环）
        return this.lastTokenIndex !== startIndex
    }

    /**
     * 应用缓存结果（恢复状态）
     */
    private applyCachedResult(cached: SubhutiPackratCacheResult): SubhutiCst {
        // 恢复消费的 token
        if (cached.parsedTokens && cached.parsedTokens.length > 0) {
            this._parsedTokens.push(...cached.parsedTokens)
            this.setNextTokenIndex(cached.nextTokenInfo)
        }

        this._parseSuccess = cached.parseSuccess

        // 成功时添加到父节点
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
     * 获取 token 上下文（从 parsedTokens 获取最近的 N 个 token）
     *
     * @param contextSize - 上下文大小（默认 2）
     * @returns token 上下文数组
     */
    private getTokenContext(contextSize: number = 2): SubhutiMatchToken[] {
        const tokens = this._parsedTokens
        const len = tokens.length
        const start = Math.max(0, len - contextSize)
        return tokens.slice(start)
    }
}

