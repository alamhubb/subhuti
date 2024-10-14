import SubhutiParser, {SubhutiRule} from "../subhuti/SubhutiParser";
import {es5TokenConsumer} from "./Es5TokenConsume";
import SubhutiMatchToken from "../subhuti/struct/SubhutiMatchToken";

export class Es5Parser extends SubhutiParser {

    constructor(tokens?: SubhutiMatchToken[]) {
        super(tokens)
        es5TokenConsumer.init(this)
        this.thisClassName = this.constructor.name;
    }

    // 11.1 主表达式
    @SubhutiRule
    primaryExpression() {
        this.or([
            {alt: () => es5TokenConsumer.ThisTok()},
            {alt: () => es5TokenConsumer.IdentifierName()},
            {alt: () => this.AbsLiteral()},
            {alt: () => this.array()},
            {alt: () => this.object()},
            {alt: () => this.parenthesisExpression()},
        ]);
    }

    // 7.8 字面量
    @SubhutiRule
    AbsLiteral() {
        this.or([
            {alt: () => es5TokenConsumer.NullTok()},
            {alt: () => es5TokenConsumer.TrueTok()},
            {alt: () => es5TokenConsumer.FalseTok()},
            {alt: () => es5TokenConsumer.NumericLiteral()},
            {alt: () => es5TokenConsumer.StringLiteral()},
            {alt: () => es5TokenConsumer.RegularExpressionLiteral()},
        ]);
    }

    // 11.1.6 括号表达式
    @SubhutiRule
    parenthesisExpression() {
        es5TokenConsumer.LParen();
        this.expression();
        es5TokenConsumer.RParen();
    }

    // 11.1.4 数组初始化器
    @SubhutiRule
    array() {
        es5TokenConsumer.LBracket();
        this.MANY(() => {
            this.or([
                {alt: () => this.elementList()},
                {alt: () => this.elision()},
            ]);
        });
        es5TokenConsumer.RBracket();
    }

    // 11.1.4 数组初始化器 - 元素列表
    @SubhutiRule
    elementList() {
        this.assignmentExpression();
        this.MANY(() => {
            this.elision();
            this.assignmentExpression();
        });
    }

    // 11.1.4 数组初始化器 - 省略元素
    @SubhutiRule
    elision() {
        this.AT_LEAST_ONE(() => {
            es5TokenConsumer.Comma();
        });
    }

    // 11.1.5 对象初始化器
    @SubhutiRule
    object() {
        es5TokenConsumer.LBrace();
        this.option(() => {
            this.propertyAssignment();
            this.MANY(() => {
                es5TokenConsumer.Comma();
                this.propertyAssignment();
            });
            this.option(() => {
                es5TokenConsumer.Comma();
            });
        });
        es5TokenConsumer.RBrace();
    }

    // 11.1.5 属性赋值
    @SubhutiRule
    propertyAssignment() {
        this.or([
            {alt: () => this.regularPropertyAssignment()},
            {alt: () => this.getPropertyAssignment()},
            {alt: () => this.setPropertyAssignment()},
        ]);
    }

    // 11.1.5 常规属性赋值
    @SubhutiRule
    regularPropertyAssignment() {
        this.propertyName();
        es5TokenConsumer.Colon();
        this.assignmentExpression();
    }

    // 11.1.5 getter 属性赋值
    @SubhutiRule
    getPropertyAssignment() {
        es5TokenConsumer.GetTok();
        this.propertyName();
        es5TokenConsumer.LParen();
        es5TokenConsumer.RParen();
        es5TokenConsumer.LBrace();
        this.sourceElements();
        es5TokenConsumer.RBrace();
    }

    // 11.1.5 setter 属性赋值
    @SubhutiRule
    setPropertyAssignment() {
        es5TokenConsumer.SetTok();
        this.propertyName();
        es5TokenConsumer.LParen();
        es5TokenConsumer.IdentifierName();
        es5TokenConsumer.RParen();
        es5TokenConsumer.LBrace();
        this.sourceElements();
        es5TokenConsumer.RBrace();
    }

    // 11.1.5 属性名称
    @SubhutiRule
    propertyName() {
        this.or([
            {alt: () => es5TokenConsumer.IdentifierName()},
            {alt: () => es5TokenConsumer.IdentifierName()},
            {alt: () => es5TokenConsumer.StringLiteral()},
            {alt: () => es5TokenConsumer.NumericLiteral()},
        ]);
    }

