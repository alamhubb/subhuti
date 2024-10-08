export class AlienCreateToken {
    name: string
    pattern: RegExp
    isKeyword?: boolean

    constructor(osvToken: AlienCreateToken) {
        this.name = osvToken.name;
        this.pattern = osvToken.pattern;
        this.isKeyword = false;
    }
}

export function createToken(osvToken: AlienCreateToken) {
    return new AlienCreateToken(osvToken)
}

export function createKeywordToken(osvToken: AlienCreateToken) {
    const token = new AlienCreateToken(osvToken)
    token.isKeyword = true
    return token
}
