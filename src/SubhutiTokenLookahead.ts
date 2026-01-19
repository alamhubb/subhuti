/**
 * Subhuti Token Lookahead - Token 前瞻基础类（抽象）
 *
 * 职责：
 * 1. Token 前瞻（只读查询）
 * 2. 行终止符检查
 * 3. 对应 ECMAScript® 2025 规范中的所有 [lookahead ...] 约束
 * 4. 按需词法分析（On-Demand Lexing）
 *
 * 设计模式：
 * - 抽象类，定义访问接口
 * - 子类（SubhutiParser）实现具体访问逻辑
 * - 完全基于按需词法分析（On-Demand Lexing）
 *
 * 规范地址：https://tc39.es/ecma262/2025/#sec-grammar-summary
 *
 * @version 5.0.0 - 整合按需词法分析
 */

import type SubhutiMatchToken from "./struct/SubhutiMatchToken.ts"
import SubhutiLexer, {TokenCacheEntry} from "./SubhutiLexer.ts"
import {SubhutiCreateToken, DefaultMode, type LexerMode} from "./struct/SubhutiCreateToken.ts"

// ============================================
// 类型定义
// ============================================

export interface NextTokenInfo {
    /** 源码位置 */
    codeIndex: number
    /** 行号 */
    line: number
    /** 列号 */
    column: number
}

export default class SubhutiTokenLookahead {
    // ============================================
    // 按需词法分析相关字段
    // ============================================

    /** 词法分析器 */
    protected _lexer: SubhutiLexer | null = null

    /** 源代码 */
    protected _sourceCode: string = ''

    /** 下一个 token 的位置信息 */
    protected _nextTokenInfo: NextTokenInfo = {codeIndex: 0, line: 1, column: 1}

    /** Token 缓存：位置 → 模式 → 缓存条目 */
    protected _tokenCache: Map<number, Map<LexerMode, TokenCacheEntry>> = new Map()

    /** 已解析的 token 列表（用于输出给使用者） */
    private _parsedTokens: SubhutiMatchToken[] = []

