export default class SubhutiMatchToken {
    tokenName: string;
    //只能为字符串，为parser解析时输入的字符串
    tokenValue: string;
    constructor(osvToken: SubhutiMatchToken) {
        this.tokenName = osvToken.tokenName;
        this.tokenValue = osvToken.tokenValue;
    }
}
export function createMatchToken(osvToken: SubhutiMatchToken) {
    return new SubhutiMatchToken(osvToken);
}
