import AlienLexer from "../alien/AlienLexer";
import {es6Tokens} from "../es6/Es6Tokens";
import {code1} from "./getcode";
import AlienParser from "../alien/AlienParser";

const lexer = new AlienLexer(es6Tokens)

const tokens = lexer.lexer(code1)

console.log(tokens)

const parser = new AlienParser(tokens)

parser.program(123)