    // 11.2 左值表达式
    @SubhutiRule
    memberCallNewExpression() {
        this.MANY(() => {
            es5TokenConsumer.NewTok();
        });
        this.or([
            {alt: () => this.primaryExpression()},
            {alt: () => this.functionExpression()},
        ]);
        this.MANY(() => {
            this.or([
                {alt: () => this.boxMemberExpression()},
                {alt: () => this.dotMemberExpression()},
                {alt: () => this.arguments()},
            ]);
        });
    }

    // 11.2.1 属性访问表达式
    @SubhutiRule
    boxMemberExpression() {
        es5TokenConsumer.LBracket();
        this.expression();
        es5TokenConsumer.RBracket();
    }

    // 11.2.1 属性访问表达式
    @SubhutiRule
    dotMemberExpression() {
        es5TokenConsumer.Dot();
        es5TokenConsumer.IdentifierName();
    }

    // 11.2.3 函数调用
    @SubhutiRule
    arguments() {
        es5TokenConsumer.LParen();
        this.option(() => {
            this.assignmentExpression();
            this.MANY(() => {
                es5TokenConsumer.Comma();
                this.assignmentExpression();
            });
        });
        es5TokenConsumer.RParen();
    }

    // 11.3 后缀表达式
    @SubhutiRule
    postfixExpression() {
        this.memberCallNewExpression();
        this.option(() => {
            this.or([
                {alt: () => es5TokenConsumer.PlusPlus()},
                {alt: () => es5TokenConsumer.MinusMinus()},
            ]);
        });
    }

    // 11.4 一元运算符
    @SubhutiRule
    unaryExpression() {
        this.or([
            {alt: () => this.postfixExpression()},
            {
                alt: () => {
                    this.or([
                        {alt: () => es5TokenConsumer.DeleteTok()},
                        {alt: () => es5TokenConsumer.VoidTok()},
                        {alt: () => es5TokenConsumer.TypeOfTok()},
                        {alt: () => es5TokenConsumer.PlusPlus()},
                        {alt: () => es5TokenConsumer.MinusMinus()},
                        {alt: () => es5TokenConsumer.Plus()},
                        {alt: () => es5TokenConsumer.Minus()},
                        {alt: () => es5TokenConsumer.Tilde()},
                        {alt: () => es5TokenConsumer.Exclamation()},
                    ]);
                    this.unaryExpression();
                },
            },
        ]);
    }

    // 11.5 乘法运算符, 11.6 加法运算符, 11.7 位移运算符, 11.8 关系运算符, 11.9 相等运算符, 11.10 二进制位运算符, 11.11 二进制逻辑运算符
    @SubhutiRule
    binaryExpression() {
        this.unaryExpression();
        this.MANY(() => {
            this.or([
                {alt: () => this.AbsAssignmentOperator()},
                {alt: () => es5TokenConsumer.VerticalBarVerticalBar()},
                {alt: () => es5TokenConsumer.AmpersandAmpersand()},
                {alt: () => es5TokenConsumer.VerticalBar()},
                {alt: () => es5TokenConsumer.Circumflex()},
                {alt: () => es5TokenConsumer.Ampersand()},
                {alt: () => this.AbsEqualityOperator()},
                {alt: () => this.AbsRelationalOperator()},
                {alt: () => es5TokenConsumer.InstanceOfTok()},
                {alt: () => es5TokenConsumer.InTok()},
                {alt: () => this.AbsShiftOperator()},
                {alt: () => this.AbsMultiplicativeOperator()},
                {alt: () => this.AbsAdditiveOperator()},
            ]);
            this.unaryExpression();
        });
    }

    // 11.13 赋值运算符
    @SubhutiRule
    AbsAssignmentOperator() {
        this.or([
            {alt: () => es5TokenConsumer.Eq()},
            {alt: () => es5TokenConsumer.PlusEq()},
            {alt: () => es5TokenConsumer.AmpersandAmpersand()},
            {alt: () => es5TokenConsumer.VerticalBar()},
            {alt: () => es5TokenConsumer.Circumflex()},
            {alt: () => es5TokenConsumer.Ampersand()},
            {alt: () => this.AbsEqualityOperator()},
            {alt: () => this.AbsRelationalOperator()},
            {alt: () => es5TokenConsumer.InstanceOfTok()},
            {alt: () => es5TokenConsumer.InTok()},
            {alt: () => this.AbsShiftOperator()},
            {alt: () => this.AbsMultiplicativeOperator()},
            {alt: () => this.AbsAdditiveOperator()},
        ]);
    }

    // 11.9 相等运算符
    @SubhutiRule
    AbsEqualityOperator() {
        this.or([
            {alt: () => es5TokenConsumer.EqEq()},
            {alt: () => es5TokenConsumer.NotEq()},
            {alt: () => es5TokenConsumer.EqEq()},
            {alt: () => es5TokenConsumer.NotEqEq()},
        ]);
    }

