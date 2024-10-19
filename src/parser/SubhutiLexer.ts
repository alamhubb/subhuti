import { SubhutiCreateToken, SubhutiCreateTokenGroupType } from "../struct/SubhutiCreateToken.ts"
import SubhutiMatchToken, { createMatchToken } from "../struct/SubhutiMatchToken.ts"

export default class SubhutiLexer {
    constructor(tokens: SubhutiCreateToken[]) {
        this.setTokens(tokens);
    }

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

    lexer(input: string): SubhutiMatchToken[] {
        const resTokens: SubhutiMatchToken[] = []; // 初始化结果token数组
        while (input) { // 当输入字符串不为空时循环
            const matchTokens: SubhutiMatchToken[] = []; // 初始化匹配的token数组
            // 匹配的token数量
            for (const token of this.tokens) { // 遍历所有token
                // 处理正则
                const newPattern = new RegExp('^(?:' + token.pattern.source + ')'); // 创建新的正则表达式
                // token正则匹配
                const matchRes = input.match(newPattern); // 尝试匹配输入字符串
                // 存在匹配结果，
                if (matchRes) {
                    // 则加入到匹配的token列表中
                    matchTokens.push(createMatchToken({tokenName: token.name, tokenValue: matchRes[0]})); // 创建匹配token并加入列表
                }
            }
            if (!matchTokens.length) { // 如果没有匹配到任何token
                throw new Error('无法匹配token:' + input); // 抛出错误
            }
            //获取长度最长的
            let maxLength = 0
            const map: Map<number, SubhutiMatchToken[]> = new Map()
            //遍历所有匹配的token
            for (const matchToken of matchTokens) {
                //获取当前匹配token长度
                const matchTokenLength = matchToken.tokenValue.length
                //记录最长的
                maxLength = Math.max(maxLength, matchTokenLength)
                //如果是最长的，加入到结果中
                if (matchTokenLength === maxLength) {
                    map.set(maxLength, [...(map.get(maxLength) || []), matchToken])
                }
            }
            //获取最长长度的tokens
            const maxLengthTokens = map.get(maxLength)
            let resToken: SubhutiMatchToken
            //如果有一个以上
            if (maxLengthTokens.length > 1) {
                const resTokens = maxLengthTokens.filter(item => this.tokenMap.get(item.tokenName).isKeyword)
                if (resTokens.length > 1) {
                    throw new Error('匹配了多个关键字:' + resTokens.map(item => item.tokenName).join(','))
                }
                resToken = resTokens[0]
            } else {
                resToken = maxLengthTokens[0]
            }
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
