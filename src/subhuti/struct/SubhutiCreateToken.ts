export enum SubhutiCreateTokenGroupType {
    skip = 'skip'
}
export class SubhutiCreateToken {
    name: string;
    pattern?: RegExp;
    isKeyword?: boolean;
    group?: string;
    categories?: any;
    constructor(osvToken: SubhutiCreateToken) {
        this.name = osvToken.name;
        this.pattern = osvToken.pattern;
        this.isKeyword = false;
        this.group = osvToken.group;
    }
}
export function createToken(osvToken: SubhutiCreateToken) {
    return new SubhutiCreateToken(osvToken);
}
export function createKeywordToken(osvToken: SubhutiCreateToken) {
    const token = new SubhutiCreateToken(osvToken);
    token.isKeyword = true;
    return token;
}
