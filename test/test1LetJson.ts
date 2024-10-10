import AlienLexer from "../src/alien/AlienLexer";
import { es6Tokens } from "../src/es6/Es6Tokens";
import alienMappingParser, { AlienMappingParser } from "../src/mappingParser/AlienMappingParser";
import { MappingCst, typescriptGenerator } from "../src/ts/TypescriptGenerator";
import TestUtil from "./TestUtil";
import Es6Parser from "../src/es6/Es6Parser";
import JsonUtil from "../src/utils/JsonUtil";

const res = `{"name":"program","children":[{"name":"letKeywords","children":[{"name":"let","children":[],"tokens":[],"value":"let"}],"tokens":[{"tokenName":"let","tokenValue":"let"}]},{"name":"identifierEqual","children":[{"name":"identifier","children":[],"tokens":[],"value":"a"},{"name":"equal","children":[],"tokens":[],"value":"="}],"tokens":[{"tokenName":"identifier","tokenValue":"a"},{"tokenName":"equal","tokenValue":"="}]},{"name":"assignmentExpression","children":[{"name":"integer","children":[],"tokens":[],"value":"1"}],"tokens":[{"tokenName":"integer","tokenValue":"1"}]}],"tokens":[]}`

TestUtil.test({
    input: `let a = 1`,
    expect: res,
    test(input: string) {
        const lexer = new AlienLexer(es6Tokens);
        const tokens = lexer.lexer(input);
        const parser = new Es6Parser(tokens);
        const res = parser.program();
        return JsonUtil.toJson(res)
        // alienMappingParser.openMappingMode()
        // return typescriptGenerator.generator(res);
    },
});