    // 11.8 关系运算符
    @SubhutiRule
    AbsRelationalOperator() {
        this.or([
            {alt: () => es5TokenConsumer.Less()},
            {alt: () => es5TokenConsumer.Greater()},
            {alt: () => es5TokenConsumer.LessEq()},
            {alt: () => es5TokenConsumer.GreaterEq()},
        ]);
    }

    // 11.7 位移运算符
    @SubhutiRule
    AbsShiftOperator() {
        this.or([
            {alt: () => es5TokenConsumer.LessLess()},
            {alt: () => es5TokenConsumer.MoreMore()},
            {alt: () => es5TokenConsumer.MoreMoreMore()},
        ]);
    }

    // 11.5 乘法运算符
    @SubhutiRule
    AbsMultiplicativeOperator() {
        this.or([
            {alt: () => es5TokenConsumer.Asterisk()},
            {alt: () => es5TokenConsumer.Slash()},
            {alt: () => es5TokenConsumer.Percent()},
        ]);
    }

    // 11.6 加法运算符
    @SubhutiRule
    AbsAdditiveOperator() {
        this.or([
            {alt: () => es5TokenConsumer.Plus()},
            {alt: () => es5TokenConsumer.Minus()},
        ]);
    }

    @SubhutiRule
    binaryExpressionNoIn() {
        this.unaryExpression();
        this.MANY(() => {
            this.or([
                {alt: () => this.AbsAssignmentOperator()},
                {alt: () => es5TokenConsumer.VerticalBarVerticalBar()},
                {alt: () => es5TokenConsumer.AmpersandAmpersand()},
                {alt: () => es5TokenConsumer.VerticalBar()},
                {alt: () => es5TokenConsumer.Circumflex()},
                {alt: () => es5TokenConsumer.Ampersand()},
                {alt: () => this.AbsEqualityOperator()},
                {alt: () => this.AbsRelationalOperator()},
                {alt: () => es5TokenConsumer.InstanceOfTok()},
                {alt: () => this.AbsShiftOperator()},
                {alt: () => this.AbsMultiplicativeOperator()},
                {alt: () => this.AbsAdditiveOperator()},
            ]);
            this.unaryExpression();
        });
    }

    // 11.12 条件运算符
    @SubhutiRule
    assignmentExpression() {
        this.binaryExpression();
        this.option(() => {
            es5TokenConsumer.Question();
            this.assignmentExpression();
            es5TokenConsumer.Colon();
            this.assignmentExpression();
        });
    }

    @SubhutiRule
    assignmentExpressionNoIn() {
        this.binaryExpressionNoIn();
        this.option(() => {
            es5TokenConsumer.Question();
            this.assignmentExpression();
            es5TokenConsumer.Colon();
            this.assignmentExpressionNoIn();
        });
    }

    // 11.14 逗号运算符
    @SubhutiRule
    expression() {
        this.assignmentExpression();
        this.MANY(() => {
            es5TokenConsumer.Comma();
            this.assignmentExpression();
        });
    }

    @SubhutiRule
    expressionNoIn() {
        this.assignmentExpressionNoIn();
        this.MANY(() => {
            es5TokenConsumer.Comma();
            this.assignmentExpressionNoIn();
        });
    }

    // 12 语句
    @SubhutiRule
    statement() {
        this.or([
            {alt: () => this.block()},
            {alt: () => this.variableStatement()},
            {alt: () => this.emptyStatement()},
            {alt: () => this.labelledStatement()},
            {alt: () => this.expressionStatement()},
            {alt: () => this.ifStatement()},
            {alt: () => this.iterationStatement()},
            {alt: () => this.continueStatement()},
            {alt: () => this.breakStatement()},
            {alt: () => this.returnStatement()},
            {alt: () => this.withStatement()},
            {alt: () => this.switchStatement()},
            {alt: () => this.throwStatement()},
            {alt: () => this.tryStatement()},
            {alt: () => this.debuggerStatement()},
        ]);
    }

    // 12.1 语句块
    @SubhutiRule
    block() {
        es5TokenConsumer.LBrace();
        this.option(() => {
            this.StatementList();
        });
        es5TokenConsumer.RBrace();
    }

    // 12.1 语句列表
    @SubhutiRule
    StatementList() {
        this.AT_LEAST_ONE(() => {
            this.statement();
        });
    }

