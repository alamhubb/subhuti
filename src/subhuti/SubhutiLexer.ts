import { SubhutiCreateToken, SubhutiCreateTokenGroupType } from "./struct/SubhutiCreateToken";
import SubhutiMatchToken, { createMatchToken } from "./struct/SubhutiMatchToken";
import { Es5TokensName } from "../es5/Es5Tokens";
export default class SubhutiLexer {
    tokens: SubhutiCreateToken[];
    private tokenMap: Map<string, SubhutiCreateToken>;
    private generateTokenMap() {
        const tokenMap: Map<string, SubhutiCreateToken> = new Map();
        this.tokens.forEach(item => {
            tokenMap.set(item.name, item);
        });
        this.tokenMap = tokenMap;
    }
    setTokens(tokens: SubhutiCreateToken[]) {
        this.tokens = tokens;
        this.generateTokenMap();
    }
    constructor(tokens: SubhutiCreateToken[]) {
        this.setTokens(tokens);
    }
    lexer(input: string): SubhutiMatchToken[] {
        const resTokens: SubhutiMatchToken[] = []; // 初始化结果token数组
        while (input) { // 当输入字符串不为空时循环
            const matchTokens: SubhutiMatchToken[] = []; // 初始化匹配的token数组
            // 匹配的token数量
            for (const token of this.tokens) { // 遍历所有token
                // 处理正则
                const newPattern = new RegExp('^(' + token.pattern.source + ')'); // 创建新的正则表达式
                // token正则匹配
                const matchRes = input.match(newPattern); // 尝试匹配输入字符串
                // 存在匹配结果，
                if (matchRes) {
                    // 则加入到匹配的token列表中
                    matchTokens.push(createMatchToken({ tokenName: token.name, tokenValue: matchRes[0] })); // 创建匹配token并加入列表
                }
            }
            if (!matchTokens.length) { // 如果没有匹配到任何token
                throw new Error('无法匹配token:' + input); // 抛出错误
            }
            let resToken = matchTokens[0]; // 选择唯一的最大长度token
            input = input.substring(resToken.tokenValue.length); // 从输入字符串中移除已匹配的部分
            const createToken = this.tokenMap.get(resToken.tokenName); // 获取创建token的配置信息
            if (createToken.group === SubhutiCreateTokenGroupType.skip) { // 如果token属于跳过组
                continue; // 跳过此token
            }
            resTokens.push(resToken); // 将token加入结果数组
        }
        return resTokens; // 返回结果token数组
    }
}
