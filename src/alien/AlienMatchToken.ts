export default class AlienMatchToken {
    tokenName: string;
    tokenValue: string;
    constructor(osvToken: AlienMatchToken) {
        this.tokenName = osvToken.tokenName;
        this.tokenValue = osvToken.tokenValue;
    }
}
export function createMatchToken(osvToken: AlienMatchToken) {
    return new AlienMatchToken(osvToken);
}
