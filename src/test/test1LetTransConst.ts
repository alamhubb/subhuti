import AlienLexer from "../alien/AlienLexer";
import { es6Tokens } from "../es6/Es6Tokens";
import { AlienMappingParser } from "../mappingParser/AlienMappingParser";
import { MappingCst, typescriptGenerator } from "../ts/TypescriptGenerator";
import TestUtil from "./TestUtil";
import Es6Parser from "../es6/Es6Parser";
TestUtil.test({
    input: `let a = 1`,
    expect: 'const a = 1',
    test(input: string) {
        const lexer = new AlienLexer(es6Tokens);
        const tokens = lexer.lexer(input);
        const parser = new Es6Parser(tokens);
        const res = parser.program();
        return typescriptGenerator.generator(res);
    },
});
