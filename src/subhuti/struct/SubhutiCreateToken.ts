import {Es5TokensName} from "../../syntax/es5/Es5Tokens";

export enum SubhutiCreateTokenGroupType {
    skip = 'skip'
}

export class SubhutiCreateToken {
    name: string;
    pattern?: RegExp;
    isKeyword?: boolean;
    group?: string;
    value?: string;
    categories?: any;

    constructor(ovsToken: SubhutiCreateToken) {
        this.name = ovsToken.name;
        this.pattern = ovsToken.pattern
        if (!ovsToken.value) {
            this.value = ovsToken.pattern.source
        } else {
            this.value = ovsToken.value
        }
        this.isKeyword = false;
        this.group = ovsToken.group;
    }
}


export const emptyValue = 'Error:CannotUseValue'

export function createToken(osvToken: SubhutiCreateToken) {
    return new SubhutiCreateToken(osvToken);
}

export function createKeywordToken(name: string, pattern: string) {
    const token = new SubhutiCreateToken({name: name, pattern: new RegExp(pattern)});
    token.isKeyword = true;
    token.value = pattern;
    return token;
}

export function createValueRegToken(name: string, pattern: RegExp, value: string = emptyValue) {
    const token = new SubhutiCreateToken({name: name, pattern: pattern, value: value});
    token.value = value
    return token;
}
