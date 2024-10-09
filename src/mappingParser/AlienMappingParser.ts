import AlienMatchToken from "../alien/AlienMatchToken";
import { Es6TokenName } from "../es6/Es6Tokens";
import AlienCst from "../alien/AlienCst";
import AlienParser, { AlienRule } from "../alien/AlienParser";
import RuleObj from "../alien/RuleObj";
import Es6Parser, { Es6SyntaxName } from "../es6/Es6Parser";
import typescriptParser from "../ts/TypescriptParser";
export function mappingRule(cst: AlienCst<MappingCst>, fun: Function) {
    typescriptParser.tokens = cst.tokens;
    const mappingCst = fun.apply(typescriptParser);
    cst.extendObject = mappingCst;
}
class MappingCst extends AlienCst {
}
export class AlienMappingParser extends Es6Parser<MappingCst> {
    @AlienRule
    letKeywords() {
        const cst = super.letKeywords();
        this.getCurCst();
        if (this.execFlag) {
            mappingRule(cst, typescriptParser.constKeywords);
            console.log(cst)
        }
        return this.getCurCst();
    }
}
const alienMappingParser = new AlienMappingParser();
export default alienMappingParser;
