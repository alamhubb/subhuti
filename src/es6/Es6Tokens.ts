import {SubhutiCreateTokenGroupType, createKeywordToken, createToken} from "../subhuti/struct/SubhutiCreateToken";

export enum Es6TokenName {
    let = 'let',
    const = 'const',
    whitespace = 'whitespace',
    identifier = 'identifier',
    equal = 'equal',
    integer = 'integer',
    string = 'string'
}
export const es6Tokens = [
    createKeywordToken({ name: Es6TokenName.equal, pattern: /=/ }),
    createKeywordToken({ name: Es6TokenName.let, pattern: /let/ }),
    createKeywordToken({ name: Es6TokenName.const, pattern: /const/ }),
    createKeywordToken({ name: Es6TokenName.whitespace, pattern: /\s+/, group: SubhutiCreateTokenGroupType.skip }),
    createToken({ name: Es6TokenName.identifier, pattern: /[a-zA-Z$_]\w*/ }),
    createToken({ name: Es6TokenName.integer, pattern: /0|[1-9]\d*/ }),
    //匹配非'\,和转义字符
    createToken({ name: Es6TokenName.string, pattern: /'([^'\\]|\\.)*'/ }),
];