    // 12.2 变量语句
    @SubhutiRule
    variableStatement() {
        es5TokenConsumer.VarTok();
        this.variableDeclarationList();
        es5TokenConsumer.Semicolon();
    }

    // 12.2 变量声明列表
    @SubhutiRule
    variableDeclarationList() {
        this.variableDeclaration();
        this.MANY(() => {
            es5TokenConsumer.Comma();
            this.variableDeclaration();
        });
    }

    @SubhutiRule
    variableDeclarationListNoIn() {
        let numOfVars = 1;
        this.variableDeclarationNoIn();
        this.MANY(() => {
            es5TokenConsumer.Comma();
            this.variableDeclarationNoIn();
            numOfVars++;
        });
        return numOfVars;
    }

    // 12.2 变量声明
    @SubhutiRule
    variableDeclaration() {
        es5TokenConsumer.IdentifierName();
        this.option(() => {
            this.initialiser();
        });
    }

    @SubhutiRule
    variableDeclarationNoIn() {
        es5TokenConsumer.IdentifierName();
        this.option(() => {
            this.initialiserNoIn();
        });
    }

    // 12.2 初始化器
    @SubhutiRule
    initialiser() {
        es5TokenConsumer.Eq();
        this.assignmentExpression();
    }

    @SubhutiRule
    initialiserNoIn() {
        es5TokenConsumer.Eq();
        this.assignmentExpressionNoIn();
    }

    // 12.3 空语句
    @SubhutiRule
    emptyStatement() {
        es5TokenConsumer.Semicolon();
    }

    // 12.4 表达式语句
    @SubhutiRule
    expressionStatement() {
        this.expression();
        es5TokenConsumer.Semicolon();
    }

    // 12.5 if 语句
    @SubhutiRule
    ifStatement() {
        es5TokenConsumer.IfTok();
        es5TokenConsumer.LParen();
        this.expression();
        es5TokenConsumer.RParen();
        this.statement();
        this.option(() => {
            es5TokenConsumer.ElseTok();
            this.statement();
        });
    }

    // 12.6 迭代语句
    @SubhutiRule
    iterationStatement() {
        this.or([
            {alt: () => this.doIteration()},
            {alt: () => this.whileIteration()},
            {alt: () => this.forIteration()},
        ]);
    }

    // 12.6.1 do-while 语句
    @SubhutiRule
    doIteration() {
        es5TokenConsumer.DoTok();
        this.statement();
        es5TokenConsumer.WhileTok();
        es5TokenConsumer.LParen();
        this.expression();
        es5TokenConsumer.RParen();
        es5TokenConsumer.Semicolon();
    }

    // 12.6.2 while 语句
    @SubhutiRule
    whileIteration() {
        es5TokenConsumer.WhileTok();
        es5TokenConsumer.LParen();
        this.expression();
        es5TokenConsumer.RParen();
        this.statement();
    }

    // 12.6.3 for 语句
    @SubhutiRule
    forIteration() {
        let inPossible = false;
        es5TokenConsumer.ForTok();
        es5TokenConsumer.LParen();
        this.or([
            {
                alt: () => {
                    es5TokenConsumer.VarTok();
                    const numOfVars = this.variableDeclarationListNoIn();
                    inPossible = numOfVars === 1;
                    this.forHeaderParts(inPossible);
                },
            },
            {
                alt: () => {
                    this.forHeaderParts(inPossible);
                },
            },
        ]);
        es5TokenConsumer.RParen();
        this.statement();
    }

    // 12.6.3 for 语句头部
    @SubhutiRule
    forHeaderParts(inPossible) {
        this.or([
            {
                alt: () => {
                    es5TokenConsumer.Semicolon();
                    this.option(() => {
                        this.expression();
                    });
                    es5TokenConsumer.Semicolon();
                    this.option(() => {
                        this.expression();
                    });
                },
            },
            {
                alt: () => {
                    es5TokenConsumer.InTok();
                    this.expression();
                },
            },
        ]);
    }

    // 12.7 continue 语句
    @SubhutiRule
    continueStatement() {
        es5TokenConsumer.ContinueTok();
        this.option(() => {
            es5TokenConsumer.IdentifierName();
        });
        es5TokenConsumer.Semicolon();
    }

    // 12.8 break 语句
    @SubhutiRule
    breakStatement() {
        es5TokenConsumer.BreakTok();
        this.option(() => {
            es5TokenConsumer.IdentifierName();
        });
        es5TokenConsumer.Semicolon();
    }

    // 12.9 return 语句
    @SubhutiRule
    returnStatement() {
        es5TokenConsumer.ReturnTok();
        this.option(() => {
            this.expression();
        });
        es5TokenConsumer.Semicolon();
    }

