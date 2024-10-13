import {createToken} from "../subhuti/struct/SubhutiCreateToken";
import SubhutiParser, {SubhutiRule} from "../subhuti/SubhutiParser";

//第一行代码，定义token
export const hwPrint = createToken({name: 'print', pattern: /print/, isKeyword: true})
export const hwCodeToken = createToken({name: 'code', pattern: /[\s\S]*/})

//定义一个编程语法，名为helloWorld语法
export default class HelloWorldGrammarParser extends SubhutiParser {
    @SubhutiRule
    program() {
        this.consume(hwPrint)
        this.hwCodeStatement()
        return this.getCurCst()
    }

    @SubhutiRule
    hwCodeStatement() {
        this.consume(hwCodeToken)
        return this.getCurCst()
    }


    //默认就是遍历生成
    exec(cst = this.getCurCst(), code = '') {
        if (cst.name === this.program.name) {
            code = super.exec(cst, code)
            code = code.split('').reverse().join('')
            console.log(code)
            return code
        } else if (cst.name === hwPrint.name) {
            //什么也不做
        } else {
            code = super.exec(cst, code)
        }
        return code.trim();
    }
}
