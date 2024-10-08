import AlienMatchToken from "./AlienMatchToken";
import {Es6TokenName} from "../es6/Es6Tokens";
import AlienCst from "./AlienCst";
import RuleObj from "./RuleObj";


export function alienParser(targetFun: any, context) {
    return function (...args) {
        const classThis: AlienParser = this
        classThis.syntaxStack.push(targetFun.name)
        return targetFun.apply(classThis, args)
    }
}

class AlienParserOr {
    alt: Function
}


export default class AlienParser {

    tokens: AlienMatchToken[]

    syntaxStack = []

    cst: AlienCst
    cstState: AlienCst
    parentCstState: AlienCst

    constructor(tokens?: AlienMatchToken[]) {
        this.tokens = tokens;
    }


    //你要做的是在处理过程中，可以生成多个tree
    //一般一个方法只有一个返回
    consume(tokenName: string) {


        /* const newTokens = [...this.tokens]
         const firstToken = newTokens.shift()
         if (firstToken.tokenName !== tokenName) {
             throw new Error('语法错误')
         }
         const cstState = {
             name: tokenName
         }
         return cstState*/
    }

    ruleMap: { [key in string]: RuleObj } = {}

    curRule: RuleObj

    rule(ruleName: string, fun: Function) {
        console.log(`ruleName:${ruleName}`)

        this.curRule = new RuleObj()
        this.curRule.ruleName = ruleName
        this.ruleMap[ruleName] = this.curRule

        this.curRule.curTokens = []
        this.curRule.ruleTokens = [this.curRule.curTokens]

        fun()

    }

    subRule(ruleName: string) {
        this.curRule.curTokens.push(ruleName)
    }

    or(alienParserOrs: AlienParserOr[]) {
        const oldLength = this.curRule.ruleTokens.length
        //copy + 扩容
        const newLength = oldLength * alienParserOrs.length
        //之前的数量 copy 几倍，


        const newRuleTokens = []

        for (const ruleToken of this.curRule.ruleTokens) {
            //二位数组数量*2
            alienParserOrs.forEach((alienParserOr, index) => {

                this.curRule.curTokens = [...ruleToken]
                newRuleTokens.push(this.curRule.curTokens)

                alienParserOr.alt()

            })
        }
        this.curRule.ruleTokens = newRuleTokens
    }
}
