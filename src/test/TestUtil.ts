export class TestObj {
    input: string;
    test: Function;
    expect: string;
}
export default class TestUtil {
    static test(testObj: TestObj) {
        const input = testObj.input;
        const output = testObj.test(input);
        const expect = testObj.expect;
    }
}
