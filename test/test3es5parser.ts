import SubhutiLexer from "../src/subhuti/SubhutiLexer";
import {es6Tokens} from "../src/es6/Es6Tokens";
import subhutiMappingParser from "../src/mappingParser/SubhutiMappingParser";
import {es5Tokens, es5TokensObj} from "../src/es5/Es5Tokens";
import {Es5Parser} from "../src/es5/Es5Parser";
import JsonUtil from "../src/utils/JsonUtil";

let input = 'var a = 1+2'
//
// const newPattern = new RegExp('^(' + es5TokensObj.NumericLiteral.pattern.source + ')');
// const res = newPattern.test(input)
//
// console.log(res)
Error.stackTraceLimit = 70
const lexer = new SubhutiLexer(es5Tokens);
const tokens = lexer.lexer(input);
// console.log(tokens)
const parser = new Es5Parser(tokens);
try {
    let res = parser.program();
    console.log(parser.ruleExecErrorStack)
    console.log(JsonUtil.toJson(res))
} catch (err) {
// 过滤只显示某个特定文件的错误信息
    const filteredStack = filterStack(err.stack, "Es5Parser");
}

function filterStack(stack, fileName) {
    console.log(1111)            // 重新组合为字符串
    let str = stack
    const array = str.split('\n').filter((item, index) => item.includes('Es5Parser.ts') || index < 3)
    console.log(array.join('\n'))
    // console.log(str.split("at _"))            // 重新组合为字符串
    console.log(2222)            // 重新组合为字符串
}


