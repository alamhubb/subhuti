import SubhutiMatchToken from "./struct/SubhutiMatchToken";
import SubhutiCst from "./struct/SubhutiCst";
import JsonUtil from "../utils/JsonUtil";
import { SubhutiCreateToken } from "./struct/SubhutiCreateToken";
export class SubhutiParserOr {
    alt: Function;
}
enum LogicType {
    consume = 'consume',
    or = 'or',
    many = 'many',
    option = 'option'
}
export function SubhutiRule(targetFun: any, context) {
    const ruleName = targetFun.name;
    return function () {
        this.subhutiRule(targetFun, ruleName);
        return this.generateCst(this.curCst);
    };
}
function CheckMethodCanExec(newTargetFun: any) {
    return function (...args: any[]) {
        return this.checkMethodCanExec(newTargetFun, args);
    };
}
export default class SubhutiParser {
    _tokens: SubhutiMatchToken[];
    initFlag = true;
    curCst: SubhutiCst;
    cstStack: SubhutiCst[] = [];
    _continueExec = true;
    thisClassName: string;
    get continueExec() {
        return this._continueExec;
    }
    setContinueExec(flag: boolean) {
        this._continueExec = flag;
    }
    setCurCst(curCst: SubhutiCst) {
        this.curCst = curCst;
    }
    getCurCst() {
        return this.curCst;
    }
    get tokens() {
        this.checkContinueExec();
        return this._tokens;
    }
    setTokens(tokens?: SubhutiMatchToken[]) {
        this._tokens = tokens;
        this.checkTokens();
    }
    constructor(tokens?: SubhutiMatchToken[]) {
        if (tokens) {
            this.setTokens(tokens);
        }
        this.thisClassName = this.constructor.name;
    }
    get allowError() {
        return this._allowError;
    }
    _allowError = false;
    setAllowError(allowError: boolean) {
        this._allowError = allowError;
    }
    checkMethodCanExec(newTargetFun: any, args: any[]) {
        if (!this.continueExec) {
            if (this.allowError) {
                return this.generateCst(this.curCst);
            }
            throw new Error('匹配失败');
        }
        if (!this._tokens?.length) {
            if (this.allowError) {
                return this.generateCst(this.curCst);
            }
            throw new Error('tokens is empty, please set tokens');
        }
        return newTargetFun.apply(this, args);
    }
    //首次执行，则初始化语法栈，执行语法，将语法入栈，执行语法，语法执行完毕，语法出栈，加入父语法子节点
    @CheckMethodCanExec
    subhutiRule(targetFun: any, ruleName: string) {
        const initFlag = this.initFlag;
        if (initFlag) {
            this.initFlag = false;
            this.allowErrorStack = [];
            // this.setMatchSuccess(false);
            this.cstStack = [];
            this.ruleExecErrorStack = [];
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
        this.ruleExecErrorStack.push(ruleName);
        // 规则解析
        targetFun.apply(this);
        this.cstStack.pop();
        this.ruleExecErrorStack.pop();
        if (this.continueExec) {
            return cst;
        }
        return null;
    }
    @CheckMethodCanExec
    //匹配1次或者N次
    AT_LEAST_ONE(tokenName: any) {
    }
    @CheckMethodCanExec
    //匹配0次或者1次
    OPTION(fun: Function) {
        this.checkContinueExec();
        this.setAllowError(true);
        this.allowErrorStack.push(true);
        const tokensBackup = JsonUtil.cloneDeep(this.tokens);
        fun();
        //If the match fails, the tokens are reset.
        if (!this.continueExec) {
            this.setTokens(tokensBackup);
        }
        //因为允许空
        this.allowErrorStack.pop();
        this.setContinueExec(true);
        this.setAllowError(!!this.allowErrorStack.length);
        return this.getCurCst();
    }
    @CheckMethodCanExec
    consume(tokenName: SubhutiCreateToken) {
        return this.consumeToken(tokenName.name);
    }
    //消耗token，将token加入父语法
    consumeToken(tokenName: string) {
        let popToken = this.tokens[0];
        if (!popToken) {
            throw new Error('syntax error');
        }
        if (popToken.tokenName !== tokenName) {
            this.setContinueExec(false);
            if (this.allowError) {
                return;
            }
            throw new Error('匹配失败');
        }
        popToken = this.tokens.shift();
        const cst = new SubhutiCst();
        cst.name = popToken.tokenName;
        cst.value = popToken.tokenValue;
        this.curCst.children.push(cst);
        this.curCst.tokens.push(popToken);
        return this.generateCst(cst);
    }
    allowErrorStack = [];
    ruleExecErrorStack = [];
    @CheckMethodCanExec
    //or语法，遍历匹配语法，语法匹配成功，则跳出匹配，执行下一规则
    or(subhutiParserOrs: SubhutiParserOr[]) {
        this.checkContinueExec();
        this.allowErrorStack.push(true);
        const tokensBackup = JsonUtil.cloneDeep(this.tokens);
        let index = 0;
        for (const subhutiParserOr of subhutiParserOrs) {
            index++;
            //If it is the last round of the for loop, an error will be reported if it fails.
            // if (index === funLength) {
            //     this.setAllowError(false)
            // } else {
            this.setAllowError(true);
            this.setContinueExec(true);
            const tokens = JsonUtil.cloneDeep(tokensBackup);
            this.setTokens(tokens);
            subhutiParserOr.alt();
            // If the processing is successful, then exit the loop
            if (this.continueExec) {
                break;
            }
        }
        this.allowErrorStack.pop();
        this.setAllowError(!!this.allowErrorStack.length);
        return this.getCurCst();
    }
    @CheckMethodCanExec
    //匹配0次或者N次
    MANY(fun: Function) {
        this.checkContinueExec();
        this.setAllowError(true);
        this.allowErrorStack.push(true);
        while (this.continueExec) {
            const tokensBackup = JsonUtil.cloneDeep(this.tokens);
            if (!this.tokens.length) {
                break;
            }
            fun();
            //If the match fails, the tokens are reset.
            if (!this.continueExec) {
                this.setTokens(tokensBackup);
            }
        }
        //因为允许空
        this.allowErrorStack.pop();
        this.setContinueExec(true);
        this.setAllowError(!!this.allowErrorStack.length);
        return this.getCurCst();
    }
    generateCst(cst: SubhutiCst) {
        return cst;
    }
    //随便调用，就是重复校验
    checkContinueExec() {
        //continueExec should be true, because CheckMethodCanExec makes a judgment
        if (!this.continueExec) {
            throw new Error('syntax error');
        }
    }
    checkTokens() {
        if (!this._tokens?.length) {
            if (!this.allowError) {
                throw new Error('tokens is empty, please set tokens');
            }
        }
    }
}
