import AlienMatchToken from "../alien/AlienMatchToken";
import {Es6TokenName} from "../es6/Es6Tokens";
import AlienCst from "../alien/AlienCst";
import AlienParser from "../alien/AlienParser";
import MappingCst from "./MappingCst";


export class AlienMappingParser extends AlienParser {
    tokens: AlienMatchToken[]

    syntaxStack = []

    curCst: MappingCst
    parentCstState: MappingCst


    mapping(cst: AlienCst, mappingCstFun: Function) {
        this.curCst = new MappingCst(cst)
        this.tokens = cst.tokens
        const mappingAst = mappingCstFun()
        this.curCst.mappingCst = mappingAst
    }
}

const alienMappingParser = new AlienMappingParser()

export default alienMappingParser
