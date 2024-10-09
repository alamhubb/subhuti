import AlienCst from "../alien/AlienCst";
import AlienParser, { AlienRule } from "../alien/AlienParser";
import Es6Parser, { Es6SyntaxName } from "../es6/Es6Parser";
import { typescriptGenerator, MappingCst } from "../ts/TypescriptGenerator";
export function mappingRule(cst: AlienCst<MappingCst>, fun: Function) {
    if (cst) {
        cst.extendObject = {
            alt: fun
        };
    }
}
export class AlienMappingParser extends Es6Parser<MappingCst> {
    @AlienRule
    letKeywords() {
        const cst = super.letKeywords();
        mappingRule(cst, typescriptGenerator.constKeywords);
        return this.getCurCst();
    }
}
const alienMappingParser = new AlienMappingParser();
export default alienMappingParser;
