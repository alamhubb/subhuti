import SubhutiLexer from "../subhuti/SubhutiLexer";
import HelloWorldGrammarParser, {hwCodeToken, hwPrint} from "./HelloWorldGrammarParser.js";
import path from 'path';
import fs from 'fs';
import SubhutiGenerator from "../subhuti/SubhutiGenerator";

const code = getCode('helloworld.hw')
const hwLexer = new SubhutiLexer([hwPrint, hwCodeToken])
const tokens = hwLexer.lexer(code)
const parser = new HelloWorldGrammarParser(tokens)
const cst = parser.program()
console.log(cst)
parser.exec()



// 获取当前目录下的 fasdf.txt 文件路径
function getCode(filename) {
    const filePath = path.join(__dirname, filename);
    try {
        // 同步读取文件内容
        const data = fs.readFileSync(filePath, 'utf8');
        return data;
    } catch (err) {
        console.error('读取文件出错:', err);
        return null; // 或者抛出错误
    }
}
