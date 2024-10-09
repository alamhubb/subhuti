import AlienMatchToken from "./AlienMatchToken";
import {Es6TokenName} from "../es6/Es6Tokens";
import AlienCst from "./AlienCst";
import RuleObj from "./RuleObj";
import {Es6SyntaxName} from "../es6/Es6Parser";
import lodash from "../plugins/Lodash";
import JsonUtil from "./JsonUtil";

class AlienParserOr {
    alt: Function;
}
export function AlienRule(targetFun: any, context) {
    const ruleName = targetFun.name;
    const curRule = new RuleObj();
    curRule.ruleName = ruleName;
    curRule.ruleTokens = [[]];
    curRule.ruleFun = targetFun;
    return function () {
        const rootFlag = !this.rootCst;
        let cst = new AlienCst();
        cst.name = ruleName;
        cst.children = [];
        if (rootFlag) {
            this.rootCst = cst;
            this.execFlag = false;
            this.ruleMap = {};
            this.cstStack = [];
            this.continueMatching = true;
            this.curRuleName = ruleName;
        }
        this.ruleMap[ruleName] = curRule;
        if (this.execFlag) {
            this.curRuleName = ruleName;
        } else {
            targetFun.apply(this);
            if (rootFlag) {
                for (const ruleObjKey in this.ruleMap) {
                    if (ruleName !== ruleObjKey) {
                        this.curRuleName = ruleObjKey;
                        this.ruleMap[ruleObjKey].ruleFun.apply(this);
                    }
                }
                this.curRuleName = ruleName;
            }
        }

        //遍历所有规则，
        //判断当前的token数量，是否小于realMaxLookahead
        //如果小于最大前瞻数
        //
        /*[...this.ruleTree].reverse().forEach(([key, value]) => {
            console.log(key, value);
        });*/
        if (rootFlag) {
            this.execFlag = true;
            this.continueMatching = true;
            this.curCst = this.rootCst;
            this.cstStack.push(this.curCst);
            targetFun.apply(this);
            this.cstStack.pop();
            return this.generateCst(this.curCst);
        } else {
            if (this.execFlag) {
                if (this.continueMatching) {
                    this.curCst = cst;
                    console.log(cst.name)
                    this.cstStack.push(this.curCst);
                    console.log(this.cstStack.length)
                    targetFun.apply(this);
                    console.log(this.cstStack.length)
                    //执行完毕，cst出栈
                    let temCst = this.curCst;
                    this.cstStack.pop();
                    this.curCst = this.cstStack[this.cstStack.length - 1]
                    console.log(this.curCst.name)
                    this.curCst.children.push(temCst);
                    this.curCst.tokens.push(...temCst.tokens);
                    return this.generateCst(this.curCst);
                }
            }
        }
    };
}

export default class AlienParser<T = any, E = any> {
    tokens: AlienMatchToken[];
    maxLookahead = 1;

    get realMaxLookahead() {
        return this.maxLookahead + 1;
    }

    syntaxStack = [];
    rootCst: AlienCst<T>;
    curCst: AlienCst<T>;
    ruleMap: {
        [key in string]: RuleObj<E>;
    } = {};
    execFlag = false;
    cstStack: AlienCst<T>[] = [];
    continueMatching = false;

    constructor(tokens?: AlienMatchToken[]) {
        this.tokens = tokens;
    }

    curRuleName = null;

    get curRule() {
        if (this.curRuleName) {
            return this.ruleMap[this.curRuleName];
        }
        return null;
    }

    get needLookahead() {
        let flag = false;
        if (this.curRule) {
            flag = this.curRule.ruleTokens.some(item => item.length < (this.realMaxLookahead));
        }
        return flag;
    }

    //你要做的是在处理过程中，可以生成多个tree
    //一般一个方法只有一个返回
    consume(tokenName: string) {
        if (this.execFlag) {
            if (this.continueMatching) {
                if (this.tokens.length) {
                    let popToken = this.tokens[0];
                    if (popToken.tokenName !== tokenName) {
                        this.setContinueMatching(false);
                        return;
                    }
                    popToken = this.tokens.shift();
                    const cst = new AlienCst();
                    cst.name = popToken.tokenName;
                    cst.value = popToken.tokenValue;
                    this.curCst.children.push(cst);
                    this.curCst.tokens.push(popToken);
                    return this.generateCst(cst);
                }
            }
        } else {
            if (!this.needLookahead) {
                return;
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
                curTokens.push(tokenName);
            }
        }
    }

    /*rule(ruleName: string, fun: Function) {
        return alienParserRule.apply(this, [ruleName, fun])
        // fun()
    }*/
    generateCst(cst: AlienCst<T>) {
        return cst;
    }

    setContinueMatching(flag: boolean) {
        this.continueMatching = flag;
    }

    or(alienParserOrs: AlienParserOr[]) {
        if (this.execFlag) {
            const lookTokens = this.tokens.slice(0, this.realMaxLookahead);
            const lookStr = lookTokens.map(item => item.tokenName).join('$$');
            const ruleTokens = this.curRule.ruleTokens;
            let flag = false;
            //匹配成功，则遍历执行这个规则
            for (const ruleToken of ruleTokens) {
                const tokenStr = ruleToken.join('$$');
                if (tokenStr === lookStr) {
                    flag = true;
                    break;
                }
            }
            if (!flag) {
                throw new Error('未找到匹配的规则');
                // return;
            }
            let tokens = lodash.cloneDeep(this.tokens);
            for (const alienParserOr of alienParserOrs) {
                //如果上轮解析失败，则重新解析
                if (!this.continueMatching) {
                    this.tokens = lodash.cloneDeep(tokens);
                    this.setContinueMatching(true);
                }
                alienParserOr.alt();
                // if (this.curCst) {
                //     this.parentCst.children.push(this.curCst)
                // }
            }
            this.setContinueMatching(true);
        } else {
            if (!this.needLookahead) {
                return;
            }
            const oldLength = this.curRule.ruleTokens.length;
            //copy + 扩容
            const newLength = oldLength * alienParserOrs.length;
            //之前的数量 copy 几倍，
            // for (const ruleToken of this.curRule.ruleTokens) {
            //二位数组数量*2
            const oldTokens = this.curRule.ruleTokens;
            let newRuleTokens = [];
            alienParserOrs.forEach((alienParserOr, index) => {
                //每次进入都进入上次的状态
                this.curRule.ruleTokens = lodash.cloneDeep(oldTokens);
                // console.log([...ruleToken])
                // this.curRule.curTokens = [...ruleToken]
                alienParserOr.alt();
                newRuleTokens = [...newRuleTokens, ...this.curRule.ruleTokens];
                //执行完毕后
                // newRuleTokens.push(this.curRule.curTokens)
            });
            // }
            this.curRule.ruleTokens = newRuleTokens;
        }
    }
}
