// ============================================
// LexerMode 类型定义
// ============================================

/** 品牌符号 */
declare const LexerModeBrand: unique symbol

/** 品牌类型 */
export type LexerModeBrand = typeof LexerModeBrand

/**
 * LexerMode 基础类型
 * 使用 TypeScript 品牌类型实现类型安全的 mode 字符串
 */
export type LexerMode = string & { readonly [LexerModeBrand]: unknown }

/**
 * 创建 LexerMode 的辅助函数
 */
export function createMode<T extends string>(value: T): T & LexerMode {
    return value as T & LexerMode
}

/** 默认模式 */
export const DefaultMode = createMode('')

// ============================================
// Token 配置接口
// ============================================

/**
 * 词法前瞻配置
 */
export interface SubhutiTokenLookahead {
    is?: RegExp | string       // 后面必须是
    not?: RegExp | string      // 后面不能是
    in?: (RegExp | string)[]   // 后面必须在集合中
    notIn?: (RegExp | string)[] // 后面不能在集合中
}

/**
 * 上下文约束配置
 * 用于处理词法歧义（如正则表达式 vs 除法）
 */
export interface SubhutiTokenContextConstraint {
    onlyAfter?: Set<string>    // 只有前一个 token 在此集合中才匹配
    notAfter?: Set<string>     // 前一个 token 不能在此集合中
    onlyAtStart?: boolean      // 只能在文件开头（index === 0）匹配（如 Hashbang）
    onlyAtLineStart?: boolean  // 只能在行首匹配（前一个非 skip token 在上一行，如 HTMLCloseComment -->）
}

/**
 * SubhutiCreateToken 构造函数参数类型
 */
export interface SubhutiCreateTokenOptions {
    name: string;
    type?: string;
    pattern?: RegExp;
    isKeyword?: boolean;
    skip?: boolean;
    value?: string;
    categories?: any;
    lookaheadAfter?: SubhutiTokenLookahead;
    contextConstraint?: SubhutiTokenContextConstraint;
    mode?: LexerMode;  // 词法模式：只在指定 mode 下才匹配此 token
}

export class SubhutiCreateToken {
    name: string;
    type: string;
    pattern?: RegExp;
    isKeyword?: boolean;
    skip?: boolean;  // 是否跳过此 token（不加入结果）
    value?: string;
    categories?: any;
    lookaheadAfter?: SubhutiTokenLookahead;  // 前瞻配置
    contextConstraint?: SubhutiTokenContextConstraint;  // 上下文约束配置
    mode?: LexerMode;  // 词法模式：只在指定 mode 下才匹配此 token

    constructor(ovsToken: SubhutiCreateTokenOptions) {
        this.name = ovsToken.name;
        this.type = ovsToken.type || ovsToken.name;  // type 默认等于 name
        this.pattern = ovsToken.pattern
        if (ovsToken.value) {
            this.value = ovsToken.value
        } else {
            this.value = emptyValue
        }
        this.isKeyword = ovsToken.isKeyword ?? false;
        this.skip = ovsToken.skip;
        this.lookaheadAfter = ovsToken.lookaheadAfter;  // 复制前瞻配置
        this.contextConstraint = ovsToken.contextConstraint;  // 复制上下文约束
        this.mode = ovsToken.mode;  // 复制词法模式
    }
}

export const emptyValue = 'Error:CannotUseValue'

export function createToken(osvToken: SubhutiCreateToken) {
    return new SubhutiCreateToken(osvToken);
}

export function createKeywordToken(name: string, pattern: string): SubhutiCreateToken {
    // 添加负向前瞻，确保关键字后不是标识符字符（防止 do 匹配 double）
    const keywordPattern = new RegExp(pattern + '(?![a-zA-Z0-9_$])')
    const token = new SubhutiCreateToken({name: name, pattern: keywordPattern, value: pattern});
    token.isKeyword = true;
    return token;
}

export function createRegToken(name: string, pattern: RegExp) {
    const token = new SubhutiCreateToken({name: name, pattern: pattern, value: pattern.source});
    return token;
}

export function createValueRegToken(
    name: string,
    pattern: RegExp,
    value: string,
    skip?: boolean,
    lookahead?: SubhutiTokenLookahead,
    contextConstraint?: SubhutiTokenContextConstraint
) {
    const token = new SubhutiCreateToken({
        name: name,
        pattern: pattern,
        value: value,
        skip: skip,
        lookaheadAfter: lookahead,
        contextConstraint: contextConstraint
    });
    return token;
}

export function createEmptyValueRegToken(
    name: string,
    pattern: RegExp,
    mode?: LexerMode
) {
    const token = new SubhutiCreateToken({
        name: name,
        pattern: pattern,
        mode: mode
    });
    return token;
}
