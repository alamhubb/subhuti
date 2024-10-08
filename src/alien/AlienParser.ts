import AlienMatchToken from "./AlienMatchToken";
import {Es6TokenName} from "../es6/Es6Tokens";
import AlienCst from "./AlienCst";


function alienParser(targetFun: any, context) {
    return function (...args) {
        const classThis: AlienParser = this
        classThis.syntaxStack.push(targetFun.name)
        return targetFun.apply(classThis, args)
    }
}


export default class AlienParser {

    tokens: AlienMatchToken[]

    syntaxStack = []

    cst: AlienCst
    cstState: AlienCst
    parentCstState: AlienCst

    constructor(tokens?: AlienMatchToken[]) {
        this.tokens = tokens;
    }

    //你要做的是在处理过程中，可以生成多个tree
    //一般一个方法只有一个返回
    consume(tokenName: string) {
        const newTokens = [...this.tokens]
        const firstToken = newTokens.shift()
        if (firstToken.tokenName !== tokenName) {
            throw new Error('语法错误')
        }
        const cstState = {
            name: tokenName
        }
        return cstState
    }

    @alienParser
    program(): AlienCst {
        // this.syntaxStack.push()
        if (!this.cst) {
            this.cst = new AlienCst()
        }
        this.parentCstState = this.cst
        this.consume(Es6TokenName.let)
        this.parentCstState.children.push(this.cstState)

        //如何生成mappingCst，肯定不是消耗一个 生成一个。
        //问题是两个语法不一致，导致token顺序不一致
        //你要做的是调整token顺序，调整成符合mapping的顺序
        //应该是从子往父级

        //parser是从上到下的
        //是可以做到最底层的映射的，因为program执行顺序，问题是执行完子级和父级如何组合的问题
        //执行完了，发现他存在 ，mapping，则执行mapping，

        return this.cst
    }
}
