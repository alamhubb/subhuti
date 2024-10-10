import AlienMatchToken from "./AlienMatchToken";
import AlienCst from "./AlienCst";
import RuleObj from "./RuleObj";
import lodash from "../plugins/Lodash";
import JsonUtil from "../utils/JsonUtil";

export class AlienParserOr {
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
    _tokens: AlienMatchToken[];
    maxLookahead = 1;
    syntaxStack = [];
    initFlag = true;
    curCst: AlienCst<T>;
    //前瞻是设置值，parser时判断，是否为当前规则
    ruleMap: {
        [key in string]: RuleObj<E>;
    } = {};
    //是否为parser模式，开始为校验模式
    // parserMode = false;
    checkMode = false;
    cstStack: AlienCst<T>[] = [];
    continueMatching = true;
    //为什么需要，因为获取curRule
    curRuleName = null;

    setCurCst(curCst: AlienCst<T>) {
        this.curCst = curCst;
    }

    get tokens() {
        if (!this._tokens?.length) {
            throw new Error('tokens is empty, please set tokens');
        }
        return this._tokens;
    }

    setTokens(tokens?: AlienMatchToken[]) {
        if (!tokens?.length) {
            throw Error('tokens is empty');
        }
        this._tokens = tokens;
    }

    get parserMode() {
        return !this.checkMode;
    }

    constructor(tokens?: AlienMatchToken[]) {
        if (tokens) {
            this.setTokens(tokens);
        }
    }

    get realMaxLookahead() {
        return this.maxLookahead + 1;
    }

    get curRule() {
        return this.curRuleName ? this.getKeyRule(this.curRuleName) : null;
    }

    get needLookahead() {
        return this.curRule?.ruleTokens.some(item => item.length < this.realMaxLookahead) || false;
    }

    alienRule(targetFun: any, ruleName: string) {
        //优化注意，非parserMode都需要执行else代码，不能  this.parserMode || rootFlag
        //校验模式，且为首次执行
        const initFlag = this.initFlag;
        if (initFlag) {
            //init check mode
            this.initRule(ruleName, targetFun);
        } else {
            //执行模式
            if (this.checkMode) {
                //检查模式的所有情况都执行
                this.setRuleMap(ruleName, targetFun);
                targetFun.apply(this);
            } else if (!this.checkMode) {
                // this.parserModeExecRule(ruleName, targetFun);
                this.setCurRuleName(ruleName);
                console.log(44444)
                // console.log(this)
                console.log(ruleName)
                console.log(JsonUtil.toJson(this.cstStack.map(item => ({name: item.name}))))

                this.processCst(ruleName, targetFun);

                const parentCst = this.cstStack[this.cstStack.length - 1];

                console.log(77777)
                console.log('parentCst:' + parentCst.name)
                console.log('push:' + this.curCst.name)

                parentCst.children.push(this.curCst);
                this.setCurCst(parentCst);
            }
        }
    }

    getKeyRule(key: string) {
        return this.ruleMap[key];
    }

    setKeyRule(key: string, curRule: RuleObj) {
        this.ruleMap[key] = curRule;
    }

    private initRule(ruleName: string, targetFun: any) {
        this.initFlag = false;
        this.checkMode = true
        this.ruleMap = {};
        this.setCurRuleName(ruleName);
        //检查模式的所有情况都执行
        this.setRuleMap(ruleName, targetFun);
        //check模式执行方法，得到ruleTokens,校验tokens
        targetFun.apply(this);
        //校验每一个子函数
        //只有这里才需要 checkMode = true ，只有初始化需要，初始化完成就可以改回去了
        for (const ruleObjKey in this.ruleMap) {
            if (ruleName !== ruleObjKey) {
                this.setCurRuleName(ruleObjKey);
                const rule = this.getKeyRule(ruleObjKey);
                rule.ruleFun.apply(this);
            }
        }
        //init parser
        this.initParserMode();
        // this.parserModeExecRule(ruleName, targetFun);
        this.setCurRuleName(ruleName);
        this.processCst(ruleName, targetFun);
        //执行完毕，改为true
        this.initFlag = true;
    }

    initParserMode() {
        this.checkMode = false;
        this.continueMatching = true;
        this.cstStack = [];
    }

    private setRuleMap(ruleName: string, targetFun: any) {
        if (!this.getKeyRule(ruleName)) {
            const curRule = new RuleObj();
            curRule.ruleName = ruleName;
            curRule.ruleTokens = [[]];
            curRule.ruleFun = targetFun;
            this.setKeyRule(ruleName, curRule);
        }
    }

    processCst(ruleName: string, targetFun: Function) {
        let cst = new AlienCst();
        cst.name = ruleName;
        cst.children = [];
        this.setCurCst(cst);
        this.cstStack.push(cst);
        console.log(555555)
        console.log('zhixingfangfa:' + targetFun.name)
        console.log(JsonUtil.toJson(this.cstStack.map(item => ({name: item.name}))))
        // 规则解析
        targetFun.apply(this);
        this.cstStack.pop();
        console.log('zhixingle tuichu pop:' + cst.name)
        return cst
    }

    consume(tokenName: string) {
        if (this.parserMode && this.continueMatching) {
            if (this.tokens.length) {
                return this.consumeToken(tokenName);
            }
        } else if (this.needLookahead) {
            for (const curTokens of this.curRule.ruleTokens) {
                curTokens.push(tokenName);
            }
        }
    }

    setCurRuleName(ruleName: string) {
        this.curRuleName = ruleName;
    }

    consumeToken(tokenName: string) {
        let popToken = this._tokens[0];
        if (popToken.tokenName !== tokenName) {
            this.setContinueMatching(false);
            return;
        }
        popToken = this._tokens.shift();
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
            if (!this._tokens?.length) {
                throw new Error('token is empty, please set tokens');
                // return
            }
            // todo 这部分代码，感觉应该拿到前瞻校验的地方，不应该在执行的地方
            const lookaheadLength = Math.min(this.realMaxLookahead, this.tokens.length);
            const lookTokens = this._tokens.slice(0, lookaheadLength);
            const lookStr = lookTokens.map(item => item.tokenName).join('$$');
            const ruleTokens = this.curRule.ruleTokens;
            let matchFound = false;
            for (const ruleToken of ruleTokens) {
                let ruleTokenStr = ruleToken.slice(0, lookaheadLength).join('$$');
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
            const tokensBackup = lodash.cloneDeep(this._tokens);
            let matchFlag = false;
            for (const alienParserOr of alienParserOrs) {
                if (!matchFlag) {
                    const tokens = lodash.cloneDeep(tokensBackup);
                    this.setTokens(tokens);
                    this.setContinueMatching(true);
                    alienParserOr.alt();
                    if (this.continueMatching) {
                        matchFlag = true;
                    }
                }
            }
            return this.getCurCst();
        } else if (this.checkMode && this.needLookahead) {
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
