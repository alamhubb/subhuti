import {SubhutiCreateToken, DefaultMode, type LexerMode} from './struct/SubhutiCreateToken.ts'
import SubhutiMatchToken from './struct/SubhutiMatchToken.ts'
import {NextTokenInfo} from "./SubhutiParser.ts";

/**
 * Token 缓存条目
 */
export interface TokenCacheEntry {
    token: SubhutiMatchToken
    nextTokenInfo: NextTokenInfo
}

/**
 * Lexer 状态（用于增量解析）
 */
export interface LexerState {
    position: number
    rowNum: number
    columnNum: number
    lastTokenRowNum: number
    lastTokenName: string | null
}

/**
 * Subhuti Lexer - 词法分析器
 *
 * 核心特性：
 * - 预编译正则（构造时一次性处理）
 * - 词法层 lookahead
 * - Token mode 支持（用于上下文相关的词法规则）
 */
export default class SubhutiLexer {
    private readonly _allTokens: SubhutiCreateToken[]
    private _lastRowNum = 1

    constructor(tokens: SubhutiCreateToken[]) {
        // 预编译：给所有正则加 ^ 锚点
        const processedTokens = tokens.map(token => {
            if (!token.pattern) return token
            return {
                ...token,
                pattern: new RegExp('^(?:' + token.pattern.source + ')', token.pattern.flags)
            }
        })

        // 排序：有 mode 的 token 优先，这样传入特定 mode 时会先匹配带 mode 的 token
        this._allTokens = processedTokens.sort((a, b) => {
            if (a.mode && !b.mode) return -1  // a 有 mode，优先
            if (!a.mode && b.mode) return 1   // b 有 mode，优先
            return 0  // 保持原顺序
        })
    }

    /**
     * 检查 lookahead 约束
     * @returns true 表示通过检查，false 表示应跳过此 token
     */
    private _checkLookahead(
        token: SubhutiCreateToken,
        remaining: string,
        matchLength: number
    ): boolean {
        const lookahead = token.lookaheadAfter
        if (!lookahead) return true

        const afterText = remaining.slice(matchLength)

        // not: 后面不能是指定内容
        if (lookahead.not) {
            const shouldSkip = lookahead.not instanceof RegExp
                ? lookahead.not.test(afterText)
                : afterText.startsWith(lookahead.not)
            if (shouldSkip) return false
        }

        // is: 后面必须是指定内容
        if (lookahead.is) {
            const matches = lookahead.is instanceof RegExp
                ? lookahead.is.test(afterText)
                : afterText.startsWith(lookahead.is)
            if (!matches) return false
        }

        // in: 后面必须匹配集合中的某一项
        if (lookahead.in && lookahead.in.length > 0) {
            const matchesAny = lookahead.in.some(pattern =>
                pattern instanceof RegExp
                    ? pattern.test(afterText)
                    : afterText.startsWith(pattern)
            )
            if (!matchesAny) return false
        }

        // notIn: 后面不能匹配集合中的任何一项
        if (lookahead.notIn && lookahead.notIn.length > 0) {
            const matchesAny = lookahead.notIn.some(pattern =>
                pattern instanceof RegExp
                    ? pattern.test(afterText)
                    : afterText.startsWith(pattern)
            )
            if (matchesAny) return false
        }

        return true
    }

    private _createMatchToken(
        token: SubhutiCreateToken,
        value: string,
        index: number,
        rowNum: number,
        columnNum: number
    ): SubhutiMatchToken {
        // 计算结束位置（考虑多行 token）
        const {endRowNum, columnEndNum} = this._calcEndPosition(value, rowNum, columnNum)

        return {
            tokenName: token.name,
            tokenValue: value,
            codeIndex: index,
            line: rowNum,
            column: columnNum,
            hasLineBreakBefore: rowNum > this._lastRowNum
        }
    }

    /**
     * 计算 token 的结束位置（行号和列号）
     */
    private _calcEndPosition(
        value: string,
        startRowNum: number,
        startColumnNum: number
    ): { endRowNum: number; columnEndNum: number } {
        const lineBreaks = value.match(/\r\n|[\n\r\u2028\u2029]/g)

        if (!lineBreaks || lineBreaks.length === 0) {
            // 单行 token
            return {
                endRowNum: startRowNum,
                columnEndNum: startColumnNum + value.length - 1
            }
        }

        // 多行 token
        const endRowNum = startRowNum + lineBreaks.length
        const lastBreakIndex = value.lastIndexOf(lineBreaks[lineBreaks.length - 1])
        const lastBreakLen = lineBreaks[lineBreaks.length - 1].length
        const columnEndNum = value.length - lastBreakIndex - lastBreakLen

        return {endRowNum, columnEndNum}
    }

