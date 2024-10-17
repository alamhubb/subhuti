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

    constructor(osvToken: SubhutiCreateToken) {
        this.name = osvToken.name;
        this.pattern = osvToken.pattern;
        this.value = osvToken.pattern.source;
        this.isKeyword = false;
        this.group = osvToken.group;
    }
}

const RegularEscapeMap = {
    '(':'\\(',
    ')':'\\)',
    '[':'\\[',
    '+':'\\+',
    '++':'\\+\\+',
    '+=':'\\+=',
    '?':'\\?',
    '*':'\\*',
    '*=':'\\*=',
}

export function createToken(osvToken: SubhutiCreateToken) {
    return new SubhutiCreateToken(osvToken);
}

export function createKeywordToken(name: string, value: string) {
    const token = new SubhutiCreateToken({name: name, pattern: new RegExp(value)});
    token.isKeyword = true;
    return token;
}

export function createStringToken(name: string, value: string) {
    const getEscapeChar = RegularEscapeMap[value]
    if (getEscapeChar){
        value = getEscapeChar
    }
    const token = new SubhutiCreateToken({name: name, pattern: new RegExp(value)});
    return token;
}
