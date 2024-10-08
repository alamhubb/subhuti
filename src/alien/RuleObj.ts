export default class RuleObj {
    ruleName: string
    ruleTokens: string[][]
    curTokens: string[]
    ruleTokenIndex: number = 0
    ruleFun: Function
}
