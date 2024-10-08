import {createKeywordToken, createToken} from "../alien/AlienCreateToken";

export enum Es6TokenName {
    equal = 'equal',
    let = 'let',
    const = 'const',
    whitespace = 'whitespace',

    identifier = 'identifier',
    integer = 'integer',
}


export const es6Tokens = [
    createKeywordToken({name: Es6TokenName.equal, pattern: /=/}),
    createKeywordToken({name: Es6TokenName.let, pattern: /let/}),
    createKeywordToken({name: Es6TokenName.const, pattern: /const/}),
    createKeywordToken({name: Es6TokenName.whitespace, pattern: /\s+/}),

    createToken({name: Es6TokenName.identifier, pattern: /[a-zA-Z$_]\w*/}),
    createToken({name: Es6TokenName.integer, pattern: /0|[1-9]\d*/}),
]
