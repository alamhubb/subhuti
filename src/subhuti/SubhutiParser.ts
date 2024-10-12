import SubhutiMatchToken from "./struct/SubhutiMatchToken";
import SubhutiCst from "./struct/SubhutiCst";
import JsonUtil from "../utils/JsonUtil";
import {SubhutiCreateToken} from "./struct/SubhutiCreateToken";

export class SubhutiParserOr {
    alt: Function;
}
export function SubhutiRule(targetFun: any, context) {
    const ruleName = targetFun.name;
    return function () {
        this.subhutiRule(targetFun, ruleName);
        return this.generateCst(this.curCst);
    };
}
export default class SubhutiParser {
    _tokens: SubhutiMatchToken[];
    initFlag = true;
    curCst: SubhutiCst;
    cstStack: SubhutiCst[] = [];
    _matchSuccess = true;
    thisClassName: string;
    get matchSuccess() {
        return this._matchSuccess;
    }
    setMatchSuccess(flag: boolean) {
        this._matchSuccess = flag;
    }
    setCurCst(curCst: SubhutiCst) {
        this.curCst = curCst;
    }
    get tokens() {
        if (!this._tokens?.length) {
            throw new Error('tokens is empty, please set tokens');
        }
        return this._tokens;
    }
    setTokens(tokens?: SubhutiMatchToken[]) {
        if (!tokens?.length) {
            throw Error('tokens is empty');
        }
        this._tokens = tokens;
    }
    constructor(tokens?: SubhutiMatchToken[]) {
        if (tokens) {
            this.setTokens(tokens);
        }
        this.thisClassName = this.constructor.name;
    }
    //首次执行，则初始化语法栈，执行语法，将语法入栈，执行语法，语法执行完毕，语法出栈，加入父语法子节点
    subhutiRule(targetFun: any, ruleName: string) {
        const initFlag = this.initFlag;
        if (initFlag) {
            this.initFlag = false;
            this.setMatchSuccess(false);
            this.cstStack = [];
        }
        let cst = this.processCst(ruleName, targetFun);
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
    //执行语法，将语法入栈，执行语法，语法执行完毕，语法出栈
    processCst(ruleName: string, targetFun: Function) {
        let cst = new SubhutiCst();
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
    consume(tokenName: SubhutiCreateToken) {
        return this.consumeToken(tokenName.name);
    }
    //消耗token，将token加入父语法
    consumeToken(tokenName: string) {
        let popToken = this.tokens[0];
        if (popToken.tokenName !== tokenName) {
            return;
        }
        popToken = this.tokens.shift();
        const cst = new SubhutiCst();
        cst.name = popToken.tokenName;
        cst.value = popToken.tokenValue;
        this.curCst.children.push(cst);
        this.curCst.tokens.push(popToken);
        this.setMatchSuccess(true);
        return this.generateCst(cst);
    }
    //or语法，遍历匹配语法，语法匹配成功，则跳出匹配，执行下一规则
    or(subhutiParserOrs: SubhutiParserOr[]) {
        if (!this.tokens?.length) {
            throw new Error('token is empty, please set tokens');
        }
        const tokensBackup = JsonUtil.cloneDeep(this.tokens);
        for (const subhutiParserOr of subhutiParserOrs) {
            const tokens = JsonUtil.cloneDeep(tokensBackup);
            this.setTokens(tokens);
            this.setMatchSuccess(false);
            subhutiParserOr.alt();
            // 如果处理成功则跳出
            if (this.matchSuccess) {
                break;
            }
        }
        return this.getCurCst();
    }
    generateCst(cst: SubhutiCst) {
        return cst;
    }
    getCurCst() {
        return this.curCst;
    }
}
