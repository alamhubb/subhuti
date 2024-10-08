export enum AlienCreateTokenGroupType {
    skip = 'skip'
}

export class AlienCreateToken {
    name: string
    pattern: RegExp
    isKeyword?: boolean
    group?: string

    constructor(osvToken: AlienCreateToken) {
        this.name = osvToken.name;
        this.pattern = osvToken.pattern;
        this.isKeyword = false;
        this.group = osvToken.group;
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
