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
export default class AlienParser {
    _tokens: AlienMatchToken[];
    initFlag = true;
    curCst: AlienCst;
    cstStack: AlienCst[] = [];
    _matchSuccess = true;
    thisClassName: string;
    get matchSuccess() {
        return this._matchSuccess;
    }
    setMatchSuccess(flag: boolean) {
        this._matchSuccess = flag;
    }
    //为什么需要，因为获取curRule
    curRuleName = null;
    setCurCst(curCst: AlienCst) {
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
        this.thisClassName = this.constructor.name;
    }
    alienRule(targetFun: any, ruleName: string) {
        //优化注意，非parserMode都需要执行else代码，不能  this.parserMode || rootFlag
        //校验模式，且为首次执行
        const initFlag = this.initFlag;
        if (initFlag) {
            //init check mode
            this.initFlag = false;
            this.setMatchSuccess(false);
            this.cstStack = [];
        }
        let cst = this.processCst(ruleName, targetFun);
        if (cst) {
        }
        if (initFlag) {
            //执行完毕，改为true
            this.initFlag = true;
        }
        else {
            if (cst) {
                const parentCst = this.cstStack[this.cstStack.length - 1];
                parentCst.children.push(cst);
                this.setCurCst(parentCst);
            }
        }
    }
    //初始化时执行，像内添加初始化的program
    //执行时执行，执行每一个具体的时候，parser时执行4次没问题
    //为什么Generate执行了12次呢
    processCst(ruleName: string, targetFun: Function) {
        let cst = new AlienCst();
        cst.name = ruleName;
        cst.children = [];
        this.setCurCst(cst);
        this.cstStack.push(cst);
        // 规则解析
        targetFun.apply(this);
        this.cstStack.pop();
        if (cst.children.length) {
            return cst;
        }
        return null;
    }
    consume(tokenName: string) {
        return this.consumeToken(tokenName);
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
        let popToken = this.tokens[0];
        if (popToken.tokenName !== tokenName) {
            return;
        }
        popToken = this.tokens.shift();
        const cst = new AlienCst();
        cst.name = popToken.tokenName;
        cst.value = popToken.tokenValue;
        this.curCst.children.push(cst);
        this.curCst.tokens.push(popToken);
        this.setMatchSuccess(true);
        return this.generateCst(cst);
    }
    generateCst(cst: AlienCst) {
        return cst;
    }
    or(alienParserOrs: AlienParserOr[]) {
        if (!this.tokens?.length) {
            throw new Error('token is empty, please set tokens');
        }
        const tokensBackup = lodash.cloneDeep(this.tokens);
        for (const alienParserOr of alienParserOrs) {
            const tokens = lodash.cloneDeep(tokensBackup);
            this.setTokens(tokens);
            this.setMatchSuccess(false);
            alienParserOr.alt();
            //如果处理成功则跳出
            if (this.matchSuccess) {
                break;
            }
        }
        return this.getCurCst();
    }
    getCurCst() {
        return this.curCst;
    }
}
