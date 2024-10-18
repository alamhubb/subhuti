import Es5TokenConsumer from "../es5/Es5TokenConsume.js";
import {Es5TokensName, es5TokensObj} from "../es5/Es5Tokens.js";
import {
    createEmptyValueRegToken,
    createKeywordToken,
    createRegToken,
    createToken,
    createValueRegToken
} from "../../struct/SubhutiCreateToken.js";

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
    ExtendsTok: 'ExtendsTok',
    Arrow: 'Arrow',
    Ellipsis: 'Ellipsis',
    NoSubstitutionTemplate: 'NoSubstitutionTemplate',
    TemplateHead: 'TemplateHead',
    TemplateTail: 'TemplateTail',
    TemplateMiddle: 'TemplateMiddle',

}

export const es6TokensObj = {
    ...es5TokensObj,
    ImportTok: createKeywordToken(Es6TokenName.ImportTok, "import"),
    AsTok: createKeywordToken(Es6TokenName.AsTok, "as"),
    FromTok: createKeywordToken(Es6TokenName.FromTok, "from"),
    ExportTok: createKeywordToken(Es6TokenName.ExportTok, "export"),
    YieldTok: createKeywordToken(Es6TokenName.YieldTok, "yield"),
    SuperTok: createKeywordToken(Es6TokenName.SuperTok, "super"),
    TargetTok: createKeywordToken(Es6TokenName.TargetTok, "target"),
    LetTok: createKeywordToken(Es6TokenName.LetTok, "let"),
    ConstTok: createKeywordToken(Es6TokenName.ConstTok, "const"),
    OfTok: createKeywordToken(Es6TokenName.OfTok, "of"),
    ClassTok: createKeywordToken(Es6TokenName.ClassTok, "class"),
    StaticTok: createKeywordToken(Es6TokenName.StaticTok, "static"),
    ExtendsTok: createKeywordToken(Es6TokenName.ExtendsTok, "extends"),

    Arrow: createRegToken(Es6TokenName.Arrow, /=>/),

    Ellipsis: createValueRegToken(Es6TokenName.Ellipsis, /\.\.\./, '...'),

    NoSubstitutionTemplate: createEmptyValueRegToken(
        Es6TokenName.NoSubstitutionTemplate, /`[^`\\]*(?:\\.[^`\\]*)*`/
    ),
    TemplateHead: createEmptyValueRegToken(Es6TokenName.TemplateHead, /`[^`\\$]*(?:\\.[^`\\$]*)*\$\{/),
    TemplateTail: createEmptyValueRegToken(Es6TokenName.TemplateTail, /[^`\\]*(?:\\.[^`\\]*)*`/),
    TemplateMiddle: createEmptyValueRegToken(Es6TokenName.TemplateMiddle, /(?<=\$\{[^}]*})([^`\\]*(?:\\.[^`\\]*)*)(?=\$\{)/),
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

    ExtendsTok() {
        return this.consume(es6TokensObj.ExtendsTok);
    }

    StaticTok() {
        return this.consume(es6TokensObj.StaticTok);
    }

    Arrow() {
        return this.consume(es6TokensObj.Arrow);
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