    // 12.10 with 语句
    @SubhutiRule
    withStatement() {
        es5TokenConsumer.WithTok();
        es5TokenConsumer.LParen();
        this.expression();
        es5TokenConsumer.RParen();
        this.statement();
    }

    // 12.11 switch 语句
    @SubhutiRule
    switchStatement() {
        es5TokenConsumer.SwitchTok();
        es5TokenConsumer.LParen();
        this.expression();
        es5TokenConsumer.RParen();
        this.caseBlock();
    }

    // 12.11 case 块
    @SubhutiRule
    caseBlock() {
        es5TokenConsumer.LBrace();
        this.option(() => {
            this.caseClauses();
        });
        this.option(() => {
            this.defaultClause();
        });
        this.option(() => {
            this.caseClauses();
        });
        es5TokenConsumer.RBrace();
    }

    // 12.11 case 子句列表
    @SubhutiRule
    caseClauses() {
        this.AT_LEAST_ONE(() => {
            this.caseClause();
        });
    }

    // 12.11 case 子句
    @SubhutiRule
    caseClause() {
        es5TokenConsumer.CaseTok();
        this.expression();
        es5TokenConsumer.Colon();
        this.option(() => {
            this.StatementList();
        });
    }

    // 12.11 default 子句
    @SubhutiRule
    defaultClause() {
        es5TokenConsumer.DefaultTok();
        es5TokenConsumer.Colon();
        this.option(() => {
            this.StatementList();
        });
    }

    // 12.12 标记语句
    @SubhutiRule
    labelledStatement() {
        es5TokenConsumer.IdentifierName();
        es5TokenConsumer.Colon();
        this.option(() => {
            this.statement();
        });
    }

    // 12.13 throw 语句
    @SubhutiRule
    throwStatement() {
        es5TokenConsumer.ThrowTok();
        this.expression();
        es5TokenConsumer.Semicolon();
    }

    // 12.14 try 语句
    @SubhutiRule
    tryStatement() {
        es5TokenConsumer.TryTok();
        this.block();
        this.or([
            {
                alt: () => {
                    this.catch();
                    this.option(() => {
                        this.finally();
                    });
                },
            },
            {alt: () => this.finally()},
        ]);
    }

    // 12.14 catch 子句
    @SubhutiRule
    catch() {
        es5TokenConsumer.CatchTok();
        es5TokenConsumer.LParen();
        es5TokenConsumer.IdentifierName();
        es5TokenConsumer.RParen();
        this.block();
    }

    // 12.14 finally 子句
    @SubhutiRule
    finally() {
        es5TokenConsumer.FinallyTok();
        this.block();
    }

    // 12.15 debugger 语句
    @SubhutiRule
    debuggerStatement() {
        es5TokenConsumer.DebuggerTok();
        es5TokenConsumer.Semicolon();
    }

    // 13 函数定义
    @SubhutiRule
    functionDeclaration() {
        es5TokenConsumer.FunctionTok();
        es5TokenConsumer.IdentifierName();
        es5TokenConsumer.LParen();
        this.option(() => {
            this.formalParameterList();
        });
        es5TokenConsumer.RParen();
        es5TokenConsumer.LBrace();
        this.sourceElements();
        es5TokenConsumer.RBrace();
    }

    // 13 函数表达式
    @SubhutiRule
    functionExpression() {
        es5TokenConsumer.FunctionTok();
        this.option(() => {
            es5TokenConsumer.IdentifierName();
        });
        es5TokenConsumer.LParen();
        this.option(() => {
            this.formalParameterList();
        });
        es5TokenConsumer.RParen();
        es5TokenConsumer.LBrace();
        this.sourceElements();
        es5TokenConsumer.RBrace();
    }

    // 13 形式参数列表
    @SubhutiRule
    formalParameterList() {
        es5TokenConsumer.IdentifierName();
        this.MANY(() => {
            es5TokenConsumer.Comma();
            es5TokenConsumer.IdentifierName();
        });
    }

    // 14 程序
    @SubhutiRule
    program() {
        this.AT_LEAST_ONE(() => {
            this.sourceElements();
        });
        return this.getCurCst();
    }

    // 14 源元素
    @SubhutiRule
    sourceElements() {
        this.SourceElement()
        return this.getCurCst();
    }

    @SubhutiRule
    SourceElement() {
        this.or([
            {
                alt: () => this.functionDeclaration(),
            },
            {alt: () => this.statement()},
        ]);
    }

    @SubhutiRule
    stringLiteral() {
        es5TokenConsumer.StringLiteral()
    }
}
