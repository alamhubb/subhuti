import SubhutiParser, {SubhutiRule} from "../subhuti/SubhutiParser";
import SubhutiMatchToken from "../subhuti/struct/SubhutiMatchToken";
import {Es6TokenName, es6TokensObj} from "./Es6Tokens";

export default class Es6Parser extends SubhutiParser { // 定义一个ES6解析器类，继承自SubhutiParser
    constructor(tokens?: SubhutiMatchToken[]) { // 构造函数，接收可选的token数组
        super(tokens); // 调用父类构造函数
    }

    @SubhutiRule // 定义一个解析规则
    program() { // 定义program规则
        this.or([ // 定义一个选择规则
            {
                alt: () => { // 选择分支1
                    this.letKeywords(); // 引用letKeywords规则
                }
            },
            {
                alt: () => { // 选择分支2
                    this.constKeywords(); // 引用constKeywords规则
                }
            }
        ]);
        this.identifierEqual(); // 引用identifierEqual规则
        this.assignmentExpression(); // 引用assignmentExpression规则
        return this.getCurCst(); // 返回当前CST（语法树）
    }

    @SubhutiRule // 定义一个解析规则
    letKeywords() { // 定义letKeywords规则
        this.consume(es6TokensObj.let); // 消耗let关键字token
        return this.getCurCst(); // 返回当前CST
    }

    @SubhutiRule // 定义一个解析规则
    constKeywords() { // 定义constKeywords规则
        this.consume(es6TokensObj.const); // 消耗const关键字token
        return this.getCurCst(); // 返回当前CST
    }

    @SubhutiRule // 定义一个解析规则
    assignmentExpression() { // 定义assignmentExpression规则
        this.or([ // 定义一个选择规则
            {
                alt: () => { // 选择分支1
                    this.consume(es6TokensObj.integer); // 消耗整数token
                }
            },
            {
                alt: () => { // 选择分支2
                    this.consume(es6TokensObj.string); // 消耗字符串token
                }
            }
        ]);
        return this.getCurCst(); // 返回当前CST
    }

    @SubhutiRule // 定义一个解析规则
    identifierEqual() { // 定义identifierEqual规则
        this.consume(es6TokensObj.identifier); // 消耗标识符token
        this.consume(es6TokensObj.equal); // 消耗等号token
        return this.getCurCst(); // 返回当前CST
    }
}
