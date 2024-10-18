import SubhutiLexer from "@/subhuti/SubhutiLexer.ts";
import {es6Tokens} from "@/subhuti/syntax/es6/Es6Tokens.ts";
import subhutiMappingParser from "../src/mappingParser/SubhutiMappingParser";
import {subhutiMappingGenerator} from "../src/mappingParser/SubhutiMappingGenerator";
import TestUtil from "./TestUtil.ts";
import Es6Parser from "@/subhuti/syntax/es6/Es6Parser.ts";

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