    /** 上一个 token 名称（用于上下文约束）- 从 parsedTokens 动态获取 */
    protected get _lastTokenName(): string | null {
        return this.lastToken?.tokenName
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

    /**
     * 获取已解析的 token 列表
     */
    get parsedTokens(): SubhutiMatchToken[] {
        return this._parsedTokens
    }

    protected initParserTokens() {
        this._parsedTokens = []
    }

    // ============================================
    // 按需词法分析方法
    // ============================================

    /**
     * 获取或解析指定位置和模式的 token
     *
     * @param nextTokenInfo 位置信息
     * @param mode 词法模式（由插件提供，如 'regexp', 'templateTail' 等，空字符串表示默认模式）
     * @returns TokenCacheEntry 或 null（EOF）
     */
    protected _getOrParseToken(
        nextTokenInfo: NextTokenInfo,
        mode: LexerMode = DefaultMode
    ): TokenCacheEntry | null {
        if (!this._lexer) return null

        // 容错：nextTokenInfo 可能为 undefined（代码不完整时）
        if (!nextTokenInfo) {
            throw new Error('[Parser Error] nextTokenInfo is undefined - 代码不完整或解析器状态异常')
        }

        // 1. 查缓存
        const positionCache = this._tokenCache.get(nextTokenInfo.codeIndex)
        if (positionCache?.has(mode)) {
            return positionCache.get(mode)!
        }

        // 2. 解析新 token
        const entry = this._lexer.readTokenAt(
            this._sourceCode,
            nextTokenInfo,
            mode,
            this._lastTokenName
        )

        if (!entry) return null  // EOF

        // 3. 存入缓存
        if (!positionCache) {
            this._tokenCache.set(nextTokenInfo.codeIndex, new Map())
        }
        this._tokenCache.get(nextTokenInfo.codeIndex)!.set(mode, entry)

        return entry
    }

    /**
     * 初始化下一个 token 位置信息
     */
    protected initNextTokenInfo(): void {
        this._nextTokenInfo = {codeIndex: 0, line: 1, column: 1}
    }

    /**
     * 设置下一个 token 位置信息
     */
    protected setNextTokenIndex(nextTokenInfo: NextTokenInfo): void {
        this._nextTokenInfo = {...nextTokenInfo}
    }

    /**
     * 克隆当前的下一个 token 位置信息
     */
    protected getNextTokenInfo(): NextTokenInfo {
        return {...this._nextTokenInfo}
    }

    // ============================================
    // 核心状态
    // ============================================

    /**
     * 核心状态：当前规则是否成功
     * - true: 成功，继续执行
     * - false: 失败，停止并返回 undefined
     */
    protected _parseSuccess = true

    get parserFail() {
        return !this.parserSuccess
    }

    get parserSuccess() {
        return this._parseSuccess
    }

    /**
     * 标记解析失败（用于手动失败）
     *
     * 用于自定义验证逻辑中标记解析失败
     *
     * @returns never (实际返回 undefined，但类型声明为 never 以便链式调用)
     */
    protected setParseFail() {
        this.setParserSuccessState(false)
    }

    protected setParserSuccess() {
        this.setParserSuccessState(true)
    }

    protected setParserSuccessState(success: boolean) {
        this._parseSuccess = success
    }

    /**
     * 获取当前 token（使用默认词法模式）
     */
    get nextToken(): SubhutiMatchToken | undefined {
        return this.LA(1)
    }

    // ============================================
    // 层级 1：私有查询方法（内部实现，返回 boolean）
    // ============================================

    /**
     * LA (LookAhead) - 前瞻获取 token（支持模式数组）
     *
     * 这是 parser 领域的标准术语：
     * - LA(1) = 当前 token
     * - LA(2) = 下一个 token
     * - LA(n) = 第 n 个 token
     *
     * @param offset 偏移量（1 = 当前 token，2 = 下一个...）
     * @param modes 每个位置的词法模式（可选，不传用默认值）
     * @returns token 或 undefined（EOF）
     */
    protected LA(offset: number = 1, modes?: LexerMode[]): SubhutiMatchToken | undefined {
        // 临时位置信息，用于前瞻（不影响实际位置）
        let tempInfo: NextTokenInfo = {...this._nextTokenInfo}

        for (let i = 0; i < offset; i++) {
            // 确定当前 token 的词法模式
            const mode = modes?.[i] ?? DefaultMode

            // 从缓存获取或解析
            const entry = this._getOrParseToken(tempInfo, mode)

            if (!entry) return undefined  // EOF

            // 如果是最后一个，返回 token
            if (i === offset - 1) {
                return entry.token
            }

            // 更新临时位置到下一个 token
            tempInfo = entry.nextTokenInfo
        }

        return undefined
    }

    /**
     * 前瞻：获取连续的 N 个 token
     *
     * @param count 要获取的 token 数量
     * @param modes 每个位置的词法模式（可选）
     * @returns token 数组（长度可能小于 count，如果遇到 EOF）
     */
    protected peekSequence(count: number, modes?: LexerMode[]): SubhutiMatchToken[] {
        const result: SubhutiMatchToken[] = []
        let tempInfo: NextTokenInfo = {...this._nextTokenInfo}

        for (let i = 0; i < count; i++) {
            const mode = modes?.[i] ?? DefaultMode
            const entry = this._getOrParseToken(tempInfo, mode)

            if (!entry) break  // EOF

            result.push(entry.token)
            tempInfo = entry.nextInfo
        }

        return result
    }

    /**
     * [lookahead = token]
     * 规范：正向前瞻，检查下一个 token 是否匹配
     */
    protected lookahead(tokenName: string, offset: number = 1): boolean {
        return this.LA(offset)?.tokenName === tokenName
    }

    /**
     * [lookahead ≠ token]
     * 规范：否定前瞻，检查下一个 token 是否不匹配
     */
    protected lookaheadNot(tokenName: string, offset: number = 1): boolean {
        const token = this.LA(offset)
        // EOF 时返回 true（认为"不是任何具体 token"）
        return token ? token.tokenName !== tokenName : true
    }

    /**
     * [lookahead ∈ {t1, t2, ...}]
     * 规范：正向集合前瞻，检查下一个 token 是否在集合中
     */
    protected lookaheadIn(tokenNames: string[], offset: number = 1): boolean {
        const token = this.LA(offset)
        return token ? tokenNames.includes(token.tokenName) : false
    }

    /**
     * [lookahead ∉ {t1, t2, ...}]
     * 规范：否定集合前瞻，检查下一个 token 是否不在集合中
     */
    protected lookaheadNotIn(tokenNames: string[], offset: number = 1): boolean {
        const token = this.LA(offset)
        // EOF 时返回 true（认为"不在任何集合中"）
        return token ? !tokenNames.includes(token.tokenName) : true
    }

    /**
     * [lookahead = t1 t2 ...]
     * 规范：序列前瞻，检查连续的 token 序列是否匹配
     */
    protected lookaheadSequence(tokenNames: string[]): boolean {
        const peeked = this.peekSequence(tokenNames.length)
        if (peeked.length !== tokenNames.length) {
            return false
        }
        return peeked.every((token, i) => token.tokenName === tokenNames[i])
    }

    /**
     * [lookahead ≠ t1 t2 ...]
     * 规范：否定序列前瞻，检查连续的 token 序列是否不匹配
     */
    protected lookaheadNotSequence(tokenNames: string[]): boolean {
        return !this.lookaheadSequence(tokenNames)
    }


    /**
     * 检查：token 序列匹配且中间无换行符
     *
     * @param tokenNames token 名称序列
     * @returns true = 序列匹配且中间都在同一行
     *
     * @example
     * // async [no LineTerminator here] function
     * if (this.lookaheadSequenceNoLT(['AsyncTok', 'FunctionTok'])) { ... }
     */
    protected lookaheadSequenceNoLT(tokenNames: string[]): boolean {
        const peeked = this.peekSequence(tokenNames.length)
        if (peeked.length !== tokenNames.length) {
            return false
        }

        // 检查每个 token 的名称匹配
        for (let i = 0; i < tokenNames.length; i++) {
            if (peeked[i].tokenName !== tokenNames[i]) {
                return false
            }

            // 检查第二个及之后的 token 前面没有换行符
            if (i > 0 && peeked[i].hasLineBreakBefore) {
                return false
            }
        }

        return true
    }

    /**
     * [no LineTerminator here]
     * 检查当前 token 前是否有换行符
     */
    protected lookaheadHasLineBreak(): boolean {
        return this.nextToken?.hasLineBreakBefore ?? false
    }

    // ============================================
    // 层级 2：受保护的断言方法
    // - 自动设置 _parseSuccess
    // - 返回 boolean，支持灵活组合
    // ============================================

    /**
     * 断言：当前 token 不能是指定类型
     * 如果是，则标记失败
     *
     * @param tokenName - 不允许的 token 类型
     * @param offset - 偏移量（默认 1）
     * @returns 断言是否成功
     *
     * @example
     * // [lookahead ≠ else]
     * this.assertLookaheadNot('ElseTok')
     */
    protected assertLookaheadNot(tokenName: string, offset: number = 1): boolean {
        if (!this._parseSuccess) return false

        const result = this.lookaheadNot(tokenName, offset)
        if (!result) {
            this._parseSuccess = false
        }
        return result
    }

    /**
     * 断言：当前 token 不能在指定集合中
     * 如果在，则标记失败
     *
     * @param tokenNames - 不允许的 token 类型列表
     * @param offset - 偏移量（默认 1）
     * @returns 断言是否成功
     *
     * @example
     * // [lookahead ∉ {{, function, class}]
     * this.assertLookaheadNotIn(['LBrace', 'FunctionTok', 'ClassTok'])
     */
    protected assertLookaheadNotIn(tokenNames: string[], offset: number = 1): boolean {
        if (!this._parseSuccess) return false

        const result = this.lookaheadNotIn(tokenNames, offset)
        if (!result) {
            this._parseSuccess = false
        }
        return result
    }

    /**
     * 断言：当前 token 前不能有换行符
     * 如果有，则标记失败
     *
     * @returns 断言是否成功
     *
     * @example
     * // [no LineTerminator here]
     * this.assertNoLineBreak()
     */
    protected assertNoLineBreak(): boolean {
        if (!this._parseSuccess) return false

        const result = !this.lookaheadHasLineBreak()
        if (!result) {
            this._parseSuccess = false
        }
        return result
    }

    /**
     * 断言：条件必须为真
     * 如果条件为假，则标记失败
     *
     * @param condition - 要检查的条件
     * @returns 断言是否成功（即条件本身）
     *
     * @example
     * // 断言：标识符不能是保留字
     * const cst = this.tokenConsumer.Identifier()
     * this.assertCondition(!(cst && ReservedWords.has(cst.value!)))
     */
    protected assertCondition(condition: boolean): boolean {
        if (!this._parseSuccess) return false

        if (!condition) {
            this._parseSuccess = false
        }
        return condition
    }


    // ============================================
    // Token 匹配方法 (Token Matching)
    // 符合 Babel/Acorn 的 match/isContextual 设计模式
    // ============================================

    /**
     * 检查当前 token 是否匹配指定类型
     * 对应 Babel 的 match 方法
     * @param tokenName token 类型名称
     */
    protected match(tokenName: string): boolean {
        return this.nextToken?.tokenName === tokenName
    }

}

