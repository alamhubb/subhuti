import AlienParser, { AlienRule } from "../alien/AlienParser";
import { Es6TokenName } from "./Es6Tokens";
import AlienMatchToken from "../alien/AlienMatchToken";
import alienMappingParser from "../mappingParser/AlienMappingParser";
import CustomBaseSyntaxParser from "./CustomBaseSyntaxParser";
export default class Es6Parser<T> extends CustomBaseSyntaxParser<T> {
    mappingParser: CustomBaseSyntaxParser<T> = null;
}
