import AlienParser, { AlienRule } from "../subhuti/AlienParser";
import { Es6TokenName } from "./Es6Tokens";
import AlienMatchToken from "../subhuti/AlienMatchToken";
import alienMappingParser from "../mappingParser/AlienMappingParser";
import CustomBaseSyntaxParser from "./CustomBaseSyntaxParser";
export default class Es6Parser<T> extends CustomBaseSyntaxParser<T> {
    mappingParser: CustomBaseSyntaxParser<T> = null;
}
