import AlienLexer from "../src/alien/AlienLexer";
import { es6Tokens } from "../src/es6/Es6Tokens";
import { AlienMappingParser } from "../src/mappingParser/AlienMappingParser";
import { MappingCst, typescriptGenerator } from "../src/ts/TypescriptGenerator";
import TestUtil from "./TestUtil";
import Es6Parser from "../src/es6/Es6Parser";
import JsonUtil from "../src/utils/JsonUtil";
TestUtil.test({
    input: `let a = 1`,
    expect: 'const a = 1',
    test(input: string) {
        const lexer = new AlienLexer(es6Tokens);
        const tokens = lexer.lexer(input);
        const parser = new Es6Parser(tokens);
        const res = parser.program();
        console.log(JsonUtil.toJson(res))
        return typescriptGenerator.generator(res);
    },
});
