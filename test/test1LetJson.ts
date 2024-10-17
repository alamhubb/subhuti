import SubhutiLexer from "../src/subhuti/SubhutiLexer";
import { es6Tokens } from "../src/syntax/es6/Es6Tokens";
import TestUtil from "./TestUtil";
import JsonUtil from "../src/utils/JsonUtil";
import Es6Parser from "../src/syntax/es6/Es6Parser";

const res = `{"name":"program","children":[{"name":"letKeywords","children":[{"name":"let","children":[],"tokens":[],"value":"let"}],"tokens":[{"tokenName":"let","tokenValue":"let"}]},{"name":"identifierEqual","children":[{"name":"identifier","children":[],"tokens":[],"value":"a"},{"name":"equal","children":[],"tokens":[],"value":"="}],"tokens":[{"tokenName":"identifier","tokenValue":"a"},{"tokenName":"equal","tokenValue":"="}]},{"name":"assignmentExpression","children":[{"name":"integer","children":[],"tokens":[],"value":"1"}],"tokens":[{"tokenName":"integer","tokenValue":"1"}]}],"tokens":[]}`

TestUtil.test({
    input: `let a = 1`,
    expect: res,
    test(input: string) {
        const lexer = new SubhutiLexer(es6Tokens);
        const tokens = lexer.lexer(input);
        const parser = new Es6Parser(tokens);
        const res = parser.Program();
        return JsonUtil.toJson(res)
    },
});
