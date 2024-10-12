import SubhutiMatchToken from "./struct/SubhutiMatchToken";
import SubhutiCst from "./struct/SubhutiCst";
import JsonUtil from "../utils/JsonUtil";
import {SubhutiCreateToken} from "./struct/SubhutiCreateToken";

export class SubhutiParserOr {
    alt: Function;
}

enum LogicType {
    consume = 'consume',
    or = 'or',
    many = 'many',
    option = 'option',
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
    _continueMatch = true;
    thisClassName: string;

    get continueMatch() {
        return this._continueMatch;
    }

    setContinueMatch(flag: boolean) {
        this._continueMatch = flag;
    }

    setCurCst(curCst: SubhutiCst) {
        console.log('name:' + curCst.name)
        this.curCst = curCst;
    }

    getCurCst() {
        return this.curCst;
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

    get allowError() {
        return this._allowError
    }

    _allowError = false

    setAllowError(allowError: boolean) {
        this._allowError = allowError
    }

    //首次执行，则初始化语法栈，执行语法，将语法入栈，执行语法，语法执行完毕，语法出栈，加入父语法子节点
    subhutiRule(targetFun: any, ruleName: string) {
        const initFlag = this.initFlag;
        if (initFlag) {
            this.initFlag = false;
            // this.setMatchSuccess(false);
            this.cstStack = [];
        }
        this.setContinueMatch(true)
        let cst = this.processCst(ruleName, targetFun);
        if (initFlag) {
            //执行完毕，改为true
            this.initFlag = true;
        } else {
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

    //匹配1次或者N次
    AT_LEAST_ONE(tokenName: any) {
    }


    //匹配0次或者1次
    OPTION(tokenName: any) {
        return this.consumeToken(tokenName.name);
    }

    consume(tokenName: SubhutiCreateToken) {
        return this.consumeToken(tokenName.name);
    }

    //消耗token，将token加入父语法
    consumeToken(tokenName: string) {
        let popToken = this.tokens[0];
        console.log(tokenName)
        if (popToken.tokenName !== tokenName) {
            this.setContinueMatch(false);
            if (this.allowError) {
                return
            }
            throw new Error('匹配失败')
        }
        popToken = this.tokens.shift();
        const cst = new SubhutiCst();
        cst.name = popToken.tokenName;
        cst.value = popToken.tokenValue;
        this.curCst.children.push(cst);
        this.curCst.tokens.push(popToken);
        this.setContinueMatch(true);
        return this.generateCst(cst);
    }

    //or语法，遍历匹配语法，语法匹配成功，则跳出匹配，执行下一规则
    or(subhutiParserOrs: SubhutiParserOr[]) {
        this.setAllowError(true)
        const tokensBackup = JsonUtil.cloneDeep(this.tokens);
        for (const subhutiParserOr of subhutiParserOrs) {
            const tokens = JsonUtil.cloneDeep(tokensBackup);
            this.setTokens(tokens);
            subhutiParserOr.alt();
            // 如果处理成功则跳出
            if (this.continueMatch) {
                break;
            }
        }
        this.setAllowError(false)
        return this.getCurCst();
    }


    count = 0

    //匹配0次或者N次
    MANY(fun: Function) {
        this.setAllowError(true)

        if (this.count > 0) {
            throw new Error('cuowule')
        }
        this.count++
        console.log(this.continueMatch)
        this.setContinueMatch(true)
        // while (this.matchSuccess) {
        const tokensBackup = JsonUtil.cloneDeep(this.tokens);
        fun()
        //If the match fails, the tokens are reset.
        if (!this.continueMatch) {
            this.setTokens(tokensBackup);
            this.setContinueMatch(true)
            return this.getCurCst();
        }
        // }
        this.setAllowError(false)
        return this.getCurCst();
    }


    generateCst(cst: SubhutiCst) {
        return cst;
    }
}
