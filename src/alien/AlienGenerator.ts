import AlienCst from "./AlienCst";
import AlienMatchToken from "./AlienMatchToken";
import RuleObj from "./RuleObj";


export function GeneratorRule(targetFun: any) {
    console.log(targetFun)
    const ruleName = targetFun.name;
    return function (paramCst: AlienCst) {
        this.generatorCst(ruleName, paramCst, targetFun);
        return this.generateCst(this.curCst);
    };
}

export default class AlienGenerator {

    tokens: AlienMatchToken[]
    curCst: AlienCst;
    rootCst: AlienCst
    cstStack: AlienCst[] = [];


    generatorCst(ruleName, paramCst: AlienCst<any>, targetFun: any) {
        const rootFlag = !this.rootCst;
        let cst = new AlienCst();
        cst.name = ruleName;
        cst.children = [];
        if (rootFlag) {
            //初始化
            this.initializeParserState(ruleName, cst);
            this.tokens = paramCst.tokens
        }
        this.curCst = cst
        this.cstStack.push(this.curCst);
        targetFun.apply(this);
        paramCst.children.forEach(item => {
            if (item.extendObject && item.extendObject.alt) {
                item.extendObject.alt.apply(this, item)
            }
        })
        this.cstStack.pop();
        //重置状态
        if (rootFlag) {
            this.rootCst = null
        } else {
            const parentCst = this.cstStack[this.cstStack.length - 1];
            parentCst.children.push(this.curCst);
        }
    }

    append(tokenName: string) {
        const findTokenIndex = this.tokens.findIndex(item => item.tokenName === tokenName)
        if (findTokenIndex < 0) {
            throw new Error('不存在的token')
        }
        //删除token
        const appendToken = this.tokens.splice(findTokenIndex, 1)[1]
        const curCst = new AlienCst()
        curCst.name = appendToken.tokenName
        curCst.value = appendToken.tokenValue
    }

    initializeParserState(ruleName: string, cst: AlienCst) {
        this.tokens = [];
        this.rootCst = cst;
        this.cstStack = [];
    }


    //默认就是遍历生成
    generator(cst: AlienCst, code = '') {
        cst.children.forEach(item => {
            if (item.value) {
                code += ' ' + item.value;
            } else {
                code = this.generator(item, code);
            }
        });
        return code.trim();
    }


    getCurCst() {
        return this.curCst;
    }

    generateCst(cst: AlienCst) {
        return cst;
    }
}
