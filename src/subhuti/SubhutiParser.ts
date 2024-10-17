import SubhutiMatchToken from "./struct/SubhutiMatchToken";
import SubhutiCst from "./struct/SubhutiCst";
import JsonUtil from "../utils/JsonUtil";
import {SubhutiCreateToken} from "./struct/SubhutiCreateToken";
import Es5TokenConsumer from "../syntax/es5/Es5TokenConsume";
import SubhutiTokenConsumer from "./SubhutiTokenConsumer";
import {Es5TokensName} from "../syntax/es5/Es5Tokens";
import QqqqUtil from "../utils/qqqqUtil";

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

export class SubhutiBackData {
    tokens: SubhutiMatchToken[]
    curCstChildren: SubhutiCst[]
    curCstTokens: SubhutiMatchToken[]
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
    _tokens: SubhutiMatchToken[] = []
    initFlag = true;
    curCst: SubhutiCst;
    cstStack: SubhutiCst[] = [];
    private _continueMatch = true;
    thisClassName: string;
    uuid: string;

    //只针对or，特殊，many有可能没匹配就触发true导致不执行下面的，避免这种情况
    private _orBreakFlag = false

    get orBreakFlag(): boolean {
        return this._orBreakFlag;
    }

    setOrBreakFlag(value: boolean) {
        this._orBreakFlag = value;
    }

//必须两个一个不够用，
    // 一个是判断是否存在错误，就不继续执行了的，
    // 另一个是判断是否跳出循环的，只有匹配成功才跳出循环 , 只用一个的问题就是 or的时候，
    //
    // 一个就够了，最新
    // 如果你进入之后改为了false，里面的匹配就无法执行了，如果你不改代表着true进入，里面应该有给改为false的呀
    //many呢，many这种出去的时候，他又会给改成true了，进入改为true，while，改为false，执行完毕改为如果为false改为ture，等于没执行，只有true才能进入，出去也是true
    //or，ture进入，执行完是true就跳出，执行完是false就重新执行，改为true，肯定有地方会改为false的呀
    //是否继续匹配
    //是否有错误
    // 最新问题，如果一个or里面只有一个many，
    get continueMatch() {
        return this._continueMatch;
    }

    setContinueMatch(flag: boolean) {
        this._continueMatch = flag;
    }

    /*  private _continueExec = true

      setContinueExec(value: boolean) {
          this._continueExec = value;
      }

      get continueExec(): boolean {
          return this._continueExec;
      }
  */
    //一个是标识many这种
    //一个是标识token匹配失败了


//many中，无线循环，什么时候终止呢， 执行时有个flag，  执行前改为false，如果 执行成功变为true了则可以再次进去，再次进入后将他改为false

    printCst() {
        QqqqUtil.log(this.getCurCst())
    }

    printMatchState(){
        QqqqUtil.log(this.continueMatch)
    }

    printTokens() {
        this.printMatchState()
        QqqqUtil.log('tokens:' + this.tokens.map(item => item.tokenName).join(','))
    }

    printCstStacks() {
        QqqqUtil.log(this.cstStack.map(item => item.name).join(','))
    }

    constructor(tokens?: SubhutiMatchToken[]) {
        if (tokens) {
            this.setTokens(tokens);
        }
        this.thisClassName = this.constructor.name;
        this.uuid = generateUUID()
    }

    setCurCst(curCst: SubhutiCst) {
        this.curCst = curCst;
    }

    getCurCst() {
        return this.curCst;
    }

    ////校验可执行没问题，因为肯定是可执行
    public get tokens() {
        return this._tokens;
    }

    setTokens(tokens?: SubhutiMatchToken[]) {
        this._tokens = tokens;
        //这考虑的是什么情况，option、many，都有可能token处理完了，执行option、many，设置token时，需要为可匹配状态
        //如果可以匹配，
        //如果可以匹配，
        this.checkTokensOnly();
    }

    checkTokensOnly() {
        if (this.tokenIsEmpty) {
            if (!this.allowError) {
                throw new Error('tokens is empty, please set tokens');
            }
        }
    }

    reSetParentChildren(parentTokensBackup: SubhutiMatchToken[], children: SubhutiCst[]) {
        this.curCst.tokens = parentTokensBackup
        this.curCst.children = children
    }


    get allowError() {
        return this._allowError;
    }

    _allowError = false;

    setAllowError(allowError: boolean) {
        this._allowError = allowError;
    }

    get checkMethodCanExec() {
        //如果不能匹配，测判断允许错误，则直接返回，无法继续匹配只能返回，避免递归
        return this.continueMatch;
    }

    public get tokenIsEmpty() {
        //子类重写了
        return !this._tokens || !this._tokens.length
    }

