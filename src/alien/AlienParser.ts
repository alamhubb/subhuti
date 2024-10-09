import AlienMatchToken from "./AlienMatchToken";
import AlienCst from "./AlienCst";
import RuleObj from "./RuleObj";
import lodash from "../plugins/Lodash";
class AlienParserOr {
    alt: Function;
}
export function AlienRule(targetFun: any, context) {
    //不可改变位置，下方会多次执行
    const ruleName = targetFun.name;
    const curRule = new RuleObj();
    curRule.ruleName = ruleName;
    curRule.ruleTokens = [[]];
    curRule.ruleFun = targetFun;
    return function () {
        this.alienRule(targetFun, ruleName, curRule);
        return this.generateCst(this.curCst);
    };
}
export default class AlienParser<T = any, E = any> {
    tokens: AlienMatchToken[];
    maxLookahead = 1;
    syntaxStack = [];
    rootFlag = true;
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
    initializeParserState(ruleName: string) {
        this.rootFlag = false;
        this.parserMode = false;
        this.ruleMap = {};
        this.cstStack = [];
        this.continueMatching = true;
        this.curRuleName = ruleName;
    }
    executeRule(targetFun: Function, rootFlag: boolean, ruleName: string) {
        if (this.parserMode) {
            this.curRuleName = ruleName;
        }
        else {
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
    }
    alienRule(targetFun: any, ruleName: string, curRule: RuleObj) {
        const rootFlag = this.rootFlag;
        let cst = new AlienCst();
        cst.name = ruleName;
        cst.children = [];
        if (rootFlag) {
            this.initializeParserState(ruleName);
        }
        this.ruleMap[ruleName] = curRule;
        this.executeRule(targetFun, rootFlag, ruleName);
        if (this.tokens.length) {
            if (rootFlag) {
                this.parserMode = true;
                this.continueMatching = true;
                this.processCst(targetFun, cst);
                this.curCst = cst;
                //执行完毕，改为false
                this.rootFlag = false;
            }
            else if (this.parserMode && this.continueMatching) {
                this.processCst(targetFun, cst);
                const parentCst = this.cstStack[this.cstStack.length - 1];
                parentCst.children.push(this.curCst);
                this.curCst = parentCst;
            }
        }
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
        }
        else if (this.needLookahead) {
            for (const curTokens of this.curRule.ruleTokens) {
                curTokens.push(tokenName);
            }
        }
    }
    private consumeToken(tokenName: string) {
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
            }
            const lookaheadLength = Math.min(this.realMaxLookahead, this.tokens.length);
            const lookTokens = this.tokens.slice(0, lookaheadLength);
            const lookStr = lookTokens.map(item => item.tokenName).join('$$');
            const ruleTokens = this.curRule.ruleTokens;
            let matchFound = false;
            for (const ruleToken of ruleTokens) {
                let ruleTokenStr = ruleToken.slice(0, lookaheadLength).join('$$');
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
        }
        else if (this.needLookahead) {
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
