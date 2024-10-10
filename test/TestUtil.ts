export class TestObj {
    input: string;
    test: Function;
    expect: string;
}

export default class TestUtil {
    static test(testObj: TestObj) {
        const input = testObj.input;
        let output = testObj.test(input);
        let expect = testObj.expect;
        // output = `{"name":"program","children":[{"name":"letKeywords","children":[{"name":"let","children":[],"tokens":[],"value":"let"}],"tokens":[{"tokenName":"let","tokenValue":"let"}]},{"name":"identifierEqual","children":[{"name":"identifier","children":[],"tokens":[],"value":"a"},{"name":"equal","children":[],"tokens":[],"value":"="}],"tokens":[{"tokenName":"identifier","tokenValue":"a"},{"tokenName":"equal","tokenValue":"="}]},{"name":"assignmentExpression","children":[{"name":"integer","children":[],"tokens":[],"value":"1"}],"tokens":[{"tokenName":"integer","tokenValue":"1"}]}],"tokens":[]}`
        // expect = `{"name":"program","children":[{"name":"letKeywords","children":[{"name":"let","children":[],"tokens":[],"value":"let"}],"tokens":[{"tokenName":"let","tokenValue":"let"}]},{"name":"identifierEqual","children":[{"name":"identifier","children":[],"tokens":[],"value":"a"},{"name":"equal","children":[],"tokens":[],"value":"="}],"tokens":[{"tokenName":"identifier","tokenValue":"a"},{"tokenName":"equal","tokenValue":"="}]},{"name":"assignmentExpression","children":[{"name":"integer","children":[],"tokens":[],"value":"1"}],"tokens":[{"tokenName":"integer","tokenValue":"1"}]}],"tokens":[]}`
        // console.log(output)
        // console.log(expect)

        console.log(`
result: ${output === expect ? '\x1b[32msuccess' : '\x1b[31merror'}\x1b[0m
input: ${input}
output: ${output}
`)
    }
}
