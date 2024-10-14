import SubhutiParser, {SubhutiRule} from "../subhuti/SubhutiParser";
import Es5TokenConsumer from "./Es5TokenConsume";
import SubhutiMatchToken from "../subhuti/struct/SubhutiMatchToken";

export class Es5Parser<T extends Es5TokenConsumer = Es5TokenConsumer> extends SubhutiParser<T> {
    constructor(tokens?: SubhutiMatchToken[]) {
        super(tokens);
        this.tokenConsumer = new Es5TokenConsumer(this) as T
        this.thisClassName = this.constructor.name;
    }

    // 11.1 主表达式
    @SubhutiRule
    primaryExpression() {
        this.Or([
            {alt: () => this.tokenConsumer.ThisTok()},
            {alt: () => this.tokenConsumer.IdentifierName()},
            {alt: () => this.AbsLiteral()},
            {alt: () => this.array()},
            {alt: () => this.object()},
            {alt: () => this.parenthesisExpression()},
        ]);
    }

    // 7.8 字面量
    @SubhutiRule
    AbsLiteral() {
        this.Or([
            {alt: () => this.tokenConsumer.NullTok()},
            {alt: () => this.tokenConsumer.TrueTok()},
            {alt: () => this.tokenConsumer.FalseTok()},
            {alt: () => this.tokenConsumer.NumericLiteral()},
            {alt: () => this.tokenConsumer.StringLiteral()},
            {alt: () => this.tokenConsumer.RegularExpressionLiteral()},
        ]);
    }

    // 11.1.6 括号表达式
    @SubhutiRule
    parenthesisExpression() {
        this.tokenConsumer.LParen();
        this.expression();
        this.tokenConsumer.RParen();
    }

