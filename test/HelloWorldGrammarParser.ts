import {createToken} from "../src/subhuti/struct/SubhutiCreateToken";
import SubhutiParser, {SubhutiRule} from "../src/subhuti/SubhutiParser";
import SubhutiLexer from "../src/subhuti/SubhutiLexer";
import JsonUtil from "../src/utils/JsonUtil";

//第一行代码，1.定义token，print函数token，匹配print字符串
export const hwPrint = createToken({name: 'print', pattern: /print/, isKeyword: true})
//2，定义code，读取任何内容
export const hwCodeToken = createToken({name: 'code', pattern: /[\s\S]*/})

//3.定义一个编程语法，名为helloWorld语法
class HelloWorldGrammarParser extends SubhutiParser {
    //4.定义根语法，消耗一个print token，
    @SubhutiRule
    program() {
        //5.消耗一个print token
        this.consume(hwPrint)
        //6.调用另一个规则hwCodeStatement
        this.hwCodeStatement()
        //7.返回当前语法树
        return this.getCurCst()
    }

    //8.定义一个hwCode规则
    @SubhutiRule
    hwCodeStatement() {
        //9.消耗一个hwCodeToken
        this.consume(hwCodeToken)
        return this.getCurCst()
    }

    //10.执行语法
    exec(cst = this.getCurCst(), code = '') {
        //11.如果为根语法
        if (cst.name === this.program.name) {
            //12.如果包含 print token，这部分逻辑没用，lexer中已经校验过了必须包含 print token，仅为了再次说明一下
            const print = cst.children.find(item => item.name === hwPrint.name)
            if (!print) {
                throw new Error('error')
            }
            //13.获取跟语法的结果code
            code = super.exec(cst, code)
            //14.翻转code
            code = code.split('').reverse().join('')
            //15.输出code
            console.log(code)
            return code
        } else if (cst.name === hwPrint.name) {
            //16.不打印 print，print作为语法规则，不属于hwCode
        } else {
            //17. 执行默认方法
            code = super.exec(cst, code)
        }
        return code.trim();
    }
}

//18. 获取hw语法代码
const code = 'print hello world'
//19. 创建lexer
const hwLexer = new SubhutiLexer([hwPrint, hwCodeToken])
//20. 解析代码，得到tokens
const tokens = hwLexer.lexer(code)
//21. 创建parser
const parser = new HelloWorldGrammarParser(tokens)
//解析语法树
const cst = parser.program()
JsonUtil.log(cst)
//执行程序
parser.exec()
