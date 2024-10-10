import AlienMatchToken from "./struct/AlienMatchToken";
import AlienCst from "./struct/AlienCst";
import JsonUtil from "../utils/JsonUtil";

export class AlienParserOr {
    alt: Function;
}
export function AlienRule(targetFun: any, context) {
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
        const initFlag = this.initFlag;
        if (initFlag) {
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
        const tokensBackup = JsonUtil.cloneDeep(this.tokens);
        for (const alienParserOr of alienParserOrs) {
            const tokens = JsonUtil.cloneDeep(tokensBackup);
            this.setTokens(tokens);
            this.setMatchSuccess(false);
            alienParserOr.alt();
            // 如果处理成功则跳出
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