    // 11.1.4 数组初始化器
    @SubhutiRule
    array() {
        this.tokenConsumer.LBracket();
        this.MANY(() => {
            this.Or([
                {alt: () => this.elementList()},
                {alt: () => this.elision()},
            ]);
        });
        this.tokenConsumer.RBracket();
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
            this.tokenConsumer.Comma();
        });
    }

    // 11.1.5 对象初始化器
    @SubhutiRule
    object() {
        this.tokenConsumer.LBrace();
        this.option(() => {
            this.propertyAssignment();
            this.MANY(() => {
                this.tokenConsumer.Comma();
                this.propertyAssignment();
            });
            this.option(() => {
                this.tokenConsumer.Comma();
            });
        });
        this.tokenConsumer.RBrace();
    }

    // 11.1.5 属性赋值
    @SubhutiRule
    propertyAssignment() {
        this.Or([
            {alt: () => this.regularPropertyAssignment()},
            {alt: () => this.getPropertyAssignment()},
            {alt: () => this.setPropertyAssignment()},
        ]);
    }

    // 11.1.5 常规属性赋值
    @SubhutiRule
    regularPropertyAssignment() {
        this.propertyName();
        this.tokenConsumer.Colon();
        this.assignmentExpression();
    }

    // 11.1.5 getter 属性赋值
    @SubhutiRule
    getPropertyAssignment() {
        this.tokenConsumer.GetTok();
        this.propertyName();
        this.tokenConsumer.LParen();
        this.tokenConsumer.RParen();
        this.tokenConsumer.LBrace();
        this.sourceElements();
        this.tokenConsumer.RBrace();
    }

    // 11.1.5 setter 属性赋值
    @SubhutiRule
    setPropertyAssignment() {
        this.tokenConsumer.SetTok();
        this.propertyName();
        this.tokenConsumer.LParen();
        this.tokenConsumer.IdentifierName();
        this.tokenConsumer.RParen();
        this.tokenConsumer.LBrace();
        this.sourceElements();
        this.tokenConsumer.RBrace();
    }

    // 11.1.5 属性名称
    @SubhutiRule
    propertyName() {
        this.Or([
            {alt: () => this.tokenConsumer.IdentifierName()},
            {alt: () => this.tokenConsumer.IdentifierName()},
            {alt: () => this.tokenConsumer.StringLiteral()},
            {alt: () => this.tokenConsumer.NumericLiteral()},
        ]);
    }

    // 11.2 左值表达式
    @SubhutiRule
    memberCallNewExpression() {
        this.MANY(() => {
            this.tokenConsumer.NewTok();
        });
        this.Or([
            {alt: () => this.primaryExpression()},
            {alt: () => this.functionExpression()},
        ]);
        this.MANY(() => {
            this.Or([
                {alt: () => this.boxMemberExpression()},
                {alt: () => this.dotMemberExpression()},
                {alt: () => this.arguments()},
            ]);
        });
    }

    // 11.2.1 属性访问表达式
    @SubhutiRule
    boxMemberExpression() {
        this.tokenConsumer.LBracket();
        this.expression();
        this.tokenConsumer.RBracket();
    }

    // 11.2.1 属性访问表达式
    @SubhutiRule
    dotMemberExpression() {
        this.tokenConsumer.Dot();
        this.tokenConsumer.IdentifierName();
    }

    // 11.2.3 函数调用
    @SubhutiRule
    arguments() {
        this.tokenConsumer.LParen();
        this.option(() => {
            this.assignmentExpression();
            this.MANY(() => {
                this.tokenConsumer.Comma();
                this.assignmentExpression();
            });
        });
        this.tokenConsumer.RParen();
    }

    // 11.3 后缀表达式
    @SubhutiRule
    postfixExpression() {
        this.memberCallNewExpression();
        this.option(() => {
            this.Or([
                {alt: () => this.tokenConsumer.PlusPlus()},
                {alt: () => this.tokenConsumer.MinusMinus()},
            ]);
        });
    }

    // 11.4 一元运算符
    @SubhutiRule
    unaryExpression() {
        this.Or([
            {alt: () => this.postfixExpression()},
            {
                alt: () => {
                    this.Or([
                        {alt: () => this.tokenConsumer.DeleteTok()},
                        {alt: () => this.tokenConsumer.VoidTok()},
                        {alt: () => this.tokenConsumer.TypeOfTok()},
                        {alt: () => this.tokenConsumer.PlusPlus()},
                        {alt: () => this.tokenConsumer.MinusMinus()},
                        {alt: () => this.tokenConsumer.Plus()},
                        {alt: () => this.tokenConsumer.Minus()},
                        {alt: () => this.tokenConsumer.Tilde()},
                        {alt: () => this.tokenConsumer.Exclamation()},
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
            this.Or([
                {alt: () => this.AbsAssignmentOperator()},
                {alt: () => this.tokenConsumer.VerticalBarVerticalBar()},
                {alt: () => this.tokenConsumer.AmpersandAmpersand()},
                {alt: () => this.tokenConsumer.VerticalBar()},
                {alt: () => this.tokenConsumer.Circumflex()},
                {alt: () => this.tokenConsumer.Ampersand()},
                {alt: () => this.AbsEqualityOperator()},
                {alt: () => this.AbsRelationalOperator()},
                {alt: () => this.tokenConsumer.InstanceOfTok()},
                {alt: () => this.tokenConsumer.InTok()},
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
        this.Or([
            {alt: () => this.tokenConsumer.Eq()},
            {alt: () => this.tokenConsumer.PlusEq()},
            {alt: () => this.tokenConsumer.AmpersandAmpersand()},
            {alt: () => this.tokenConsumer.VerticalBar()},
            {alt: () => this.tokenConsumer.Circumflex()},
            {alt: () => this.tokenConsumer.Ampersand()},
            {alt: () => this.AbsEqualityOperator()},
            {alt: () => this.AbsRelationalOperator()},
            {alt: () => this.tokenConsumer.InstanceOfTok()},
            {alt: () => this.tokenConsumer.InTok()},
            {alt: () => this.AbsShiftOperator()},
            {alt: () => this.AbsMultiplicativeOperator()},
            {alt: () => this.AbsAdditiveOperator()},
        ]);
    }

    // 11.9 相等运算符
    @SubhutiRule
    AbsEqualityOperator() {
        this.Or([
            {alt: () => this.tokenConsumer.EqEq()},
            {alt: () => this.tokenConsumer.NotEq()},
            {alt: () => this.tokenConsumer.EqEq()},
            {alt: () => this.tokenConsumer.NotEqEq()},
        ]);
    }

    // 11.8 关系运算符
    @SubhutiRule
    AbsRelationalOperator() {
        this.Or([
            {alt: () => this.tokenConsumer.Less()},
            {alt: () => this.tokenConsumer.Greater()},
            {alt: () => this.tokenConsumer.LessEq()},
            {alt: () => this.tokenConsumer.GreaterEq()},
        ]);
    }

    // 11.7 位移运算符
    @SubhutiRule
    AbsShiftOperator() {
        this.Or([
            {alt: () => this.tokenConsumer.LessLess()},
            {alt: () => this.tokenConsumer.MoreMore()},
            {alt: () => this.tokenConsumer.MoreMoreMore()},
        ]);
    }

    // 11.5 乘法运算符
    @SubhutiRule
    AbsMultiplicativeOperator() {
        this.Or([
            {alt: () => this.tokenConsumer.Asterisk()},
            {alt: () => this.tokenConsumer.Slash()},
            {alt: () => this.tokenConsumer.Percent()},
        ]);
    }

    // 11.6 加法运算符
    @SubhutiRule
    AbsAdditiveOperator() {
        this.Or([
            {alt: () => this.tokenConsumer.Plus()},
            {alt: () => this.tokenConsumer.Minus()},
        ]);
    }

    @SubhutiRule
    binaryExpressionNoIn() {
        this.unaryExpression();
        this.MANY(() => {
            this.Or([
                {alt: () => this.AbsAssignmentOperator()},
                {alt: () => this.tokenConsumer.VerticalBarVerticalBar()},
                {alt: () => this.tokenConsumer.AmpersandAmpersand()},
                {alt: () => this.tokenConsumer.VerticalBar()},
                {alt: () => this.tokenConsumer.Circumflex()},
                {alt: () => this.tokenConsumer.Ampersand()},
                {alt: () => this.AbsEqualityOperator()},
                {alt: () => this.AbsRelationalOperator()},
                {alt: () => this.tokenConsumer.InstanceOfTok()},
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
            this.tokenConsumer.Question();
            this.assignmentExpression();
            this.tokenConsumer.Colon();
            this.assignmentExpression();
        });
    }

    @SubhutiRule
    assignmentExpressionNoIn() {
        this.binaryExpressionNoIn();
        this.option(() => {
            this.tokenConsumer.Question();
            this.assignmentExpression();
            this.tokenConsumer.Colon();
            this.assignmentExpressionNoIn();
        });
    }

    // 11.14 逗号运算符
    @SubhutiRule
    expression() {
        this.assignmentExpression();
        this.MANY(() => {
            this.tokenConsumer.Comma();
            this.assignmentExpression();
        });
    }

    @SubhutiRule
    expressionNoIn() {
        this.assignmentExpressionNoIn();
        this.MANY(() => {
            this.tokenConsumer.Comma();
            this.assignmentExpressionNoIn();
        });
    }

    // 12 语句
    @SubhutiRule
    statement() {
        this.Or([
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
        this.tokenConsumer.LBrace();
        this.option(() => {
            this.StatementList();
        });
        this.tokenConsumer.RBrace();
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
        this.tokenConsumer.VarTok();
        this.variableDeclarationList();
        this.tokenConsumer.Semicolon();
    }

    // 12.2 变量声明列表
    @SubhutiRule
    variableDeclarationList() {
        this.variableDeclaration();
        this.MANY(() => {
            this.tokenConsumer.Comma();
            this.variableDeclaration();
        });
    }

    @SubhutiRule
    variableDeclarationListNoIn() {
        let numOfVars = 1;
        this.variableDeclarationNoIn();
        this.MANY(() => {
            this.tokenConsumer.Comma();
            this.variableDeclarationNoIn();
            numOfVars++;
        });
        return numOfVars;
    }

    // 12.2 变量声明
    @SubhutiRule
    variableDeclaration() {
        this.tokenConsumer.IdentifierName();
        this.option(() => {
            this.initialiser();
        });
    }

    @SubhutiRule
    variableDeclarationNoIn() {
        this.tokenConsumer.IdentifierName();
        this.option(() => {
            this.initialiserNoIn();
        });
    }

    // 12.2 初始化器
    @SubhutiRule
    initialiser() {
        this.tokenConsumer.Eq();
        this.assignmentExpression();
    }

    @SubhutiRule
    initialiserNoIn() {
        this.tokenConsumer.Eq();
        this.assignmentExpressionNoIn();
    }

    // 12.3 空语句
    @SubhutiRule
    emptyStatement() {
        this.tokenConsumer.Semicolon();
    }

    // 12.4 表达式语句
    @SubhutiRule
    expressionStatement() {
        this.expression();
        this.tokenConsumer.Semicolon();
    }

    // 12.5 if 语句
    @SubhutiRule
    ifStatement() {
        this.tokenConsumer.IfTok();
        this.tokenConsumer.LParen();
        this.expression();
        this.tokenConsumer.RParen();
        this.statement();
        this.option(() => {
            this.tokenConsumer.ElseTok();
            this.statement();
        });
    }

    // 12.6 迭代语句
    @SubhutiRule
    iterationStatement() {
        this.Or([
            {alt: () => this.doIteration()},
            {alt: () => this.whileIteration()},
            {alt: () => this.forIteration()},
        ]);
    }

    // 12.6.1 do-while 语句
    @SubhutiRule
    doIteration() {
        this.tokenConsumer.DoTok();
        this.statement();
        this.tokenConsumer.WhileTok();
        this.tokenConsumer.LParen();
        this.expression();
        this.tokenConsumer.RParen();
        this.tokenConsumer.Semicolon();
    }

    // 12.6.2 while 语句
    @SubhutiRule
    whileIteration() {
        this.tokenConsumer.WhileTok();
        this.tokenConsumer.LParen();
        this.expression();
        this.tokenConsumer.RParen();
        this.statement();
    }

    // 12.6.3 for 语句
    @SubhutiRule
    forIteration() {
        let inPossible = false;
        this.tokenConsumer.ForTok();
        this.tokenConsumer.LParen();
        this.Or([
            {
                alt: () => {
                    this.tokenConsumer.VarTok();
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
        this.tokenConsumer.RParen();
        this.statement();
    }

    // 12.6.3 for 语句头部
    @SubhutiRule
    forHeaderParts(inPossible) {
        this.Or([
            {
                alt: () => {
                    this.tokenConsumer.Semicolon();
                    this.option(() => {
                        this.expression();
                    });
                    this.tokenConsumer.Semicolon();
                    this.option(() => {
                        this.expression();
                    });
                },
            },
            {
                alt: () => {
                    this.tokenConsumer.InTok();
                    this.expression();
                },
            },
        ]);
    }

    // 12.7 continue 语句
    @SubhutiRule
    continueStatement() {
        this.tokenConsumer.ContinueTok();
        this.option(() => {
            this.tokenConsumer.IdentifierName();
        });
        this.tokenConsumer.Semicolon();
    }

    // 12.8 break 语句
    @SubhutiRule
    breakStatement() {
        this.tokenConsumer.BreakTok();
        this.option(() => {
            this.tokenConsumer.IdentifierName();
        });
        this.tokenConsumer.Semicolon();
    }

    // 12.9 return 语句
    @SubhutiRule
    returnStatement() {
        this.tokenConsumer.ReturnTok();
        this.option(() => {
            this.expression();
        });
        this.tokenConsumer.Semicolon();
    }

    // 12.10 with 语句
    @SubhutiRule
    withStatement() {
        this.tokenConsumer.WithTok();
        this.tokenConsumer.LParen();
        this.expression();
        this.tokenConsumer.RParen();
        this.statement();
    }

    // 12.11 switch 语句
    @SubhutiRule
    switchStatement() {
        this.tokenConsumer.SwitchTok();
        this.tokenConsumer.LParen();
        this.expression();
        this.tokenConsumer.RParen();
        this.caseBlock();
    }

    // 12.11 case 块
    @SubhutiRule
    caseBlock() {
        this.tokenConsumer.LBrace();
        this.option(() => {
            this.caseClauses();
        });
        this.option(() => {
            this.defaultClause();
        });
        this.option(() => {
            this.caseClauses();
        });
        this.tokenConsumer.RBrace();
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
        this.tokenConsumer.CaseTok();
        this.expression();
        this.tokenConsumer.Colon();
        this.option(() => {
            this.StatementList();
        });
    }

    // 12.11 default 子句
    @SubhutiRule
    defaultClause() {
        this.tokenConsumer.DefaultTok();
        this.tokenConsumer.Colon();
        this.option(() => {
            this.StatementList();
        });
    }

    // 12.12 标记语句
    @SubhutiRule
    labelledStatement() {
        this.tokenConsumer.IdentifierName();
        this.tokenConsumer.Colon();
        this.option(() => {
            this.statement();
        });
    }

    // 12.13 throw 语句
    @SubhutiRule
    throwStatement() {
        this.tokenConsumer.ThrowTok();
        this.expression();
        this.tokenConsumer.Semicolon();
    }

    // 12.14 try 语句
    @SubhutiRule
    tryStatement() {
        this.tokenConsumer.TryTok();
        this.block();
        this.Or([
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
        this.tokenConsumer.CatchTok();
        this.tokenConsumer.LParen();
        this.tokenConsumer.IdentifierName();
        this.tokenConsumer.RParen();
        this.block();
    }

    // 12.14 finally 子句
    @SubhutiRule
    finally() {
        this.tokenConsumer.FinallyTok();
        this.block();
    }

    // 12.15 debugger 语句
    @SubhutiRule
    debuggerStatement() {
        this.tokenConsumer.DebuggerTok();
        this.tokenConsumer.Semicolon();
    }

    // 13 函数定义
    @SubhutiRule
    functionDeclaration() {
        this.tokenConsumer.FunctionTok();
        this.tokenConsumer.IdentifierName();
        this.tokenConsumer.LParen();
        this.option(() => {
            this.formalParameterList();
        });
        this.tokenConsumer.RParen();
        this.tokenConsumer.LBrace();
        this.sourceElements();
        this.tokenConsumer.RBrace();
    }

    // 13 函数表达式
    @SubhutiRule
    functionExpression() {
        this.tokenConsumer.FunctionTok();
        this.option(() => {
            this.tokenConsumer.IdentifierName();
        });
        this.tokenConsumer.LParen();
        this.option(() => {
            this.formalParameterList();
        });
        this.tokenConsumer.RParen();
        this.tokenConsumer.LBrace();
        this.sourceElements();
        this.tokenConsumer.RBrace();
    }

    // 13 形式参数列表
    @SubhutiRule
    formalParameterList() {
        this.tokenConsumer.IdentifierName();
        this.MANY(() => {
            this.tokenConsumer.Comma();
            this.tokenConsumer.IdentifierName();
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
        this.Or([
            {
                alt: () => this.functionDeclaration(),
            },
            {alt: () => this.statement()},
        ]);
    }

    @SubhutiRule
    stringLiteral() {
        this.tokenConsumer.StringLiteral()
    }
}
