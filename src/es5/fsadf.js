/**
 * 加法表达式的解析器
 *
 * 该解析器根据以下 EBNF 定义，用于解析简单的加法表达式：
 *
 * <Expression> ::= <Expression> "+" <Term>
 *               |  <Term>
 *
 * <Term>       ::= <Number>
 *
 * <Number>     ::= <Digit> { <Digit> }
 *
 * <Digit>      ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
 */
class Lexer {
    constructor(input) {
        this.input = input;
        this.position = 0;
        this.tokens = [];
        this.tokenize();
    }
    // 定义正则表达式模式
    static TOKEN_REGEX = [
        { type: 'NUMBER', regex: /^\d+/ },
        { type: 'PLUS', regex: /^\+/ },
        { type: 'WHITESPACE', regex: /^\s+/ }
    ];
    tokenize() {
        let input = this.input;
        while (this.position < input.length) {
            let substring = input.slice(this.position);
            let matched = false;
            for (let tokenDef of Lexer.TOKEN_REGEX) {
                const match = substring.match(tokenDef.regex);
                if (match) {
                    matched = true;
                    const value = match[0];
                    if (tokenDef.type !== 'WHITESPACE') { // 跳过空白字符
                        this.tokens.push({ type: tokenDef.type, value });
                    }
                    this.position += value.length;
                    break;
                }
            }
            if (!matched) {
                throw new SyntaxError(`Unexpected token at position ${this.position}: '${substring[0]}'`);
            }
        }
        // 添加一个结束符号
        this.tokens.push({ type: 'EOF', value: null });
    }
    peek() {
        return this.tokens[0];
    }
    next() {
        return this.tokens.shift();
    }
}
class Parser {
    constructor(lexer) {
        this.lexer = lexer;
        this.currentToken = this.lexer.next();
    }
    // 解析整个表达式
    parseExpression() {
        let node = this.parseTerm();
        while (this.currentToken.type === 'PLUS') {
            let token = this.currentToken;
            this.eat('PLUS');
            let right = this.parseTerm();
            node = {
                type: 'BinaryExpression',
                operator: token.value,
                left: node,
                right: right
            };
        }
        return node;
    }
    // 解析术语（在此例中，术语仅为数字）
    parseTerm() {
        return this.parseNumber();
    }
    // 解析数字
    parseNumber() {
        let token = this.currentToken;
        if (token.type === 'NUMBER') {
            this.eat('NUMBER');
            return {
                type: 'Literal',
                value: Number(token.value)
            };
        }
        else {
            throw new SyntaxError(`Expected number, but found '${token.type}'`);
        }
    }
    // 消费当前令牌并移动到下一个
    eat(tokenType) {
        if (this.currentToken.type === tokenType) {
            this.currentToken = this.lexer.next();
        }
        else {
            throw new SyntaxError(`Expected token type '${tokenType}', but found '${this.currentToken.type}'`);
        }
    }
}
// 一个简单的解释器，用于评估 AST
class Interpreter {
    constructor(ast) {
        this.ast = ast;
    }
    interpret() {
        return this.visit(this.ast);
    }
    visit(node) {
        switch (node.type) {
            case 'BinaryExpression':
                return this.visitBinaryExpression(node);
            case 'Literal':
                return node.value;
            default:
                throw new TypeError(`Unknown node type: ${node.type}`);
        }
    }
    visitBinaryExpression(node) {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
        switch (node.operator) {
            case '+':
                return left + right;
            default:
                throw new TypeError(`Unknown operator: ${node.operator}`);
        }
    }
}
// 示例用法
function parseAndEvaluate(input) {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const ast = parser.parseExpression();
    // const interpreter = new Interpreter(ast);
    // return interpreter.interpret();
}
// 测试案例
const testExpressions = [
    // "5 + 3",
    // "10 + 20 + 30",
    // "7 + 8 + 9 + 10",
    // "  15 + 25 + 35 ",
    // "100 +200+300",
    "1 + 2 + 3"
];
for (let expr of testExpressions) {
    try {
        const result = parseAndEvaluate(expr);
    }
    catch (error) {
        console.error(`Error parsing '${expr}': ${error.message}`);
    }
}
