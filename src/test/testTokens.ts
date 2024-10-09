import AlienLexer from "../alien/AlienLexer";
import { es6Tokens } from "../es6/Es6Tokens";
import { code1 } from "./getcode";
import AlienParser from "../alien/AlienParser";
import Es6Parser, { Es6SyntaxName } from "../es6/Es6Parser";
import JsonUtil from "../alien/JsonUtil";
import {AlienMappingParser} from "../mappingParser/AlienMappingParser";
const lexer = new AlienLexer(es6Tokens);
const tokens = lexer.lexer(code1);
const parser = new AlienMappingParser(tokens);
// parser.test()
/*console.log(parser.ruleMap)

for (const rulekey in parser.ruleMap) {
    console.log(parser.ruleMap[rulekey].ruleTokens)
}*/
const res = parser.program();
console.log(JsonUtil.toJson(parser.rootCst))
