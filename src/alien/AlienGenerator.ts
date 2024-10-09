import AlienCst from "./AlienCst";
import AlienMatchToken from "./AlienMatchToken";
import RuleObj from "./RuleObj";


export function GeneratorRule(targetFun: any) {
    console.log(targetFun)
    const ruleName = targetFun.name;
    return function (paramCst: AlienCst) {
        console.log(333333)
        console.log(paramCst)
        this.generatorCst(ruleName, paramCst, targetFun);
        return this.generateCst(this.curCst);
    };
}

export default class AlienGenerator<T = any> {

    tokens: AlienMatchToken[]
    curCst: AlienCst<T>;
    rootCst: AlienCst<T>
    cstStack: AlienCst<T>[] = [];
    rootFlag = true


    //paramCst = 旧版cst
    generatorCst(ruleName: string, paramCst: AlienCst<any>, targetFun: any) {
        console.log(22222)
        console.log(paramCst)
        const rootFlag = this.rootFlag
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
        console.log('zhixingfangfa')
        console.log(paramCst)
        targetFun.apply(this, paramCst);
        paramCst.children.forEach(item => {
            if (item.extendObject && item.extendObject.alt) {
                const child = item.extendObject.alt.call(this, item)
                cst.children.push(child)
            }
        })
        this.cstStack.pop();
        //重置状态
        if (rootFlag) {
            this.rootFlag = true
            return this.curCst
        } else {
            const parentCst = this.cstStack[this.cstStack.length - 1];
            parentCst.children.push(this.curCst);
            return this.curCst
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

        this.curCst.children.push(curCst);
        this.curCst.tokens.push(appendToken);
        return this.generateCst(curCst);
    }

    initializeParserState(ruleName: string, cst: AlienCst) {
        this.rootFlag = false
        this.tokens = [];
        this.rootCst = cst;
        this.cstStack = [];
    }


    //默认就是遍历生成
    generator(cst: AlienCst<T>, code = '') {
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
