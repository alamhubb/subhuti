/**
 * Subhuti Parser - 高性能 PEG Parser 框架
 *
 * 核心特性：
 * - Packrat Parsing（线性时间复杂度，LRU 缓存）
 * - 返回值语义（成功返回 CST，失败返回 undefined）
 *
 * 架构设计：
 * - 继承 SubhutiTokenLookahead（前瞻能力）
 * - 实现 ITokenConsumerContext（提供消费接口）
 * - 支持泛型扩展 SubhutiTokenConsumer
 *
 * @version 5.0.0
 */

import SubhutiTokenLookahead from "./SubhutiTokenLookahead.ts"
import SubhutiCst from "./struct/SubhutiCst.ts";
import type SubhutiMatchToken from "./struct/SubhutiMatchToken.ts";
import {SubhutiErrorHandler, ParsingError} from "./SubhutiError.ts";
import {SubhutiTraceDebugger} from "./SubhutiDebug.ts";
import {SubhutiPackratCache, type SubhutiPackratCacheResult} from "./SubhutiPackratCache.ts";
import SubhutiTokenConsumer from "./SubhutiTokenConsumer.ts";
import {SubhutiDebugRuleTracePrint, setShowRulePath} from "./SubhutiDebugRuleTracePrint.ts";
import SubhutiLexer, {TokenCacheEntry} from "./SubhutiLexer.ts";
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
    /** 源码位置 */
    codeIndex: number
    /** 行号 */
    codeLine: number
    /** 列号 */
    codeColumn: number
    /** 上一个 token 名称 */
    lastTokenName: string | null
    /** CST children 长度 */
    curCstChildrenLength: number
    /** 已解析 token 数量（用于恢复 parsedTokens） */
    parsedTokensLength: number
}


export interface NextTokenInfo {
    codeIndex: number,
    rowNum: number,
    columnNumber: number
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

    // ============================================
    // 按需词法分析相关字段（新架构）
    // ============================================

    /** 词法分析器 */
    protected _lexer: SubhutiLexer | null = null

    /** 源代码 */
    protected _sourceCode: string = ''

    /** 当前源码位置，如果用tokenindex会导致tokenindex动态变化缓存问题，因为同样的代码不同的模式解析出来的tokens不一致 */
    protected _codeIndex: number = 0

    /** 当前行号 */
    protected _codeLine: number = 1

    /** 当前列号 */
    protected _codeColumn: number = 1

    /** 上一个 token 名称（用于上下文约束）- 从 parsedTokens 动态获取 */
    protected get _lastTokenName(): string | null {
        const len = this._parsedTokens.length
        return len > 0 ? this._parsedTokens[len - 1].tokenName : null
    }

    protected _nextTokenInfo: NextTokenInfo | null = null

    /** Token 缓存：位置 → 模式 → 缓存条目 */
    protected _tokenCache: Map<number, Map<LexerMode, TokenCacheEntry>> = new Map()

    /** 已解析的 token 列表（用于输出给使用者） */
    protected _parsedTokens: SubhutiMatchToken[] = []

