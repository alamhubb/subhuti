import AlienLexer from "../src/subhuti/SubhutiLexer";
import {es6Tokens} from "../src/es6/Es6Tokens";
import subhutiMappingParser, {AlienMappingParser} from "../src/mappingParser/SubhutiMappingParser";
import {typescriptGenerator} from "../src/ts/TypescriptGenerator";
import TestUtil from "./TestUtil";
import Es6Parser from "../src/es6/Es6Parser";

TestUtil.test({
    input: `let a = 1`,
    expect: 'const a = 1',
    test(input: string) {
        const lexer = new AlienLexer(es6Tokens);
        const tokens = lexer.lexer(input);
        const parser = new Es6Parser(tokens);
        let res = parser.program();
        subhutiMappingParser.openMappingMode(res)
        return typescriptGenerator.generator(res);
    },
});
