import {Es5TokensName, es5TokensObj} from "../es5/Es5Tokens";
import {createKeywordToken} from "../subhuti/struct/SubhutiCreateToken";

export const Es6TokenName = {
    ...Es5TokensName,
    ImportTok: 'ImportTok',
    AsTok: 'AsTok',
    FromTok: 'FromTok',
    ExportTok: 'ExportTok',
    YieldTok: 'YieldTok',
}

export const es6TokensObj = {
    ...es5TokensObj,
    ImportTok: createKeywordToken({name: Es6TokenName.ImportTok, pattern: /import/}),
    AsTok: createKeywordToken({name: Es6TokenName.AsTok, pattern: /as/}),
    FromTok: createKeywordToken({name: Es6TokenName.FromTok, pattern: /from/}),
    ExportTok: createKeywordToken({name: Es6TokenName.ExportTok, pattern: /export/}),
    YieldTok: createKeywordToken({name: Es6TokenName.YieldTok, pattern: /yield/}),
    // let: createKeywordToken({name: Es6TokenName.let, pattern: /let/}),
    // const: createKeywordToken({name: Es6TokenName.const, pattern: /const/}),
    // whitespace: createKeywordToken({
    //     name: Es6TokenName.whitespace,
    //     pattern: /\s+/,
    //     group: SubhutiCreateTokenGroupType.skip
    // }),
    // identifier: createToken({name: Es6TokenName.identifier, pattern: /[a-zA-Z$_]\w*!/}),
    // integer: createToken({name: Es6TokenName.integer, pattern: /0|[1-9]\d*/}),
    // //匹配非'\,和转义字符
    // string: createToken({name: Es6TokenName.string, pattern: /'([^'\\]|\\.)*'/}),
};
export const es6Tokens = Object.values(es6TokensObj);
