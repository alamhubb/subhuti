import AlienParser, {AlienRule} from "../alien/AlienParser";
import {Es6TokenName} from "./Es6Tokens";
import AlienMatchToken from "../alien/AlienMatchToken";
import alienMappingParser from "../mappingParser/AlienMappingParser";
import CustomBaseSyntaxParser from "./CustomBaseSyntaxParser";

function MappingParser(parser: any) {
    return function (target, context) {
        console.log(target)
    }
}

@MappingParser(alienMappingParser)
export default class Es6Parser<T> extends CustomBaseSyntaxParser<T> {

}
