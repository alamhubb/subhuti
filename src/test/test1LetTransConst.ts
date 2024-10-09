import AlienLexer from "../alien/AlienLexer";
import {es6Tokens} from "../es6/Es6Tokens";
import {AlienMappingParser} from "../mappingParser/AlienMappingParser";
import {gen} from "../ts/TypescriptGenerator";


const code = `let a = 1`;
const lexer = new AlienLexer(es6Tokens);
const tokens = lexer.lexer(code);
const parser = new AlienMappingParser(tokens);

const res = parser.program();


console.log(res)
// console.log(res)
// console.log(parser.curCst)
const resCode = gen.generator(res);

const expect = 'const a = 1'

// console.log(res)
console.log(`
result: ${resCode === expect ? '\x1b[32msuccess' : '\x1b[31merror'}\x1b[0m
input: ${code}
output: ${resCode}
`)
