import Es5TokenConsumer from "../es5/Es5TokenConsume";
import {Es5TokensName, es5TokensObj} from "../es5/Es5Tokens";
import {createKeywordToken} from "../subhuti/struct/SubhutiCreateToken";

export const Es6TokenName = {
    ...Es5TokensName,
    ImportTok: 'ImportTok',
    AsTok: 'AsTok',
    FromTok: 'FromTok',
    ExportTok: 'ExportTok',
    YieldTok: 'YieldTok',
    SuperTok: 'SuperTok',
    TargetTok: 'TargetTok',
    LetTok: 'LetTok',
    ConstTok: 'ConstTok',
    OfTok: 'OfTok',
    ClassTok: 'ClassTok',
    StaticTok: 'StaticTok',
    Ellipsis: 'Ellipsis',
    NoSubstitutionTemplate: 'NoSubstitutionTemplate',
    TemplateHead: 'TemplateHead',
    TemplateTail: 'TemplateTail',
    TemplateMiddle: 'TemplateMiddle',

}

export const es6TokensObj = {
    ...es5TokensObj,
    ImportTok: createKeywordToken({name: Es6TokenName.ImportTok, pattern: /import/}),
    AsTok: createKeywordToken({name: Es6TokenName.AsTok, pattern: /as/}),
    FromTok: createKeywordToken({name: Es6TokenName.FromTok, pattern: /from/}),
    ExportTok: createKeywordToken({name: Es6TokenName.ExportTok, pattern: /export/}),
    YieldTok: createKeywordToken({name: Es6TokenName.YieldTok, pattern: /yield/}),
    SuperTok: createKeywordToken({name: Es6TokenName.SuperTok, pattern: /super/}),
    TargetTok: createKeywordToken({name: Es6TokenName.TargetTok, pattern: /target/}),
    LetTok: createKeywordToken({name: Es6TokenName.LetTok, pattern: /let/}),
    ConstTok: createKeywordToken({name: Es6TokenName.ConstTok, pattern: /const/}),
    OfTok: createKeywordToken({name: Es6TokenName.OfTok, pattern: /of/}),
    ClassTok: createKeywordToken({name: Es6TokenName.ClassTok, pattern: /class/}),
    StaticTok: createKeywordToken({name: Es6TokenName.StaticTok, pattern: /static/}),
    Ellipsis: createKeywordToken({name: Es6TokenName.Ellipsis, pattern: /\.\.\./}),
    NoSubstitutionTemplate: createKeywordToken({
        name: Es6TokenName.NoSubstitutionTemplate,
        pattern: /`[^`\\]*(?:\\.[^`\\]*)*`/
    }),
    TemplateHead: createKeywordToken({name: Es6TokenName.TemplateHead, pattern: /`[^`\\$]*(?:\\.[^`\\$]*)*\$\{/}),
    TemplateTail: createKeywordToken({name: Es6TokenName.TemplateTail, pattern: /[^`\\]*(?:\\.[^`\\]*)*`/}),
    TemplateMiddle: createKeywordToken({
        name: Es6TokenName.TemplateMiddle,
        pattern: /(?<=\$\{[^}]*})([^`\\]*(?:\\.[^`\\]*)*)(?=\$\{)/
    }),
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

//想让他单例，那他就不能有属性。不能有状态。，有状态对象做不了多例
export default class Es6TokenConsumer extends Es5TokenConsumer {
    ImportTok() {
        return this.consume(es6TokensObj.ImportTok);
    }

    AsTok() {
        return this.consume(es6TokensObj.AsTok);
    }

    FromTok() {
        return this.consume(es6TokensObj.FromTok);
    }

    ExportTok() {
        return this.consume(es6TokensObj.ExportTok);
    }

    YieldTok() {
        return this.consume(es6TokensObj.YieldTok);
    }

    SuperTok() {
        return this.consume(es6TokensObj.SuperTok);
    }

    TargetTok() {
        return this.consume(es6TokensObj.TargetTok);
    }

    LetTok() {
        return this.consume(es6TokensObj.LetTok);
    }

    ConstTok() {
        return this.consume(es6TokensObj.ConstTok);
    }

    OfTok() {
        return this.consume(es6TokensObj.OfTok);
    }

    ClassTok() {
        return this.consume(es6TokensObj.ClassTok);
    }

    StaticTok() {
        return this.consume(es6TokensObj.StaticTok);
    }

    Ellipsis() {
        return this.consume(es6TokensObj.Ellipsis);
    }

    NoSubstitutionTemplate() {
        return this.consume(es6TokensObj.NoSubstitutionTemplate);
    }

    TemplateHead() {
        return this.consume(es6TokensObj.TemplateHead);
    }

    TemplateTail() {
        return this.consume(es6TokensObj.TemplateTail);
    }

    TemplateMiddle() {
        return this.consume(es6TokensObj.TemplateMiddle);
    }
}
