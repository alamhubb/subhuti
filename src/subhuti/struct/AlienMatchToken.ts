export default class AlienMatchToken {
    tokenName: string;
    //只能为字符串，为parser解析时输入的字符串
    tokenValue: string;

    constructor(osvToken: AlienMatchToken) {
        this.tokenName = osvToken.tokenName;
        this.tokenValue = osvToken.tokenValue;
    }
}

export function createMatchToken(osvToken: AlienMatchToken) {
    return new AlienMatchToken(osvToken);
}
