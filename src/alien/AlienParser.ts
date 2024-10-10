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
    initFlag = true;
    curCst: AlienCst<T>;
    cstStack: AlienCst<T>[] = [];
    _continueMatching = true;

    get continueMatching() {
        return this._continueMatching
    }

    setContinueMatching(flag: boolean) {
        this._continueMatching = flag;
    }

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

    constructor(tokens?: AlienMatchToken[]) {
        if (tokens) {
            this.setTokens(tokens);
        }
    }

    alienRule(targetFun: any, ruleName: string) {
        //优化注意，非parserMode都需要执行else代码，不能  this.parserMode || rootFlag
        //校验模式，且为首次执行
        const initFlag = this.initFlag;
        if (initFlag) {
            //init check mode
            // this.initRule(ruleName, targetFun);
            //init parser
            this.initFlag = false
            this.setContinueMatching(true)
            this.cstStack = [];
            console.log('zhixingle chushihua ')
            // this.parserModeExecRule(ruleName, targetFun);
        }
        this.processCst(ruleName, targetFun);
        if (initFlag) {
            //执行完毕，改为true
            this.initFlag = true;
        } else {
            const parentCst = this.cstStack[this.cstStack.length - 1];
            parentCst.children.push(this.curCst);
            console.log(7777)
            console.log(parentCst)
            this.setCurCst(parentCst);
        }
    }

    //初始化时执行，像内添加初始化的program
    //执行时执行，执行每一个具体的时候，parser时执行4次没问题
    //为什么Generate执行了12次呢
    processCst(ruleName: string, targetFun: Function) {
        let cst = new AlienCst();
        console.log(11111111111)
        console.log(ruleName)
        console.log(this.curCst?.name)
        console.log(this.cstStack.map(item => item.name))
        console.log(2222222)
        cst.name = ruleName;
        cst.children = [];
        this.setCurCst(cst);
        this.cstStack.push(cst);
        // 规则解析
        targetFun.apply(this);
        this.cstStack.pop();
        console.log(33333)
        console.log(ruleName)
        console.log(this.curCst?.name)
        console.log(this.cstStack.map(item => item.name))
        console.log(444444)
        return cst;
    }

    consume(tokenName: string) {
        if (this.tokens.length) {
            return this.consumeToken(tokenName);
        }
        /*else if (this.needLookahead) {
            for (const curTokens of this.curRule.ruleTokens) {
                curTokens.push(tokenName);
            }
        }*/
    }

    setCurRuleName(ruleName: string) {
        this.curRuleName = ruleName;
    }

    consumeToken(tokenName: string) {
        console.log('zhixing consumeToken:'+tokenName)
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
        console.log('this.curCst.children:'+tokenName)
        console.log(this.curCst.name)
        return this.generateCst(cst);
    }

    generateCst(cst: AlienCst<T>) {
        return cst;
    }

    or(alienParserOrs: AlienParserOr[]) {
        if (!this.tokens?.length) {
            throw new Error('token is empty, please set tokens');
            // return
        }
        // todo 这部分代码，感觉应该拿到前瞻校验的地方，不应该在执行的地方，其实只是一个预校验
        /*const lookaheadLength = Math.min(this.realMaxLookahead, this.tokens.length);
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
        }*/
        const tokensBackup = lodash.cloneDeep(this.tokens);
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

    }

    getCurCst() {
        return this.curCst;
    }
}
