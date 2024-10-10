export default class RuleObj<T = any> {
    ruleName: string;
    ruleTokens: string[][];
    ruleFun: Function;
    extendObj: T;
    constructor(ruleObj?: RuleObj<T>) {
        if (ruleObj) {
            this.ruleName = ruleObj.ruleName;
            this.ruleTokens = ruleObj.ruleTokens;
            this.ruleFun = ruleObj.ruleFun;
            this.extendObj = ruleObj.extendObj;
        }
    }
}