    //首次执行，则初始化语法栈，执行语法，将语法入栈，执行语法，语法执行完毕，语法出栈，加入父语法子节点
    subhutiRule(targetFun: any, ruleName: string) {
        const initFlag = this.initFlag;
        if (initFlag) {
            this.initFlag = false;
            this.allowErrorStack = [];
            this.setContinueMatch(true);
            this.cstStack = [];
            this.ruleExecErrorStack = [];
        } else {
            if (!this.checkMethodCanExec) {
                return
            }
        }
        let cst = this.processCst(ruleName, targetFun);
        if (initFlag) {
            //执行完毕，改为true
            this.initFlag = true;
        } else {
            const parentCst = this.cstStack[this.cstStack.length - 1];
            if (cst) {
                //优化cst展示
                if (!cst.children.length) {
                    cst.children = undefined
                }
                if (!cst.tokens.length) {
                    cst.tokens = undefined
                } else {
                    // parentCst.tokens.push(...cst.tokens);
                }
                parentCst.children.push(cst);
            }
            this.setCurCst(parentCst);
        }
    }

    //执行语法，将语法入栈，执行语法，语法执行完毕，语法出栈
    processCst(ruleName: string, targetFun: Function) {
        let cst = new SubhutiCst();
        cst.name = ruleName;
        // if (this.curCst) {
        //     cst.pathName = this.curCst.pathName + pathNameSymbol + cst.name
        // } else {
        //     cst.pathName = ruleName
        // }
        cst.children = [];
        cst.tokens = [];

        this.setCurCst(cst);
        this.cstStack.push(cst);
        this.ruleExecErrorStack.push(ruleName);
        // 规则解析
        targetFun.apply(this);
        this.cstStack.pop();
        this.ruleExecErrorStack.pop();
        if (this.continueMatch) {
            return cst;
        }
        return null;
    }

