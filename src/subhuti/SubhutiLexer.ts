import { SubhutiCreateToken, SubhutiCreateTokenGroupType } from "./SubhutiCreateToken";
import SubhutiMatchToken, { createMatchToken } from "./SubhutiMatchToken";
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
        const resTokens: SubhutiMatchToken[] = [];
        while (input) {
            const matchTokens: SubhutiMatchToken[] = [];
            //匹配的token数量
            for (const token of this.tokens) {
                //处理正则
                const newPattern = new RegExp('^(' + token.pattern.source + ')');
                //token正则匹配
                const matchRes = input.match(newPattern);
                //存在匹配结果，
                if (matchRes) {
                    //则加入到匹配的token列表中
                    matchTokens.push(createMatchToken({ tokenName: token.name, tokenValue: matchRes[0] }));
                }
            }
            if (!matchTokens.length) {
                throw new Error('无法匹配token:' + input);
            }
            //获取长度最长的
            let maxLength = 0;
            const map: Map<number, SubhutiMatchToken[]> = new Map();
            //遍历所有匹配的token
            for (const matchToken of matchTokens) {
                //获取当前匹配token长度
                const matchTokenLength = matchToken.tokenValue.length;
                //记录最长的
                maxLength = Math.max(maxLength, matchTokenLength);
                //如果是最长的，加入到结果中
                if (matchTokenLength === maxLength) {
                    map.set(maxLength, [...(map.get(maxLength) || []), matchToken]);
                }
            }
            //获取最长长度的tokens
            const maxLengthTokens = map.get(maxLength);
            let resToken: SubhutiMatchToken;
            //如果有一个以上
            if (maxLengthTokens.length > 1) {
                const resTokens = maxLengthTokens.filter(item => this.tokenMap.get(item.tokenName).isKeyword);
                if (resTokens.length > 1) {
                    throw new Error('匹配了多个关键字:' + resTokens.map(item => item.tokenName).join(','));
                }
                resToken = resTokens[0];
            }
            else {
                resToken = maxLengthTokens[0];
            }
            input = input.substring(maxLength);
            const createToken = this.tokenMap.get(resToken.tokenName);
            if (createToken.group === SubhutiCreateTokenGroupType.skip) {
                continue;
            }
            resTokens.push(resToken);
        }
        return resTokens;
    }
}
