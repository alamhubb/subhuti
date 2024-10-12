import SubhutiLexer from "../src/subhuti/SubhutiLexer";
import {es6Tokens} from "../src/es6/Es6Tokens";
import subhutiMappingParser from "../src/mappingParser/SubhutiMappingParser";
import {Es5Parser} from "../src/es5/Es5Parser";

let input = '1+2'
const lexer = new SubhutiLexer(es6Tokens);
const tokens = lexer.lexer(input);
const parser = new Es5Parser(tokens);
let res = parser.program();
