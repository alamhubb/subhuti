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

    maxLookahead = 1

    get realMaxLookahead() {
        return this.maxLookahead + 1
    }

    syntaxStack = []

    curCst: AlienCst
    // curCst: AlienCst
    // parentCst: AlienCst
    parentCstState: AlienCst
    ruleMap: { [key in string]: RuleObj } = {}

    execFlag = false

    cstStack: AlienCst[] = []

    matchFlag = false
    continueMatching = false

    constructor(tokens?: AlienMatchToken[]) {
        this.tokens = tokens;
    }

    test() {
        for (const ruleObjKey in this.ruleMap) {
            this.curRuleName = ruleObjKey
            this.ruleMap[ruleObjKey].ruleFun()
        }
    }


    exec(ruleName: string) {
        this.execFlag = true
        this.curRuleName = ruleName
        this.curCst = new AlienCst()
        this.curCst.name = ruleName
        this.curCst.children = []
        // this.curCst = this.cst
        // this.parentCst = this.cst
        this.curRule.ruleFun()
        this.execFlag = false
    }

    curRuleName = null


    get curRule() {
        if (this.curRuleName) {
            return this.ruleMap[this.curRuleName]
        }
        return null
    }


    get needLookahead() {
        let flag = false
        if (this.curRule) {
            flag = this.curRule.ruleTokens.some(item => item.length < (this.realMaxLookahead))
        }
        return flag
    }

    //你要做的是在处理过程中，可以生成多个tree
    //一般一个方法只有一个返回
    consume(tokenName: string) {
        if (this.execFlag) {
            if (this.continueMatching) {
                const popToken = this.tokens.pop()
                if (popToken.tokenName !== tokenName) {
                    this.continueMatching = false
                }
                const cst = new AlienCst()
                cst.name = popToken.tokenName
                cst.value = popToken.tokenValue
                this.curCst.children.push(cst)
            }
        } else {
            if (!this.needLookahead) {
                return
            }
            /* const newTokens = [...this.tokens]
             const firstToken = newTokens.shift()
             if (firstToken.tokenName !== tokenName) {
                 throw new Error('语法错误')
             }
             const cstState = {
                 name: tokenName
             }
             return cstState*/
            for (const curTokens of this.curRule.ruleTokens) {
                curTokens.push(tokenName)
            }
        }

    }


    rule(ruleName: string, fun: Function) {
        console.log(`ruleName:${ruleName}`)

        const curRule = new RuleObj()
        curRule.ruleName = ruleName
        curRule.ruleTokens = [[]]
        curRule.ruleFun = fun

        this.ruleMap[ruleName] = curRule

        // fun()
    }

    subRule(ruleName: string) {
        if (this.execFlag) {
            if (this.continueMatching) {
                let cst = new AlienCst()
                cst.name = ruleName
                this.cstStack.push(this.curCst)
                this.curCst = cst
                this.ruleMap[ruleName].ruleFun()
                if (this.continueMatching) {
                    this.curCst = this.cstStack.pop()
                    this.curCst.children.push(cst)
                }
            }
        } else {
            if (!this.needLookahead) {
                return
            }
            this.ruleMap[ruleName].ruleFun()
        }
    }

    or(alienParserOrs: AlienParserOr[]) {
        if (this.execFlag) {
            console.log('zhixingle')
            if (this.tokens.length < this.realMaxLookahead) {
                throw new Error('语法错误')
            }
            //获取当前token的最大前瞻数量
            const lookTokens = this.tokens.slice(0, this.realMaxLookahead)
            const lookStr = lookTokens.map(item => item.tokenName).join('$$')
            console.log(lookStr)
            const ruleTokens = this.curRule.ruleTokens

            let flag = false
            //匹配成功，则遍历执行这个规则
            for (const ruleToken of ruleTokens) {
                console.log(ruleToken)
                const tokenStr = ruleToken.join('$$')
                if (tokenStr === lookStr) {
                    console.log('pipie 成功：' + tokenStr)
                    flag = true
                    break
                }
            }
            if (!flag) {
                throw new Error('未找到匹配的规则')
                // return;
            }

            let tokens = lodash.cloneDeep(this.tokens)
            for (const alienParserOr of alienParserOrs) {
                if (!this.continueMatching) {
                    this.tokens = lodash.cloneDeep(tokens)
                    this.continueMatching = true
                    alienParserOr.alt()
                }
                // if (this.curCst) {
                //     this.parentCst.children.push(this.curCst)
                // }
            }

        } else {
            if (!this.needLookahead) {
                return
            }
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
                // console.log([...ruleToken])
                // this.curRule.curTokens = [...ruleToken]
                alienParserOr.alt()

                newRuleTokens = [...newRuleTokens, ...this.curRule.ruleTokens]

                //执行完毕后
                // newRuleTokens.push(this.curRule.curTokens)
            })
            // }
            this.curRule.ruleTokens = newRuleTokens
        }
    }
}