    //匹配1次或者N次
    AT_LEAST_ONE(fun: Function) {
        if (!this.checkMethodCanExec) {
            return
        }
        let index = 0
        while (this.continueMatch) {
            if (index > 0) {
                this.setAllowErrorNewState()
                let backData = JsonUtil.cloneDeep(this.backData);
                fun();
                //必须放这里，会循环push，所以需要循环pop
                this.setAllowErrorLastStateAndPop()
                //If the match fails, the tokens are reset.
                if (!this.continueMatch) {
                    this.setBackData(backData);
                    break;
                } else if (this.continueMatch) {
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
                    if (this.continueMatch) {
                        break;
                    } else if (!this.continueMatch) {
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

    //匹配0次或者1次
    Option(fun: Function) {
        if (!this.checkMethodCanExec) {
            return
        }
        let lastBreakFlag = this.orBreakFlag
        this.setAllowErrorNewState()
        let backData = JsonUtil.cloneDeep(this.backData);
        fun();
        //If the match fails, the tokens are reset.
        if (!this.continueMatch) {
            this.setBackData(backData)
        }
        if (this.orBreakFlag || lastBreakFlag) {
            this.setOrBreakFlag(true)
        }
        //push了，需要pop
        this.setAllowErrorLastStateAndPop()
        return this.getCurCst();
    }


    consume(tokenName: SubhutiCreateToken) {
        if (!this.checkMethodCanExec) {
            return
        }
        return this.consumeToken(tokenName.name);
    }

    //消耗token，将token加入父语法
    consumeToken(tokenName: string) {
        let popToken = this.getMatchToken(tokenName);
        //容错代码
        if (!popToken || popToken.tokenName !== tokenName) {
            //因为CheckMethodCanExec 中组织了空token，所以这里不会触发
            //内部consume,也需要把标识设为false，有可能深层子设为了true，但是后来又改为了false，如果不同步改就会没同步
            this.setContinueMatchAndNoBreak(false)
            // this.setContinueFor(false);
            if (this.allowError) {
                return;
            }
            throw new Error('syntax error');
        }
        this.setContinueMatchAndNoBreak(true)
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
        // cst.pathName = this.curCst.pathName + pathNameSymbol + cst.name
        this.curCst.children.push(cst);
        this.curCst.pushCstToken(popToken);
        return this.generateCst(cst);
    }

    getMatchToken(tokenName: string) {
        let popToken = this.tokens[0];
        return popToken;
    }

    consumeMatchToken(tokenName: string) {
        const token = this.tokens.shift();
        return token;
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

    //or语法，遍历匹配语法，语法匹配成功，则跳出匹配，执行下一规则
    Or(subhutiParserOrs: SubhutiParserOr[]) {
        if (!this.checkMethodCanExec) {
            return
        }
        this.setAllowErrorNewState()
        const funLength = subhutiParserOrs.length
        let index = 0;

        let lastBreakFlag = this.orBreakFlag

        const uuid = generateUUID()

        for (const subhutiParserOr of subhutiParserOrs) {
            index++;
            //If it is the last round of the for loop, an error will be reported if it fails.
            if (index === funLength) {
                this.onlySetAllowErrorLastState()
            } else {
                this.setAllowError(true);
            }
            let backData = JsonUtil.cloneDeep(this.backData);
            //考虑到执行空的话，如果执行了空元素，应该是跳出的
            this.setOrBreakFlag(false)
            subhutiParserOr.alt();
            // If the processing is successful, then exit the loop
            // 执行成功，则完成任务，做多一次，则必须跳出
            // 只有有成功的匹配才跳出循环，否则就一直执行，直至循环结束
            if (this.continueForAndNoBreak) {
                //别的while都是，没token，才break，这个满足一次就必须break，无论有没有tokens还
                break;
            } else if (!this.continueForAndNoBreak) {
                //匹配失败
                if (index !== funLength) {
                    //只要不为最后一次，都设为true
                    //没逃出，则重置数据，继续执行
                    this.setBackData(backData)
                }
                // this.printTokens()
            }
        }
        //本级和上级有一个为true则改为true
        if (this.orBreakFlag || lastBreakFlag) {
            this.setOrBreakFlag(true)
        }
        //必须放这里，放this.continueExec可能不执行，放index === funLength  也有可能this.continueExec 时不执行，俩地方都放可能执行两次，只能放这里
        this.setAllowErrorLastStateAndPop()
        return this.getCurCst();
    }

    get continueForAndNoBreak() {
        return this.orBreakFlag && this.continueMatch
    }

    setContinueMatchAndNoBreak(value: boolean) {
        //一个控制是否继续匹配
        //一个控制是否跳出循环，while，or
        this.setContinueMatch(value)
        this.setOrBreakFlag(value)
        //为什么需要两个，因为or进入时会把跳出标识设为false，为ture跳出，否则继续下一次
        //如果用一个标识，设为false，之后匹配就不执行了
    }

    // backData: any

    setBackData(backData: SubhutiBackData) {
        // console.log('chongzhile shuju')
        this.setTokensAndParentChildren(backData.tokens, backData.curCstTokens, backData.curCstChildren)
    }

    public get backData() {
        const backData: SubhutiBackData = {
            tokens: this.tokens,
            curCstChildren: this.curCst.children,
            curCstTokens: this.curCst.tokens,
        }
        return backData
    }

    private setTokensAndParentChildren(tokensBackup: SubhutiMatchToken[], parentTokensBackup: SubhutiMatchToken[], parentChildrenBack: SubhutiCst[]) {
        this.setContinueMatch(true)
        this.setTokens(tokensBackup);
        this.reSetParentChildren(parentTokensBackup, parentChildrenBack);
    }

    Many(fun: Function) {
        if (!this.checkMethodCanExec) {
            return
        }
        //不需要 再循环内部修改，因为如果子节点改了，退出子节点时也会重置回来的
        this.setAllowErrorNewState()

        let lastBreakFlag = this.orBreakFlag

        let backData = JsonUtil.cloneDeep(this.backData);

        this.setContinueMatchAndNoBreak(true)
        let breakFlag = false
        while (this.continueForAndNoBreak) {
            this.setOrBreakFlag(false)
            backData = JsonUtil.cloneDeep(this.backData);
            fun();
            //If the match fails, the tokens are reset.
            breakFlag = false
            if (!this.continueForAndNoBreak) {
                this.setBackData(backData);
                //如果匹配失败则跳出
                breakFlag = true
            }
            //如果跳出，则重置
            if (breakFlag) {
                //orBreakFlag 为false则 continueMatch 也肯定为false，肯定会触发这里
                break
            }
        }
        if (!breakFlag) {
            throw new Error('不可能的情况')
        }
        if (this.orBreakFlag || lastBreakFlag) {
            this.setOrBreakFlag(true);
        }
        //只能放这里，放循环里会重复pop，，many允许多次 if (this.continueExec)，第一次执行后有tokens，就会触发了，会有问题
        this.setAllowErrorLastStateAndPop()
        return this.getCurCst();
    }

    generateCst(cst: SubhutiCst) {
        return cst;
    }

    //默认就是遍历生成
    exec(cst: SubhutiCst = this.getCurCst(), code = ''): string {
        if (cst.value) {
            code = (' ' + code + ' ' + cst.value)
        } else {
            if (cst.children) {
                const childrenCode = cst.children
                    .map(child => this.exec(child, code))
                    .join(' ');
                code = (code + ' ' + childrenCode)
            }
        }
        return code.trim();
    }
}