    /**
     * 分析模式标志
     * - true: 分析模式（用于语法验证，不抛异常）
     * - false: 正常模式（用于解析，抛异常）
     */
    private _analysisMode: boolean = false

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
        this._codeIndex = 0
        this._codeLine = 1
        this._codeColumn = 1
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
        return this._parsedTokens.length - 1
    }

    /**
     * 获取当前正在处理的 token 索引（下一个将被 consume 的 token）
     * @returns 当前 token 索引
     */
    get currentTokenIndex(): number {
        return this._parsedTokens.length
    }

    // ============================================
    // 按需词法分析
    // ============================================

    /**
     * 获取或解析指定位置和模式的 token
     *
     * @param codeIndex 源码位置
     * @param line 行号
     * @param column 列号
     * @param mode 词法模式（由插件提供，如 'regexp', 'templateTail' 等，空字符串表示默认模式）
     * @returns TokenCacheEntry 或 null（EOF）
     */
    protected _getOrParseToken(
        codeIndex: number,
        line: number,
        column: number,
        mode: LexerMode = DefaultMode
    ): TokenCacheEntry | null {
        if (!this._lexer) return null

        // 1. 查缓存
        const positionCache = this._tokenCache.get(codeIndex)
        if (positionCache?.has(mode)) {
            return positionCache.get(mode)!
        }

        // 2. 解析新 token
        const entry = this._lexer.readTokenAt(
            this._sourceCode,
            codeIndex,
            line,
            column,
            mode,
            this._lastTokenName
        )

        if (!entry) return null  // EOF

        // 3. 存入缓存
        if (!positionCache) {
            this._tokenCache.set(codeIndex, new Map())
        }
        this._tokenCache.get(codeIndex)!.set(mode, entry)

        return entry
    }

    /**
     * LA (LookAhead) - 前瞻获取 token（支持模式数组）
     *
     * @param offset 偏移量（1 = 当前 token，2 = 下一个...）
     * @param modes 每个位置的词法模式（可选，不传用默认值）
     * @returns token 或 undefined（EOF）
     */
    protected override LA(offset: number = 1, modes?: LexerMode[]): SubhutiMatchToken | undefined {
        let currentIndex = this._codeIndex
        let currentLine = this._codeLine
        let currentColumn = this._codeColumn

        for (let i = 0; i < offset; i++) {
            // 确定当前 token 的词法模式
            const mode = modes?.[i] ?? DefaultMode

            // 从缓存获取或解析
            const entry = this._getOrParseToken(currentIndex, currentLine, currentColumn, mode)

            if (!entry) return undefined  // EOF

            // 如果是最后一个，返回 token
            if (i === offset - 1) {
                return entry.token
            }

            // 否则，移动到下一个位置
            currentIndex = entry.nextCodeIndex
            currentLine = entry.nextLine
            currentColumn = entry.nextColumn
        }

        return undefined
    }

    /**
     * peek - 前瞻获取 token（支持模式数组）
     */
    protected override peek(offset: number = 1, modes?: LexerMode[]): SubhutiMatchToken | undefined {
        return this.LA(offset, modes)
    }

    /**
     * 获取当前 token（使用默认词法目标）
     */
    override get curToken(): SubhutiMatchToken | undefined {
        return this.LA(1)
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
     * 检测是否是直接或间接左递归
     *
     * ✅ 这个方法可以准确判断左递归
     * ❌ 不能判断是否是 Or 分支遮蔽（返回 false 只表示不是左递归）
     *
     * @param ruleName 当前规则名称
     * @param ruleStack 规则调用栈
     * @returns true: 确定是左递归, false: 不是左递归（但不能确定是什么问题）
     */
    private isDirectLeftRecursion(ruleName: string, ruleStack: string[]): boolean {
        // 检查规则栈中是否有任何规则出现了 >= 2 次
        // 这可以检测直接左递归和间接左递归

        const ruleCounts = new Map<string, number>()

        for (const rule of ruleStack) {
            ruleCounts.set(rule, (ruleCounts.get(rule) || 0) + 1)
        }

        // 如果任何规则出现 >= 2 次，说明有递归
        for (const count of ruleCounts.values()) {
            if (count >= 2) {
                return true  // ✅ 确定是左递归（直接或间接）
            }
        }

        // 否则，不是左递归
        // 但可能是其他问题：Or 分支遮蔽、规则实现错误、语法错误等
        return false  // ❌ 不是左递归（但不确定具体是什么问题）
    }

    /**
     * 抛出循环错误信息
     *
     * @param ruleName 当前规则名称
     */
    private throwLoopError(ruleName: string): never {
        // 🔍 分析模式：不抛异常，直接返回
        if (this._analysisMode) {
            // 标记解析失败，让 RuleCollector 知道这个规则有问题
            this._parseSuccess = false
            return undefined as never
        }

        // 获取当前 token 信息
        const currentToken = this.curToken

        // 从 parsedTokens 获取上下文（最近 2 个 token）
        const tokenContext = this.getTokenContext(2)

        // 获取缓存统计
        const cacheStatsReport = this._cache.getStatsReport()

        // 🔍 分析循环类型：真正的左递归 vs Or 分支遮蔽
        const ruleStack = this.getRuleStack()
        const isDirectLeftRecursion = this.isDirectLeftRecursion(ruleName, ruleStack)
        const errorType = isDirectLeftRecursion ? 'left-recursion' : 'or-branch-shadowing'

        // 创建循环错误（平铺结构）
        throw this._errorHandler.createError({
            type: errorType,
            expected: '',
            found: currentToken,
            position: {
                tokenIndex: this.currentTokenIndex,
                codeIndex: this._codeIndex,
                line: currentToken?.rowNum || this._codeLine,
                column: currentToken?.columnStartNum || this._codeColumn
            },
            ruleStack: [...ruleStack],
            loopRuleName: ruleName,
            loopDetectionSet: Array.from(this.loopDetectionSet),
            loopCstDepth: this.cstStack.length,
            loopCacheStats: {
                hits: cacheStatsReport.hits,
                misses: cacheStatsReport.misses,
                hitRate: cacheStatsReport.hitRate,
                currentSize: cacheStatsReport.currentSize
            },
            loopTokenContext: tokenContext,
            hint: '检查规则定义，确保在递归前消费了 token'
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
                const endTokenIndex = this.currentTokenIndex

                // 提取本次规则消费的 token
                const consumedTokens = this._parseSuccess
                    ? this._parsedTokens.slice(startTokenIndex)
                    : undefined

                this._cache.set(ruleName, startTokenIndex, {
                    endTokenIndex: endTokenIndex,
                    cst: cst,
                    parseSuccess: this._parseSuccess,
                    parsedTokens: consumedTokens
                })
            }

            this.onRuleExitDebugHandler(ruleName, cst, isTopLevel, startTime)

            // 顶层规则：检查是否所有源码都被消费
            if (isTopLevel && this._parseSuccess) {
                if (!this.isEof) {
                    const nextToken = this.LA(1)
                    throw new Error(
                        `Parser internal error: parsing succeeded but source code remains unconsumed. ` +
                        `Next token: "${nextToken?.tokenValue}" (${nextToken?.tokenName}) at position ${this._codeIndex}`
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
        this._codeIndex = 0
        this._codeLine = 1
        this._codeColumn = 1
        this._parsedTokens = []
        this._tokenCache.clear()

        // 重置调试器的缓存和统计
        this._debugger?.resetForNewParse?.(this._parsedTokens)
    }

    private checkRuleIsThisClass(ruleName: string, className: string): boolean {
        if (this.hasOwnProperty(ruleName)) {
            if (className !== this.className) {
                return true
            }
        }
        return false
    }

    private onRuleExitDebugHandler(
        ruleName: string,
        cst: SubhutiCst | undefined,
        isTopLevel: boolean,
        startTime?: number
    ): void {
        if (cst && !cst.children?.length) {
            cst.children = undefined
        }

        if (!isTopLevel) {
            this._debugger?.onRuleExit(ruleName, false, startTime)
        } else {
            // 顶层规则完成，输出调试信息
            if (this._debugger) {
                if ('setCst' in this._debugger) {
                    (this._debugger as any).setCst(cst)
                }
                (this._debugger as any)?.autoOutput?.()
            }
        }
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

        // 成功时添加到父节点并设置位置
        if (this._parseSuccess) {
            const parentCst = this.cstStack[this.cstStack.length - 1]
            if (parentCst) {
                parentCst.children!.push(cst)
            }
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
     * - 所有分支都失败则整体失败
     *
     * 优化：只有消费了 token 才需要回溯（没消费 = 状态没变）
     */
    Or(alternatives: SubhutiParserOr[]): void {
        if (this.parserFail) {
            return
        }

        const savedState = this.saveState()
        const startCodeIndex = this._codeIndex
        const totalCount = alternatives.length
        const parentRuleName = this.curCst?.name || 'Unknown'

        // 进入 Or（整个 Or 调用开始）
        this._debugger?.onOrEnter?.(parentRuleName, startCodeIndex)

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

            // 前 N-1 个分支：失败后回溯并重置状态，继续尝试下一个
            if (!isLast) {
                this.restoreState(savedState)
                this._parseSuccess = true
            }
            // 最后一个分支：失败后不回溯，保持失败状态
        }

        // 退出 Or（整个 Or 调用失败结束）
        this._debugger?.onOrExit?.(parentRuleName)
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

        // 正常模式：抛出解析错误
        const noTokenConsumed = this.currentTokenIndex === startIndex
        const found = this.curToken

        throw this._errorHandler.createError({
            type: 'parsing',
            expected: noTokenConsumed ? 'valid syntax' : 'EOF (end of file)',
            found: found,
            position: {
                tokenIndex: this.currentTokenIndex,
                codeIndex: this._codeIndex,
                line: found?.rowNum ?? this._codeLine,
                column: found?.columnStartNum ?? this._codeColumn
            },
            ruleStack: this.getRuleStack().length > 0 ? this.getRuleStack() : [ruleName]
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
            this._codeIndex,
            this._codeLine,
            this._codeColumn,
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
                this._codeIndex,
                token.tokenValue,
                token.tokenName,
                tokenName,
                false
            )

            return
        }

        this._debugger?.onTokenConsume(
            this._codeIndex,
            token.tokenValue,
            token.tokenName,
            tokenName,
            true
        )

        const cst = this.generateCstByToken(token)

        // 更新位置
        this._codeIndex = entry.nextCodeIndex
        this._codeLine = entry.nextLine
        this._codeColumn = entry.nextColumn

        // 添加到已解析列表（_lastTokenName 会自动从 parsedTokens 获取）
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
                index: token.index || 0,
                line: token.rowNum || 0,
                column: token.columnStartNum || 0
            },
            end: {
                index: (token.index || 0) + token.tokenValue.length,
                line: token.rowNum || 0,
                column: token.columnEndNum || 0
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
    private saveState(): SubhutiBackData {
        const currentCst = this.curCst
        return {
            codeIndex: this._codeIndex,
            codeLine: this._codeLine,
            codeColumn: this._codeColumn,
            lastTokenName: this._lastTokenName,
            curCstChildrenLength: currentCst?.children?.length || 0,
            parsedTokensLength: this._parsedTokens.length
        }
    }

    private restoreState(backData: SubhutiBackData): void {
        const fromIndex = this._codeIndex
        const toIndex = backData.codeIndex

        if (fromIndex !== toIndex) {
            this._debugger?.onBacktrack?.(fromIndex, toIndex)
        }

        this._codeIndex = backData.codeIndex
        this._codeLine = backData.codeLine
        this._codeColumn = backData.codeColumn

        // 恢复 parsedTokens（_lastTokenName 会自动从 parsedTokens 获取）
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
        if (this._codeIndex >= this._sourceCode.length) {
            return true
        }

        // 尝试获取下一个 token（会跳过空白）
        try {
            const entry = this._getOrParseToken(
                this._codeIndex,
                this._codeLine,
                this._codeColumn,
                DefaultMode
            )
            return entry === null
        } catch {
            // 如果词法分析器无法识别字符，说明不是 EOF
            // 让后续的消费操作处理这个错误
            return false
        }
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
        const savedState = this.saveState()
        const startIndex = this._codeIndex

        fn()

        if (this.parserFail) {
            // 记录部分匹配并回溯
            this.restoreState(savedState)
            this._parseSuccess = true
            return false
        }

        // 成功但没消费 token → 返回 false（防止无限循环）
        return this._codeIndex !== startIndex
    }

    /**
     * 应用缓存结果（恢复状态）
     */
    private applyCachedResult(cached: SubhutiPackratCacheResult): SubhutiCst {
        // 恢复消费的 token
        if (cached.parsedTokens && cached.parsedTokens.length > 0) {
            this._parsedTokens.push(...cached.parsedTokens)

            // 从最后一个 token 恢复词法分析位置
            const lastToken = cached.parsedTokens[cached.parsedTokens.length - 1]
            this._codeIndex = lastToken.index + lastToken.tokenValue.length
            this._codeLine = lastToken.rowNum
            this._codeColumn = lastToken.columnEndNum
            // _lastTokenName 会自动从 parsedTokens 获取
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

    /**
     * 生成当前规则路径的字符串（用于错误信息）
     *
     * @returns 格式化后的规则路径字符串数组
     */
    private formatCurrentRulePath(): string[] {
        if (!this._debugger) {
            // 如果没有调试器，使用简单格式
            return this.formatSimpleRulePath()
        }

        // 使用调试器的格式化方法
        const ruleStack = this._debugger.ruleStack
        if (!ruleStack || ruleStack.length === 0) {
            return ['  (empty)']
        }

        return SubhutiDebugRuleTracePrint.formatPendingOutputs_NonCache_Impl(ruleStack)
    }

    /**
     * 简单格式化规则路径（当没有调试器时）
     */
    private formatSimpleRulePath(): string[] {
        const ruleStack = this.getRuleStack()
        if (ruleStack.length === 0) {
            return ['  (empty)']
        }

        const lines: string[] = []
        for (let i = 0; i < ruleStack.length; i++) {
            const rule = ruleStack[i]
            const isLast = i === ruleStack.length - 1
            const indent = '  '.repeat(i)
            const connector = i === 0 ? '' : '└─ '
            const marker = isLast ? ' ← 当前位置' : ''

            lines.push(`  ${indent}${connector}${rule}${marker}`)
        }

        return lines
    }

    /**
     * 创建无限循环错误
     *
     * @param ruleName - 规则名称
     * @param hint - 修复提示
     * @returns ParsingError 实例（分析模式下返回 null）
     */
    private createInfiniteLoopError(ruleName: string, hint: string): ParsingError {
        // 🔍 分析模式：不创建错误，标记失败并返回 null
        if (this._analysisMode) {
            this._parseSuccess = false
            return null as any  // 分析模式下不会真正使用这个返回值
        }

        // 生成规则路径
        const rulePathLines = this.formatCurrentRulePath()
        const rulePath = rulePathLines.join('\n')

        // 🔍 检测是否是左递归（准确判断）
        const ruleStack = this.getRuleStack()
        const isLeftRecursion = this.isDirectLeftRecursion(ruleName, ruleStack)

        // ✅ 只有确定是左递归时才使用 'left-recursion' 类型
        // ❌ 不确定的情况使用 'infinite-loop'，不断言是 Or 遮蔽
        const errorType = isLeftRecursion ? 'left-recursion' : 'infinite-loop'

        return this._errorHandler.createError({
            type: errorType,
            expected: '',
            found: this.curToken,
            position: {
                tokenIndex: this.currentTokenIndex,
                codeIndex: this._codeIndex,
                line: this.curToken?.rowNum || this._codeLine,
                column: this.curToken?.columnStartNum || this._codeColumn
            },
            ruleStack: [...ruleStack],
            loopRuleName: ruleName,
            loopDetectionSet: [],
            loopCstDepth: this.cstStack.length,
            loopTokenContext: this.getTokenContext(2),
            hint: hint,
            rulePath: rulePath
        })
    }
}

