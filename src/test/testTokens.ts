import AlienLexer from "../alien/AlienLexer";
import {es6Tokens} from "../es6/Es6Tokens";
import {code1} from "./getcode";
import AlienParser from "../alien/AlienParser";
import Es6Parser from "../jsparser/Es6Parser";

const lexer = new AlienLexer(es6Tokens)

const tokens = lexer.lexer(code1)

const parser = new Es6Parser(tokens)

parser.program()

console.log(parser.ruleMap)


