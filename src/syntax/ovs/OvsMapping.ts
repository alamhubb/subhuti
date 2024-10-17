import Es6MappingParser from '../es6/Es6MappingParser'
import { SubhutiRule } from '../../subhuti/SubhutiParser'
import { es6TokensObj } from '../es6/Es6Tokens'

export default class OvsMappingParser extends Es6MappingParser {
  @SubhutiRule
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
  }
}
