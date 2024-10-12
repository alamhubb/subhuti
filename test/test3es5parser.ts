import SubhutiLexer from "../src/subhuti/SubhutiLexer";
import {es6Tokens} from "../src/es6/Es6Tokens";
import subhutiMappingParser from "../src/mappingParser/SubhutiMappingParser";
import {es5Tokens, es5TokensObj} from "../src/es5/Es5Tokens";
import {Es5Parser} from "../src/es5/Es5Parser";

let input = '1+2'
//
// const newPattern = new RegExp('^(' + es5TokensObj.NumericLiteral.pattern.source + ')');
// const res = newPattern.test(input)
//
// console.log(res)

const lexer = new SubhutiLexer(es5Tokens);
const tokens = lexer.lexer(input);
console.log(tokens)
// const parser = new Es5Parser(tokens);
// let res = parser.program();
