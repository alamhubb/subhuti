import { SubhutiCreateToken, DefaultMode, type LexerMode } from './struct/SubhutiCreateToken.ts'
import SubhutiMatchToken from './struct/SubhutiMatchToken.ts'

/**
 * Token 缓存条目
 */
export interface TokenCacheEntry {
  token: SubhutiMatchToken
  nextCodeIndex: number
  nextLine: number
  nextColumn: number
  lastTokenName: string | null
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
   * 词法分析主入口（传统模式，一次性分析整个源码）
   * @param code 源代码
   * @returns Token 流
   */
  tokenize(code: string): SubhutiMatchToken[] {
    const result: SubhutiMatchToken[] = []
    let index = 0
    let rowNum = 1
    let columnNum = 1
    this._lastRowNum = 1

    while (index < code.length) {
      const matched = this._matchToken(code, index, rowNum, columnNum, result, DefaultMode)

      if (!matched) {
        const errorChar = code[index]
        throw new Error(
          `Unexpected character "${errorChar}" at position ${index} (line ${rowNum}, column ${columnNum})`
        )
      }

      if (!matched.skip) {
        result.push(matched.token)
        this._lastRowNum = rowNum
      }

      const valueLength = matched.token.tokenValue.length
      index += valueLength

      const lineBreaks = matched.token.tokenValue.match(/\r\n|[\n\r\u2028\u2029]/g)
      if (lineBreaks && lineBreaks.length > 0) {
        rowNum += lineBreaks.length
        const lastBreakIndex = matched.token.tokenValue.lastIndexOf(lineBreaks[lineBreaks.length - 1])
        const lastBreakLen = lineBreaks[lineBreaks.length - 1].length
        columnNum = matched.token.tokenValue.length - lastBreakIndex - lastBreakLen + 1
      } else {
        columnNum += valueLength
      }
    }

    return result
  }

  /**
   * 匹配单个 token
   */
  private _matchToken(
    code: string,
    index: number,
    rowNum: number,
    columnNum: number,
    matchedTokens: SubhutiMatchToken[],
    mode: LexerMode
  ) {
    const remaining = code.slice(index)
    const lastTokenName = matchedTokens.length > 0
      ? matchedTokens[matchedTokens.length - 1].tokenName
      : null

    for (const token of this._allTokens) {
      // mode 检查：如果 token 指定了 mode，必须匹配当前 mode
      if (token.mode && token.mode !== mode) {
        continue
      }

      const match = remaining.match(token.pattern)
      if (!match) continue

      // 上下文约束检查
      if (token.contextConstraint?.onlyAtStart && index !== 0) {
        continue
      }

      if (token.contextConstraint?.onlyAtLineStart && rowNum <= this._lastRowNum) {
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

      return {
        token: this._createMatchToken(token, match[0], index, rowNum, columnNum),
        skip: token.skip
      }
    }

    return null
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
    return {
      tokenName: token.name,
      tokenValue: value,
      index: index,
      rowNum: rowNum,
      columnStartNum: columnNum,
      columnEndNum: columnNum + value.length - 1,
      hasLineBreakBefore: rowNum > this._lastRowNum
    }
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
    codeIndex: number,
    line: number,
    column: number,
    mode: LexerMode = DefaultMode,
    lastTokenName: string | null = null
  ): TokenCacheEntry | null {
    let pos = codeIndex
    let rowNum = line
    let columnNum = column
    let lastRowNum = line
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

      let nextRowNum = rowNum
      let nextColumnNum = columnNum
      const lineBreaks = matched.token.tokenValue.match(/\r\n|[\n\r\u2028\u2029]/g)
      if (lineBreaks && lineBreaks.length > 0) {
        nextRowNum += lineBreaks.length
        const lastBreakIndex = matched.token.tokenValue.lastIndexOf(lineBreaks[lineBreaks.length - 1])
        const lastBreakLen = lineBreaks[lineBreaks.length - 1].length
        nextColumnNum = matched.token.tokenValue.length - lastBreakIndex - lastBreakLen + 1
      } else {
        nextColumnNum += valueLength
      }

      if (matched.skip) {
        pos = nextPos
        rowNum = nextRowNum
        columnNum = nextColumnNum
        continue
      }

      const token: SubhutiMatchToken = {
        tokenName: matched.token.tokenName,
        tokenValue: matched.token.tokenValue,
        index: pos,
        rowNum: rowNum,
        columnStartNum: columnNum,
        columnEndNum: columnNum + valueLength - 1,
        hasLineBreakBefore: rowNum > lastRowNum
      }

      return {
        token,
        nextCodeIndex: nextPos,
        nextLine: nextRowNum,
        nextColumn: nextColumnNum,
        lastTokenName: token.tokenName
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

      const match = remaining.match(token.pattern)
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

      return {
        token: {
          tokenName: token.name,
          tokenValue: match[0],
          index: index,
          rowNum: rowNum,
          columnStartNum: columnNum,
          columnEndNum: columnNum + match[0].length - 1,
          hasLineBreakBefore: rowNum > lastRowNum
        },
        skip: token.skip
      }
    }

    return null
  }
}
