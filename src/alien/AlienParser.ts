import AlienMatchToken from "./AlienMatchToken";
import AlienCst from "./AlienCst";
import RuleObj from "./RuleObj";
import lodash from "../plugins/Lodash";
import JsonUtil from "../utils/JsonUtil";

class AlienParserOr {
    alt: Function;
}

export function AlienRule(targetFun: any, context) {
    //不可改变位置，下方会多次执行
    const ruleName = targetFun.name;
    return function () {
        this.alienRule(targetFun, ruleName);
        return this.generateCst(this.curCst);
    };
}

export default class AlienParser<T = any, E = any> {
    tokens: AlienMatchToken[];
    maxLookahead = 1;
    syntaxStack = [];
    initFlag = true;
    curCst: AlienCst<T>;
    ruleMap: {
        [key in string]: RuleObj<E>;
    } = {};
    //是否为parser模式，开始为校验模式
    parserMode = false;
    cstStack: AlienCst<T>[] = [];
    continueMatching = false;
    //为什么需要，因为获取curRule
    curRuleName = null;

    get checkMode() {
        return !this.parserMode
    }

    constructor(tokens?: AlienMatchToken[]) {
        this.tokens = tokens;
    }

    get realMaxLookahead() {
        return this.maxLookahead + 1;
    }

    get curRule() {
        return this.curRuleName ? this.ruleMap[this.curRuleName] : null;
    }

    get needLookahead() {
        return this.curRule?.ruleTokens.some(item => item.length < this.realMaxLookahead) || false;
    }

    initializeParserState() {
        this.initFlag = false;
        this.parserMode = false;
        this.ruleMap = {};
        this.cstStack = [];
        this.continueMatching = true;
    }

    /*executeRule(targetFun: Function, rootFlag: boolean, ruleName: string) {
        if (this.parserMode) {
            this.setCurRuleName(ruleName)
        } else {
            if (rootFlag) {
                this.setCurRuleName(ruleName)
                console.log('zhixing 预先设置')
            }
            targetFun.apply(this);
            if (rootFlag) {
                for (const ruleObjKey in this.ruleMap) {
                    if (ruleName !== ruleObjKey) {
                        this.setCurRuleName(ruleObjKey)
                        this.ruleMap[ruleObjKey].ruleFun.apply(this);
                    }
                }
                this.setCurRuleName(ruleName)
            }
        }
    }*/

    alienRule(targetFun: any, ruleName: string, curRule: RuleObj) {
        //优化注意，非parserMode都需要执行else代码，不能  this.parserMode || rootFlag
        //校验模式，且为首次执行
        if (this.checkMode) {
            this.checkModeExecRule(ruleName, targetFun);
        } else if (!this.checkMode) {
            this.parserModeExecRule(ruleName, targetFun);
        }
    }

    private checkModeExecRule(ruleName: string, targetFun: any) {
        const initFlag = this.initFlag;
        if (initFlag) {
            this.setCurRuleName(ruleName)
            this.initializeParserState();
        }
        this.setRuleMap(ruleName, targetFun);
        targetFun.apply(this);
        if (initFlag) {
            for (const ruleObjKey in this.ruleMap) {
                if (ruleName !== ruleObjKey) {
                    this.setCurRuleName(ruleObjKey)
                    this.ruleMap[ruleObjKey].ruleFun.apply(this);
                }
            }
            this.setCurRuleName(ruleName)
            // this.executeRule(targetFun, rootFlag, ruleName);
            this.parserMode = true;
            this.continueMatching = true;
            let cst = new AlienCst();
            cst.name = ruleName;
            cst.children = [];
            this.processCst(targetFun, cst);
            this.curCst = cst;
            //执行完毕，改为false
            this.initFlag = false;
        }
    }

    private setRuleMap(ruleName: string, targetFun: any) {
        if (!this.ruleMap[ruleName]) {
            const curRule = new RuleObj();
            curRule.ruleName = ruleName;
            console.log(66666)
            console.log(ruleName)
            curRule.ruleTokens = [[]];
            curRule.ruleFun = targetFun;
            this.ruleMap[ruleName] = curRule;
        }
    }

    private parserModeExecRule(ruleName: string, targetFun: any) {
        // if (this.tokens.length){
            let cst = new AlienCst();
            cst.name = ruleName;
            cst.children = [];
            //不使用else，方便理解
            //parser模式
            //无论是否 parserMode 都必须执行，不能和上面if合并
            this.setCurRuleName(ruleName)
            // this.executeRule(targetFun, rootFlag, ruleName);
            this.processCst(targetFun, cst);
            const parentCst = this.cstStack[this.cstStack.length - 1];
            parentCst.children.push(this.curCst);
            this.curCst = parentCst;
        // }
    }

    processCst(targetFun: Function, cst: AlienCst<T>) {
        this.curCst = cst;
        this.cstStack.push(this.curCst);
        // 规则解析
        targetFun.apply(this);
        this.cstStack.pop();
    }

    consume(tokenName: string) {
        if (this.parserMode && this.continueMatching) {
            if (this.tokens.length) {
                return this.consumeToken(tokenName);
            }
        } else if (this.needLookahead) {
            for (const curTokens of this.curRule.ruleTokens) {
                curTokens.push(tokenName);
                console.log(this.curRuleName)
                console.log('加入token：' + tokenName)
            }
        }
    }

    setCurRuleName(ruleName: string) {
        this.curRuleName = ruleName
    }


    consumeToken(tokenName: string) {
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

    generateCst(cst: AlienCst<T>) {
        return cst;
    }

    setContinueMatching(flag: boolean) {
        this.continueMatching = flag;
    }

    or(alienParserOrs: AlienParserOr[]) {
        if (this.parserMode) {
            const tokenLength = this.tokens.length;
            if (!tokenLength) {
                throw new Error('语法错误');
                // return
            }
            const lookaheadLength = Math.min(this.realMaxLookahead, this.tokens.length);
            const lookTokens = this.tokens.slice(0, lookaheadLength);
            const lookStr = lookTokens.map(item => item.tokenName).join('$$');
            const ruleTokens = this.curRule.ruleTokens;
            let matchFound = false;
            for (const ruleToken of ruleTokens) {
                let ruleTokenStr = ruleToken.slice(0, lookaheadLength).join('$$');
                console.log(3333)
                console.log(this.curRuleName)
                console.log(ruleTokenStr)
                console.log(lookStr)
                // console.log(this.tokens)
                // console.log(JsonUtil.toJson(this.ruleMap))
                if (ruleTokenStr === lookStr) {
                    matchFound = true;
                    break;
                }
            }
            if (!matchFound) {
                throw new Error('未找到匹配的规则');
            }
            const tokensBackup = lodash.cloneDeep(this.tokens);
            let matchFlag = false;
            for (const alienParserOr of alienParserOrs) {
                if (!matchFlag) {
                    this.tokens = lodash.cloneDeep(tokensBackup);
                    this.setContinueMatching(true);
                    alienParserOr.alt();
                    if (this.continueMatching) {
                        matchFlag = true;
                    }
                }
            }
        } else if (this.needLookahead) {
            const oldTokens = this.curRule.ruleTokens;
            let newRuleTokens = [];
            alienParserOrs.forEach(alienParserOr => {
                this.curRule.ruleTokens = lodash.cloneDeep(oldTokens);
                alienParserOr.alt();
                newRuleTokens = [...newRuleTokens, ...this.curRule.ruleTokens];
            });
            this.curRule.ruleTokens = newRuleTokens;
        }
    }

    getCurCst() {
        return this.curCst;
    }
}
