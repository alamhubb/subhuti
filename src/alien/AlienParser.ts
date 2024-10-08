import AlienMatchToken from "./AlienMatchToken";
import {Es6TokenName} from "../es6/Es6Tokens";
import AlienCst from "./AlienCst";
import RuleObj from "./RuleObj";
import {Es6SyntaxName} from "../jsparser/Es6Parser";
import lodash from "../plugins/Lodash";
import JsonUtil from "./JsonUtil";


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
    ruleMap: { [key in string]: RuleObj } = {}

    constructor(tokens?: AlienMatchToken[]) {
        this.tokens = tokens;
    }

    test() {
        /*for (const ruleObjKey in this.ruleMap) {
            this.ruleMap[ruleObjKey].ruleFun()
        }*/
        this.ruleMap[Es6SyntaxName.program].ruleFun()
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
        console.log(`consume:${tokenName}`)

        for (const curTokens of this.curRule.ruleTokens) {
            curTokens.push(tokenName)
        }
        console.log(999999)
        console.log(this.curRule.ruleTokens)
    }

    curRule: RuleObj

    rule(ruleName: string, fun: Function) {
        console.log(`ruleName:${ruleName}`)

        this.curRule = new RuleObj()
        this.curRule.ruleName = ruleName
        this.ruleMap[ruleName] = this.curRule

        this.curRule.curTokens = []
        this.curRule.ruleTokens = [this.curRule.curTokens]
        this.curRule.ruleFun = fun

        // fun()
    }

    subRule(ruleName: string) {
        this.ruleMap[ruleName].ruleFun()
    }

    or(alienParserOrs: AlienParserOr[]) {
        const oldLength = this.curRule.ruleTokens.length
        //copy + 扩容
        const newLength = oldLength * alienParserOrs.length
        //之前的数量 copy 几倍，



        // for (const ruleToken of this.curRule.ruleTokens) {
        //二位数组数量*2

        const oldTokens = this.curRule.ruleTokens

        let newRuleTokens = []
        alienParserOrs.forEach((alienParserOr, index) => {
            //每次进入都进入上次的状态
            this.curRule.ruleTokens = lodash.cloneDeep(oldTokens)
            console.log('zhigxingle  alt')
            console.log(oldTokens)
            // console.log([...ruleToken])
            // this.curRule.curTokens = [...ruleToken]
            alienParserOr.alt()

            newRuleTokens = [...newRuleTokens, ...this.curRule.ruleTokens]

            console.log(77777)
            console.log(newRuleTokens)
            //执行完毕后
            // newRuleTokens.push(this.curRule.curTokens)
        })
        // }
        this.curRule.ruleTokens = newRuleTokens
        console.log('---------')
        console.log(this.curRule.ruleTokens)
    }
}