    // ============================================
    // 按需词法分析 API
    // ============================================

    /**
     * 创建初始词法状态
     */
    createInitialState(): LexerState {
        return {
            position: 0,
            rowNum: 1,
            columnNum: 1,
            lastTokenRowNum: 1,
            lastTokenName: null
        }
    }

    /**
     * 在指定位置用指定模式读取单个 token
     *
     * @param code 源代码
     * @param codeIndex 起始位置
     * @param line 起始行号
     * @param column 起始列号
     * @param mode 词法模式（默认 DefaultMode）
     * @param lastTokenName 上一个 token 的名称（用于上下文约束）
     * @returns TokenCacheEntry 或 null（EOF）
     */
    readTokenAt(
        code: string,
        nextTokenInfo: NextTokenInfo,
        mode: LexerMode = DefaultMode,
        lastTokenName: string | null = null
    ): TokenCacheEntry | null {
        let pos = nextTokenInfo.index
        let rowNum = nextTokenInfo.line
        let columnNum = nextTokenInfo.column
        let lastRowNum = nextTokenInfo.line
        let currentLastTokenName = lastTokenName

        while (pos < code.length) {
            const matched = this._matchTokenWithMode(
                code,
                pos,
                rowNum,
                columnNum,
                currentLastTokenName,
                lastRowNum,
                mode
            )

            if (!matched) {
                const errorChar = code[pos]
                throw new Error(
                    `Unexpected character "${errorChar}" at position ${pos} (line ${rowNum}, column ${columnNum})`
                )
            }

            const valueLength = matched.token.tokenValue.length
            const nextPos = pos + valueLength

            // 使用 _calcEndPosition 计算结束位置，避免重复代码
            const {endRowNum, columnEndNum} = this._calcEndPosition(matched.token.tokenValue, rowNum, columnNum)
            const nextRowNum = endRowNum
            const nextColumnNum = endRowNum > rowNum ? columnEndNum + 1 : columnNum + valueLength

            if (matched.skip) {
                pos = nextPos
                rowNum = nextRowNum
                columnNum = nextColumnNum
                continue
            }

            const token: SubhutiMatchToken = {
                tokenName: matched.token.tokenName,
                tokenValue: matched.token.tokenValue,
                codeIndex: pos,
                line: rowNum,
                column: columnNum,
                hasLineBreakBefore: rowNum > lastRowNum
            }

            return {
                token,
                nextTokenInfo: {
                    index: nextPos,
                    line: nextRowNum,
                    column: nextColumnNum,
                }
            }
        }

        return null  // EOF
    }

    /**
     * 带词法模式的 token 匹配
     */
    private _matchTokenWithMode(
        code: string,
        index: number,
        rowNum: number,
        columnNum: number,
        lastTokenName: string | null,
        lastRowNum: number,
        mode: LexerMode
    ) {
        const remaining = code.slice(index)

        for (const token of this._allTokens) {
            // mode 检查：如果 token 指定了 mode，必须匹配当前 mode
            if (token.mode && token.mode !== mode) {
                continue
            }

            const match = remaining.match(token.pattern!)
            if (!match) continue

            // 上下文约束检查
            if (token.contextConstraint?.onlyAtStart && index !== 0) {
                continue
            }

            if (token.contextConstraint?.onlyAtLineStart && rowNum <= lastRowNum) {
                continue
            }

            if (token.contextConstraint?.onlyAfter) {
                if (!lastTokenName || !token.contextConstraint.onlyAfter.has(lastTokenName)) {
                    continue
                }
            }

            if (token.contextConstraint?.notAfter) {
                if (lastTokenName && token.contextConstraint.notAfter.has(lastTokenName)) {
                    continue
                }
            }

            // 词法层 lookahead 检查
            if (!this._checkLookahead(token, remaining, match[0].length)) {
                continue
            }

            // 计算结束位置（考虑多行 token）
            const {endRowNum, columnEndNum} = this._calcEndPosition(match[0], rowNum, columnNum)

            return {
                token: {
                    tokenName: token.name,
                    tokenValue: match[0],
                    index: index,
                    rowNum: rowNum,
                    endRowNum: endRowNum,
                    columnStartNum: columnNum,
                    columnEndNum: columnEndNum,
                    hasLineBreakBefore: rowNum > lastRowNum
                },
                skip: token.skip
            }
        }

        return null
    }
}
