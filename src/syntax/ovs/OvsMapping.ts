import SubhutiMappingParser from '../../subhuti/SubhutiMappingParser'
import { SubhutiRule } from '../../subhuti/SubhutiParser'
import { es6TokensObj } from '../es6/Es6Tokens'
import OvsParser from "./OvsParser";

export default class OvsMappingParser extends OvsParser {
  /*@SubhutiRule
  OvsRenderDom() {
    this.consume(es6TokensObj.IdentifierName)
    this.Option(() => {
      this.Arguments()
    })
    this.consume(es6TokensObj.LBrace)
    this.Option(() => {
      this.ElementList()
    })
    this.consume(es6TokensObj.RBrace)
  }*/

  /*@SubhutiRule
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
      this.appendToken({
        tokenName: es6TokensObj.StringLiteral.name,
        tokenValue: functionNameToken.tokenValue,
      })
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
  }*/
}
