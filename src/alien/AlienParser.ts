import AlienMatchToken from "./AlienMatchToken";
import { Es6TokenName } from "../es6/Es6Tokens";
import AlienCst from "./AlienCst";
import RuleObj from "./RuleObj";
import { Es6SyntaxName } from "../es6/Es6Parser";
import lodash from "../plugins/Lodash";
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
            this.initializeParserState(ruleName, cst);
        }
        this.ruleMap[ruleName] = curRule;
        this.executeRule(targetFun, rootFlag, ruleName);
        if (this.tokens.length) {
            if (rootFlag) {
                this.finalizeParsing(targetFun);
            }
            else if (this.execFlag && this.continueMatching) {
                this.processCst(cst, targetFun);
            }
        }
        return this.generateCst(this.curCst);
    };
}
export default class AlienParser<T = any, E = any> {
    tokens: AlienMatchToken[];
    maxLookahead = 1;
    syntaxStack = [];
    rootCst: AlienCst<T>;
    curCst: AlienCst<T>;
    ruleMap: {
        [key in string]: RuleObj<E>;
    } = {};
    execFlag = false;
    cstStack: AlienCst<T>[] = [];
    continueMatching = false;
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
    initializeParserState(ruleName: string, cst: AlienCst<T>) {
        this.rootCst = cst;
        this.execFlag = false;
        this.ruleMap = {};
        this.cstStack = [];
        this.continueMatching = true;
        this.curRuleName = ruleName;
    }
    executeRule(targetFun: Function, rootFlag: boolean, ruleName: string) {
        if (this.execFlag) {
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
    finalizeParsing(targetFun: Function) {
        this.execFlag = true;
        this.continueMatching = true;
        this.curCst = this.rootCst;
        this.cstStack.push(this.curCst);
        targetFun.apply(this);
        this.cstStack.pop();
    }
    processCst(cst: AlienCst<T>, targetFun: Function) {
        this.curCst = cst;
        this.cstStack.push(this.curCst);
        targetFun.apply(this);
        const temCst = this.curCst;
        this.cstStack.pop();
        const parentCst = this.cstStack[this.cstStack.length - 1];
        parentCst.children.push(temCst);
        // parentCst.tokens.push(...temCst.tokens);
    }
    consume(tokenName: string) {
        if (this.execFlag && this.continueMatching) {
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
        if (this.execFlag) {
            const tokenLength = this.tokens.length;
            if (!tokenLength) {
                throw new Error('语法错误');
            }
            const lookaheadLength = Math.min(this.realMaxLookahead, this.tokens.length);
            const lookTokens = this.tokens.slice(0, lookaheadLength);
            const lookStr = lookTokens.map(item => item.tokenName).join('$$');
            const ruleTokens = this.curRule.ruleTokens;
            const matchFound = ruleTokens.some(ruleToken => ruleToken.slice(0, lookaheadLength).join('$$') === lookStr);
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
