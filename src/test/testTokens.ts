import AlienLexer from "../alien/AlienLexer";
import {es6Tokens} from "../es6/Es6Tokens";
import {code1} from "./getcode";

const lexer = new AlienLexer(es6Tokens)

const tokens = lexer.lexer(code1)

console.log(tokens)
