import Es6MappingParser from '../es6/Es6MappingParser'
import { SubhutiRule } from '../../subhuti/SubhutiParser'
import { es6TokensObj } from '../es6/Es6Tokens'

export default class OvsMappingParser extends Es6MappingParser {
  @SubhutiRule
  OvsRenderDom() {
    this.consume(es6TokensObj.IdentifierName)
    this.consume(es6TokensObj.LBrace)
    this.consume(es6TokensObj.RBrace)
  }

  /*
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
      tokenValue: es6TokensObj.LParen.pattern.source,
    })
    if (functionNameToken) {
      this.appendToken({
        tokenName: es6TokensObj.StringLiteral.name,
        tokenValue: functionNameToken.tokenValue,
      })
    }
    this.appendToken({
      tokenName: es6TokensObj.Comma.name,
      tokenValue: es6TokensObj.Comma.pattern.source,
    })
    this.onlyConsume(es6TokensObj.LBrace)
    this.appendToken({
      tokenName: es6TokensObj.LBracket.name,
      tokenValue: es6TokensObj.LBracket.pattern.source,
    })
    this.Option(() => {
      this.ElementList()
    })
    this.onlyConsume(es6TokensObj.RBrace)
    this.appendToken({
      tokenName: es6TokensObj.RBracket.name,
      tokenValue: es6TokensObj.RBracket.pattern.source,
    })
    this.appendToken({
      tokenName: es6TokensObj.RParen.name,
      tokenValue: es6TokensObj.RParen.pattern.source,
    })
  }*/
}
