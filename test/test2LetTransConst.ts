import SubhutiLexer from "../src/subhuti/SubhutiLexer";
import {es6Tokens} from "../src/syntax/es6/Es6Tokens";
import subhutiMappingParser from "../src/mappingParser/SubhutiMappingParser";
import {subhutiMappingGenerator} from "../src/mappingParser/SubhutiMappingGenerator";
import TestUtil from "./TestUtil";
import Es6Parser from "../src/syntax/es6/Es6Parser";

TestUtil.test({
    input: `let a = 1`,
    expect: 'const a = 1',
    test(input: string) {
        const lexer = new SubhutiLexer(es6Tokens);
        const tokens = lexer.lexer(input);
        const parser = new Es6Parser(tokens);
        let res = parser.program();
        subhutiMappingParser.openMappingMode(res)
        subhutiMappingParser.setGeneratorMode(true);
        return subhutiMappingGenerator.generator(res);
    },
});
