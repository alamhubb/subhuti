import AlienMatchToken from "./AlienMatchToken";
import {Es6TokenName} from "../es6/Es6Tokens";


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

    constructor(tokens: AlienMatchToken[]) {
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
    }

    @alienParser
    program(arg) {
        console.log(this)
        console.log(arg)
        // this.syntaxStack.push()
        console.log('zhixingle programs')
        this.consume(Es6TokenName.let)
    }
}
