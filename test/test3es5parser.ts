import SubhutiLexer from "@/subhuti/SubhutiLexer.ts";
import {es6Tokens} from "@/subhuti/syntax/es6/Es6Tokens.ts";
import {es5Tokens, es5TokensObj} from "@/subhuti/syntax/es5/Es5Tokens.ts";
import {Es5Parser} from "@/subhuti/syntax/es5/Es5Parser.ts";
import JsonUtil from "@/utils/JsonUtil.ts";
import SubhutiGenerator from "@/subhuti/SubhutiGenerator.ts";

// let input = 'var a = '
// let input = 'var a = 1'
let input = `function GetQueryString(name)
{
　　var reg = 123;
　　var r = window.location.search.substr(1).match(reg);
   return null;}`
//
// const newPattern = new RegExp('^(' + es5TokensObj.NumericLiteral.pattern.source + ')');
// const res = newPattern.test(input)
//
// console.log(res)
const lexer = new SubhutiLexer(es5Tokens);
const tokens = lexer.lexer(input);
// console.log(tokens)
const parser = new Es5Parser(tokens);
try {
    let res = parser.Program();
    const gen = new SubhutiGenerator()
    const resc = gen.generator(res)
    console.log(resc)
} catch (err) {
    console.log(err)
// 过滤只显示某个特定文件的错误信息
    const filteredStack = filterStack(err.stack, "Es5Parser");
}

function filterStack(stack, fileName) {
    console.log(1111)            // 重新组合为字符串
    let str = stack
    const array = str.split('\n').filter((item, index) => (item.includes('Es5Parser.ts') || index < 5))
    // const array = str.split('\n')
    console.log(array.join('\n'))
    // console.log(str.split("at _"))            // 重新组合为字符串
    console.log(2222)            // 重新组合为字符串
}


