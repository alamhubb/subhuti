import { SubhutiRule } from "../../SubhutiParser.js";
import { es6TokensObj } from "../es6/Es6Tokens.js";
import OvsParser from "./OvsParser.js";
import {SubhutiCreateToken} from "../../struct/SubhutiCreateToken.js";

//let 转 const，这时候就是在寻找一个let，没问题
const mappingTokenMap: { [key in string]: SubhutiCreateToken } = {
    [es6TokensObj.ConstTok.name]: es6TokensObj.LetTok
}

export default class OvsMappingParser extends OvsParser {
    @SubhutiRule
    OvsRenderDom() {
        let functionNameToken = this.onlyConsume(es6TokensObj.IdentifierName)
        // this.Option(() => {
        //   this.Arguments()
        // })
        this.appendToken({
            tokenName: es6TokensObj.IdentifierName.name,
            tokenValue: 'h',
        })
        this.appendToken({
            tokenName: es6TokensObj.LParen.name,
            tokenValue: es6TokensObj.LParen.value,
        })
        if (functionNameToken) {
            this.appendStringToken( functionNameToken.tokenValue)
        }
        this.appendToken({
            tokenName: es6TokensObj.Comma.name,
            tokenValue: es6TokensObj.Comma.value,
        })
        this.onlyConsume(es6TokensObj.LBrace)
        this.appendToken({
            tokenName: es6TokensObj.LBracket.name,
            tokenValue: es6TokensObj.LBracket.value,
        })
        this.Option(() => {
            this.ElementList()
        })
        this.onlyConsume(es6TokensObj.RBrace)
        this.appendToken({
            tokenName: es6TokensObj.RBracket.name,
            tokenValue: es6TokensObj.RBracket.value,
        })
        this.appendToken({
            tokenName: es6TokensObj.RParen.name,
            tokenValue: es6TokensObj.RParen.value,
        })
    }
}
