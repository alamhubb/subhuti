import AlienLexer from "../alien/AlienLexer";
import { es6Tokens } from "../es6/Es6Tokens";
import { AlienMappingParser } from "../mappingParser/AlienMappingParser";
import TypescriptGenerator, {gen} from "../ts/TypescriptGenerator";


export const code1 = `
let a = 1
`;
const lexer = new AlienLexer(es6Tokens);
const tokens = lexer.lexer(code1);
const parser = new AlienMappingParser(tokens);

const res = parser.program();



console.log(res)
// console.log(res)
// console.log(parser.curCst)
const code = gen.generator(res);
// console.log(res)
console.log(code)
