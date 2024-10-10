export default class SubhutiMatchToken {
    tokenName: string;
    tokenValue: string;
    constructor(osvToken: SubhutiMatchToken) {
        this.tokenName = osvToken.tokenName;
        this.tokenValue = osvToken.tokenValue;
    }
}
export function createMatchToken(osvToken: SubhutiMatchToken) {
    return new SubhutiMatchToken(osvToken);
}
