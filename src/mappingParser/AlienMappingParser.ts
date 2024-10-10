import AlienCst from "../alien/AlienCst";
import AlienParser, { AlienRule } from "../alien/AlienParser";
import Es6Parser from "../es6/Es6Parser";
import { typescriptGenerator, MappingCst } from "../ts/TypescriptGenerator";
import {Es6TokenName} from "../es6/Es6Tokens";
import CustomBaseSyntaxParser from "../es6/CustomBaseSyntaxParser";
export function mappingRule(cst: AlienCst<MappingCst>, fun: Function) {
    if (cst) {
        cst.extendObject = {
            alt: fun
        };
    }
}
export class AlienMappingParser extends CustomBaseSyntaxParser<MappingCst> {
    @AlienRule
    letKeywords() {
        this.consume(Es6TokenName.const);
        return this.getCurCst();
    }
}
const alienMappingParser = new AlienMappingParser();
export default alienMappingParser;
