import SubhutiMatchToken from "./struct/SubhutiMatchToken";
import SubhutiCst from "./struct/SubhutiCst";
import JsonUtil from "../utils/JsonUtil";
import {SubhutiCreateToken} from "./struct/SubhutiCreateToken";
import Es5TokenConsumer from "../es5/Es5TokenConsume";
import SubhutiTokenConsumer from "./SubhutiTokenConsumer";
import {Es5TokensName} from "../es5/Es5Tokens";

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
    //这部分是初始化时执行
    const ruleName = targetFun.name;
    // 创建一个新的函数并显式指定函数的名称，这部分是执行时执行
    const wrappedFunction = function () {
        this.subhutiRule(targetFun, ruleName);
        return this.generateCst(this.curCst);
    };
    // 为新函数显式设置名称
    Object.defineProperty(wrappedFunction, 'name', {value: ruleName});
    return wrappedFunction
}

//为什么没有放SubhutiRule里，因为你不是所有的都会执行SubhutiRule
function CheckMethodCanExec(newTargetFun: any, context) {
    const ruleName = newTargetFun.name;
    // 创建一个新的函数并显式指定函数的名称
    const wrappedFunction = function (...args: any[]) {
        this.checkMethodCanExec(newTargetFun, args);
        return this.generateCst(this.curCst);
    }
    // 为新函数显式设置名称
    Object.defineProperty(wrappedFunction, 'name', {value: ruleName});
    return wrappedFunction
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default class SubhutiParser<T extends SubhutiTokenConsumer = SubhutiTokenConsumer> {
    tokenConsumer: T
    _tokens: SubhutiMatchToken[];
    initFlag = true;
    curCst: SubhutiCst;
    cstStack: SubhutiCst[] = [];
    _continueExec = true;
    thisClassName: string;
    uuid: string;

    printTokens() {
        console.log(this.tokens.map(item => item.tokenName).join(','))
    }

    printCstStacks() {
        console.log(this.cstStack.map(item => item.name).join(','))
    }

    constructor(tokens?: SubhutiMatchToken[]) {
        if (tokens) {
            this.setTokens(tokens);
        }
        this.thisClassName = this.constructor.name;
        this.uuid = generateUUID()
    }

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

    ////校验可执行没问题，因为肯定是可执行
    get tokens() {
        this.checkTokens();
        return this._tokens;
    }

    setTokens(tokens?: SubhutiMatchToken[]) {
        this._tokens = tokens;
        //这考虑的是什么情况，option、many，都有可能token处理完了，执行option、many，设置token时，需要为可匹配状态
        this.checkTokens();
    }


    get allowError() {
        return this._allowError;
    }

    _allowError = false;

    setAllowError(allowError: boolean) {
        this._allowError = allowError;
    }

    //随便调用，就是重复校验，这个暂时确认不需要动了
    checkContinueExec() {
        //continueExec should be true, because CheckMethodCanExec makes a judgment
        if (!this.continueExec) {
            throw new Error('syntax error');
        }
        if (!this.tokens.length) {
            throw new Error('tokens is empty, please set tokens');
        }
        // this.checkTokens()
    }

    //设置token时，需要为可匹配状态
    checkTokens() {
        //如果可以匹配，
        if (!this._tokens.length) {
            if (!this.allowError) {
                throw new Error('tokens is empty, please set tokens');
            }
        }
        if (!this.continueExec) {
            if (!this.allowError) {
                throw new Error('匹配失败');
            }
        }
    }

    checkMethodCanExec(newTargetFun: any, args: any[]) {
        //如果不能匹配，测判断允许错误，则直接返回，无法继续匹配只能返回，避免递归
        if (!this.continueExec) {
            if (this.allowError) {
                return this.generateCst(this.curCst);
            }
            throw new Error('匹配失败');
        } else if (this.continueExec) {
            //如果可以匹配，
            if (!this.tokens.length) {
                if (this.allowError) {
                    return this.generateCst(this.curCst);
                }
                throw new Error('tokens is empty, please set tokens');
            }
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
            this.setContinueExec(true);
            this.cstStack = [];
            this.ruleExecErrorStack = [];
        }
        console.log('zhixingle :' + ruleName)
        let cst = this.processCst(ruleName, targetFun);
        console.log('wanchengle :' + ruleName)
        if (initFlag) {
            //执行完毕，改为true
            this.initFlag = true;
        } else {
            if (cst) {
                const parentCst = this.cstStack[this.cstStack.length - 1];
                //优化cst展示
                if (!cst.children.length) {
                    cst.children = undefined
                }
                if (!cst.tokens.length) {
                    cst.tokens = undefined
                }
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
        cst.tokens = [];

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
    AT_LEAST_ONE(fun: Function) {
        this.checkContinueExec();
        let index = 0
        while (this.continueExec) {
            if (index > 0) {
                this.setAllowErrorNewState()
                const tokensBackup = JsonUtil.cloneDeep(this.tokens);
                fun();
                //必须放这里，会循环push，所以需要循环pop
                this.setAllowErrorLastStateAndPop()
                //If the match fails, the tokens are reset.
                if (!this.continueExec) {
                    this.setContinueExec(true);
                    this.setTokens(tokensBackup);
                    break;
                } else if (this.continueExec) {
                    //校验可执行没问题，因为肯定是可执行
                    if (!this.tokens.length) {
                        //如果token执行完毕，则跳出
                        break;
                    }
                }
            } else {
                fun();
                //肯定是continueExec，tokens才会为空
                //校验可执行没问题，因为肯定是可执行
                //只有没token才可能是continueExec=true，如果有token，有可能匹配了，也可能没匹配
                if (!this.tokens.length) {
                    if (this.continueExec) {
                        break;
                    } else if (!this.continueExec) {
                        throw new Error('不可能的情况')
                    }
                }
            }
            index++
        }
        //放循环里面了，逻辑更清晰,不放循环里，还需要判断index > 0
        /*if (index > 0) {
            //只有index>0 了才需要重置回去状态，放循环里多余，没必要
            this.setAllowError(!!this.allowErrorStack.length);
        }*/
        return this.getCurCst();
    }

    @CheckMethodCanExec
    //匹配0次或者1次
    Option(fun: Function) {
        this.checkContinueExec();
        this.setAllowErrorNewState()
        const tokensBackup = JsonUtil.cloneDeep(this.tokens);
        fun();
        //If the match fails, the tokens are reset.
        if (!this.continueExec) {
            this.setContinueExec(true);
            this.setTokens(tokensBackup);
        } else if (this.continueExec) {
            //防御性编程，肯定没问题的代码，因为这里是setAllowError(true)
            this.checkTokens()
        }
        //push了，需要pop
        this.setAllowErrorLastStateAndPop()
        return this.getCurCst();
    }

    @CheckMethodCanExec
    consume(tokenName: SubhutiCreateToken) {
        this.checkContinueExec()
        return this.consumeToken(tokenName.name);
    }

    //消耗token，将token加入父语法
    consumeToken(tokenName: string) {
        let popToken = this.getMatchToken(tokenName);
        if (popToken.tokenName === Es5TokensName.LBrace) {
            console.log(6666)
            console.log('this.curCst.name:' + this.curCst.name)
            this.printCstStacks()
            console.log(tokenName)
        }
        //容错代码
        if (!popToken || popToken.tokenName !== tokenName) {
            //因为CheckMethodCanExec 中组织了空token，所以这里不会触发
            this.setContinueExec(false);
            if (this.allowError) {
                return;
            }
            throw new Error('syntax error');
        }
        //性能优化先不管
        // this.setAllowError(this.allowErrorStack.length > 1)
        //如果成功匹配了一个，则将允许错误状态，改为上一个
        popToken = this.consumeMatchToken(tokenName)
        return this.generateCstByToken(popToken);
    }

    //获取token
    //如果token不匹配
    //则返回
    //token匹配则消除

    generateCstByToken(popToken: SubhutiMatchToken) {
        const cst = new SubhutiCst();
        cst.name = popToken.tokenName;
        cst.value = popToken.tokenValue;
        this.curCst.children.push(cst);
        this.curCst.pushCstToken(popToken);
        return this.generateCst(cst);
    }

    getMatchToken(tokenName: string) {
        let popToken = this.tokens[0];
        return popToken;
    }

    consumeMatchToken(tokenName: string) {
        return this.tokens.shift();
    }

    allowErrorStack = [];
    ruleExecErrorStack = [];

    setAllowErrorLastStateAndPop() {
        this.allowErrorStack.pop();
        this.onlySetAllowErrorLastState()
    }

    onlySetAllowErrorLastState() {
        this.setAllowError(!!this.allowErrorStack.length)
    }


    setAllowErrorNewState() {
        this.setAllowError(true);
        this.allowErrorStack.push(true);
    }

    @CheckMethodCanExec
    //or语法，遍历匹配语法，语法匹配成功，则跳出匹配，执行下一规则
    Or(subhutiParserOrs: SubhutiParserOr[]) {
        this.checkContinueExec();
        this.setAllowErrorNewState()
        const tokens = this.tokens
        const tokensBackup = JsonUtil.cloneDeep(tokens);
        const funLength = subhutiParserOrs.length
        let index = 0;
        for (const subhutiParserOr of subhutiParserOrs) {
            index++;
            //If it is the last round of the for loop, an error will be reported if it fails.
            if (index === funLength) {
                this.onlySetAllowErrorLastState()
            } else {
                this.setAllowError(true);
            }
            this.setContinueExec(true);
            const tokens = JsonUtil.cloneDeep(tokensBackup);
            this.setTokens(tokens);
            subhutiParserOr.alt();
            // If the processing is successful, then exit the loop
            // 执行成功，则完成任务，做多一次，则必须跳出
            if (this.continueExec) {
                //别的while都是，没token，才break，这个满足一次就必须break，无论有没有tokens还
                break;
            }
        }
        //必须放这里，放this.continueExec可能不执行，放index === funLength  也有可能this.continueExec 时不执行，俩地方都放可能执行两次，只能放这里
        this.setAllowErrorLastStateAndPop()
        return this.getCurCst();
    }

    @CheckMethodCanExec
    //匹配0次或者N次
    Many(fun: Function) {
        this.checkContinueExec();
        this.setAllowErrorNewState()
        while (this.continueExec) {
            const tokensBackup = JsonUtil.cloneDeep(this.tokens);
            fun();
            //If the match fails, the tokens are reset.
            if (!this.continueExec) {
                this.setContinueExec(true);
                this.setTokens(tokensBackup);
                break
            } else if (this.continueExec) {
                //校验可执行没问题，因为肯定是可执行
                //如果上一次把token处理空了，应该跳出，否则会再次进入
                if (!this.tokens.length) {
                    break;
                }
            }
        }
        //只能放这里，放循环里会重复pop，，many允许多次 if (this.continueExec)，第一次执行后有tokens，就会触发了，会有问题
        this.setAllowErrorLastStateAndPop()
        return this.getCurCst();
    }

    generateCst(cst: SubhutiCst) {
        return cst;
    }

    //默认就是遍历生成
    exec(cst: SubhutiCst = this.getCurCst(), code = '') {
        //自己决定自己的code 是什么
        if (cst.value) {
            code += ' ' + cst.value;
        } else {
            cst.children.forEach(item => {
                code += ' ' + this.exec(item, code);
            })
        }
        return code.trim();
    }
}
