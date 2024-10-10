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
        console.log(`
result: ${output === expect ? '\x1b[32msuccess' : '\x1b[31merror'}\x1b[0m
input: ${input}
output: ${output}
`)
    }
}
