import AlienCst from "./AlienCst";
import AlienMatchToken from "./AlienMatchToken";
export function GeneratorRule(targetFun: any) {
    const ruleName = targetFun.name;
    return function (paramCst: AlienCst) {
        this.generatorCst(ruleName, paramCst, targetFun);
        return this.generateCst(this.curCst);
    };
}
export default class AlienGenerator<T = any> {
    tokens: AlienMatchToken[];
    curCst: AlienCst<T>;
    rootCst: AlienCst<T>;
    cstStack: AlienCst<T>[] = [];
    rootFlag = true;
    //paramCst = 旧版cst
    generatorCst(ruleName: string, paramCst: AlienCst<any>, targetFun: any) {
        const rootFlag = this.rootFlag;
        let cst = new AlienCst();
        cst.name = ruleName;
        cst.children = [];
        if (rootFlag) {
            //初始化
            this.initializeParserState(ruleName, cst);
            this.tokens = paramCst.tokens;
        }
        this.curCst = cst;
        this.cstStack.push(this.curCst);
        targetFun.apply(this, paramCst);
        paramCst.children.forEach(item => {
            if (item.extendObject && item.extendObject.alt) {
                const child = item.extendObject.alt.call(this, item);
                cst.children.push(child);
            }
        });
        this.cstStack.pop();
        //重置状态
        if (rootFlag) {
            this.rootFlag = true;
            return this.curCst;
        }
        else {
            const parentCst = this.cstStack[this.cstStack.length - 1];
            parentCst.children.push(this.curCst);
            return this.curCst;
        }
    }
    initializeParserState(ruleName: string, cst: AlienCst) {
        this.rootFlag = false;
        this.tokens = [];
        this.rootCst = cst;
        this.cstStack = [];
    }
    //默认就是遍历生成
    generator(cst: AlienCst<T>, code = '') {
        cst.children.forEach(item => {
            if (item.value) {
                code += ' ' + item.value;
            }
            else {
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
