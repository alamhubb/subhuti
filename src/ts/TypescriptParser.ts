import AlienMatchToken from "../alien/AlienMatchToken";
import {Es6TokenName} from "../es6/Es6Tokens";
import AlienCst from "../alien/AlienCst";
import AlienParser, {AlienRule} from "../alien/AlienParser";
import MappingCst from "./MappingCst";
import RuleObj from "../alien/RuleObj";
import Es6Parser, {Es6SyntaxName} from "../es6/Es6Parser";

export function mappingRule(cst: AlienCst<MappingCst>) {

}

class MappingCst extends AlienCst {

}

export class TypescriptParser extends Es6Parser<MappingCst> {

}

const typescriptParser = new TypescriptParser();
export default typescriptParser;
