import SubhutiParser, {SubhutiRule} from "../subhuti/SubhutiParser";
import {es5TokensObj} from "./Es5Tokens";

export class Es5Parser extends SubhutiParser {

    // 11.1 主表达式
    @SubhutiRule
    primaryExpression() {
        this.or([
            {alt: () => this.consume(es5TokensObj.ThisTok)},
            {alt: () => this.consume(es5TokensObj.IdentifierName)},
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
            {alt: () => this.consume(es5TokensObj.NullTok)},
            {alt: () => this.consume(es5TokensObj.TrueTok)},
            {alt: () => this.consume(es5TokensObj.FalseTok)},
            {alt: () => this.consume(es5TokensObj.NumericLiteral)},
            {alt: () => this.consume(es5TokensObj.StringLiteral)},
            {alt: () => this.consume(es5TokensObj.RegularExpressionLiteral)},
        ]);
    }

    // 11.1.6 括号表达式
    @SubhutiRule
    parenthesisExpression() {
        this.consume(es5TokensObj.LParen);
        this.expression();
        this.consume(es5TokensObj.RParen);
    }

    // 11.1.4 数组初始化器
    @SubhutiRule
    array() {
        this.consume(es5TokensObj.LBracket);
        this.MANY(() => {
            this.or([
                {alt: () => this.elementList()},
                {alt: () => this.elision()},
            ]);
        });
        this.consume(es5TokensObj.RBracket);
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
            this.consume(es5TokensObj.Comma);
        });
    }

    // 11.1.5 对象初始化器
    @SubhutiRule
    object() {
        this.consume(es5TokensObj.LBrace);
        this.option(() => {
            this.propertyAssignment();
            this.MANY(() => {
                this.consume(es5TokensObj.Comma);
                this.propertyAssignment();
            });
            this.option(() => {
                this.consume(es5TokensObj.Comma);
            });
        });
        this.consume(es5TokensObj.RBrace);
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
        this.consume(es5TokensObj.Colon);
        this.assignmentExpression();
    }

    // 11.1.5 getter 属性赋值
    @SubhutiRule
    getPropertyAssignment() {
        this.consume(es5TokensObj.GetTok);
        this.propertyName();
        this.consume(es5TokensObj.LParen);
        this.consume(es5TokensObj.RParen);
        this.consume(es5TokensObj.LBrace);
        this.sourceElements();
        this.consume(es5TokensObj.RBrace);
    }

    // 11.1.5 setter 属性赋值
    @SubhutiRule
    setPropertyAssignment() {
        this.consume(es5TokensObj.SetTok);
        this.propertyName();
        this.consume(es5TokensObj.LParen);
        this.consume(es5TokensObj.IdentifierName);
        this.consume(es5TokensObj.RParen);
        this.consume(es5TokensObj.LBrace);
        this.sourceElements();
        this.consume(es5TokensObj.RBrace);
    }

    // 11.1.5 属性名称
    @SubhutiRule
    propertyName() {
        this.or([
            {alt: () => this.consume(es5TokensObj.IdentifierName)},
            {alt: () => this.consume(es5TokensObj.IdentifierName)},
            {alt: () => this.consume(es5TokensObj.StringLiteral)},
            {alt: () => this.consume(es5TokensObj.NumericLiteral)},
        ]);
    }

    // 11.2 左值表达式
    @SubhutiRule
    memberCallNewExpression() {
        this.MANY(() => {
            this.consume(es5TokensObj.NewTok);
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
        this.consume(es5TokensObj.LBracket);
        this.expression();
        this.consume(es5TokensObj.RBracket);
    }

    // 11.2.1 属性访问表达式
    @SubhutiRule
    dotMemberExpression() {
        this.consume(es5TokensObj.Dot);
        this.consume(es5TokensObj.IdentifierName);
    }

    // 11.2.3 函数调用
    @SubhutiRule
    arguments() {
        this.consume(es5TokensObj.LParen);
        this.option(() => {
            this.assignmentExpression();
            this.MANY(() => {
                this.consume(es5TokensObj.Comma);
                this.assignmentExpression();
            });
        });
        this.consume(es5TokensObj.RParen);
    }

    // 11.3 后缀表达式
    @SubhutiRule
    postfixExpression() {
        this.memberCallNewExpression();
        this.option(() => {
            this.or([
                {alt: () => this.consume(es5TokensObj.PlusPlus)},
                {alt: () => this.consume(es5TokensObj.MinusMinus)},
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
                        {alt: () => this.consume(es5TokensObj.DeleteTok)},
                        {alt: () => this.consume(es5TokensObj.VoidTok)},
                        {alt: () => this.consume(es5TokensObj.TypeOfTok)},
                        {alt: () => this.consume(es5TokensObj.PlusPlus)},
                        {alt: () => this.consume(es5TokensObj.MinusMinus)},
                        {alt: () => this.consume(es5TokensObj.Plus)},
                        {alt: () => this.consume(es5TokensObj.Minus)},
                        {alt: () => this.consume(es5TokensObj.Tilde)},
                        {alt: () => this.consume(es5TokensObj.Exclamation)},
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
                {alt: () => this.consume(es5TokensObj.VerticalBarVerticalBar)},
                {alt: () => this.consume(es5TokensObj.AmpersandAmpersand)},
                {alt: () => this.consume(es5TokensObj.VerticalBar)},
                {alt: () => this.consume(es5TokensObj.Circumflex)},
                {alt: () => this.consume(es5TokensObj.Ampersand)},
                {alt: () => this.AbsEqualityOperator()},
                {alt: () => this.AbsRelationalOperator()},
                {alt: () => this.consume(es5TokensObj.InstanceOfTok)},
                {alt: () => this.consume(es5TokensObj.InTok)},
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
            {alt: () => this.consume(es5TokensObj.Eq)},
            {alt: () => this.consume(es5TokensObj.PlusEq)},
            {alt: () => this.consume(es5TokensObj.AmpersandAmpersand)},
            {alt: () => this.consume(es5TokensObj.VerticalBar)},
            {alt: () => this.consume(es5TokensObj.Circumflex)},
            {alt: () => this.consume(es5TokensObj.Ampersand)},
            {alt: () => this.AbsEqualityOperator()},
            {alt: () => this.AbsRelationalOperator()},
            {alt: () => this.consume(es5TokensObj.InstanceOfTok)},
            {alt: () => this.consume(es5TokensObj.InTok)},
            {alt: () => this.AbsShiftOperator()},
            {alt: () => this.AbsMultiplicativeOperator()},
            {alt: () => this.AbsAdditiveOperator()},
        ]);
    }

    // 11.9 相等运算符
    @SubhutiRule
    AbsEqualityOperator() {
        this.or([
            {alt: () => this.consume(es5TokensObj.EqEq)},
            {alt: () => this.consume(es5TokensObj.NotEq)},
            {alt: () => this.consume(es5TokensObj.EqEq)},
            {alt: () => this.consume(es5TokensObj.NotEqEq)},
        ]);
    }

    // 11.8 关系运算符
    @SubhutiRule
    AbsRelationalOperator() {
        this.or([
            {alt: () => this.consume(es5TokensObj.Less)},
            {alt: () => this.consume(es5TokensObj.Greater)},
            {alt: () => this.consume(es5TokensObj.LessEq)},
            {alt: () => this.consume(es5TokensObj.GreaterEq)},
        ]);
    }

    // 11.7 位移运算符
    @SubhutiRule
    AbsShiftOperator() {
        this.or([
            {alt: () => this.consume(es5TokensObj.LessLess)},
            {alt: () => this.consume(es5TokensObj.MoreMore)},
            {alt: () => this.consume(es5TokensObj.MoreMoreMore)},
        ]);
    }

    // 11.5 乘法运算符
    @SubhutiRule
    AbsMultiplicativeOperator() {
        this.or([
            {alt: () => this.consume(es5TokensObj.Asterisk)},
            {alt: () => this.consume(es5TokensObj.Slash)},
            {alt: () => this.consume(es5TokensObj.Percent)},
        ]);
    }

    // 11.6 加法运算符
    @SubhutiRule
    AbsAdditiveOperator() {
        this.or([
            {alt: () => this.consume(es5TokensObj.Plus)},
            {alt: () => this.consume(es5TokensObj.Minus)},
        ]);
    }

    @SubhutiRule
    binaryExpressionNoIn() {
        this.unaryExpression();
        this.MANY(() => {
            this.or([
                {alt: () => this.AbsAssignmentOperator()},
                {alt: () => this.consume(es5TokensObj.VerticalBarVerticalBar)},
                {alt: () => this.consume(es5TokensObj.AmpersandAmpersand)},
                {alt: () => this.consume(es5TokensObj.VerticalBar)},
                {alt: () => this.consume(es5TokensObj.Circumflex)},
                {alt: () => this.consume(es5TokensObj.Ampersand)},
                {alt: () => this.AbsEqualityOperator()},
                {alt: () => this.AbsRelationalOperator()},
                {alt: () => this.consume(es5TokensObj.InstanceOfTok)},
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
            this.consume(es5TokensObj.Question);
            this.assignmentExpression();
            this.consume(es5TokensObj.Colon);
            this.assignmentExpression();
        });
    }

    @SubhutiRule
    assignmentExpressionNoIn() {
        this.binaryExpressionNoIn();
        this.option(() => {
            this.consume(es5TokensObj.Question);
            this.assignmentExpression();
            this.consume(es5TokensObj.Colon);
            this.assignmentExpressionNoIn();
        });
    }

    // 11.14 逗号运算符
    @SubhutiRule
    expression() {
        this.assignmentExpression();
        this.MANY(() => {
            this.consume(es5TokensObj.Comma);
            this.assignmentExpression();
        });
    }

    @SubhutiRule
    expressionNoIn() {
        this.assignmentExpressionNoIn();
        this.MANY(() => {
            this.consume(es5TokensObj.Comma);
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
        this.consume(es5TokensObj.LBrace);
        this.option(() => {
            this.statementList();
        });
        this.consume(es5TokensObj.RBrace);
    }

    // 12.1 语句列表
    @SubhutiRule
    statementList() {
        this.AT_LEAST_ONE(() => {
            this.statement();
        });
    }

    // 12.2 变量语句
    @SubhutiRule
    variableStatement() {
        this.consume(es5TokensObj.VarTok);
        this.variableDeclarationList();
        this.consume(es5TokensObj.Semicolon);
    }

    // 12.2 变量声明列表
    @SubhutiRule
    variableDeclarationList() {
        this.variableDeclaration();
        this.MANY(() => {
            this.consume(es5TokensObj.Comma);
            this.variableDeclaration();
        });
    }

    @SubhutiRule
    variableDeclarationListNoIn() {
        let numOfVars = 1;
        this.variableDeclarationNoIn();
        this.MANY(() => {
            this.consume(es5TokensObj.Comma);
            this.variableDeclarationNoIn();
            numOfVars++;
        });
        return numOfVars;
    }

    // 12.2 变量声明
    @SubhutiRule
    variableDeclaration() {
        this.consume(es5TokensObj.IdentifierName);
        this.option(() => {
            this.initialiser();
        });
    }

    @SubhutiRule
    variableDeclarationNoIn() {
        this.consume(es5TokensObj.IdentifierName);
        this.option(() => {
            this.initialiserNoIn();
        });
    }

    // 12.2 初始化器
    @SubhutiRule
    initialiser() {
        this.consume(es5TokensObj.Eq);
        this.assignmentExpression();
    }

    @SubhutiRule
    initialiserNoIn() {
        this.consume(es5TokensObj.Eq);
        this.assignmentExpressionNoIn();
    }

    // 12.3 空语句
    @SubhutiRule
    emptyStatement() {
        this.consume(es5TokensObj.Semicolon);
    }

    // 12.4 表达式语句
    @SubhutiRule
    expressionStatement() {
        this.expression();
        this.consume(es5TokensObj.Semicolon);
    }

    // 12.5 if 语句
    @SubhutiRule
    ifStatement() {
        this.consume(es5TokensObj.IfTok);
        this.consume(es5TokensObj.LParen);
        this.expression();
        this.consume(es5TokensObj.RParen);
        this.statement();
        this.option(() => {
            this.consume(es5TokensObj.ElseTok);
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
        this.consume(es5TokensObj.DoTok);
        this.statement();
        this.consume(es5TokensObj.WhileTok);
        this.consume(es5TokensObj.LParen);
        this.expression();
        this.consume(es5TokensObj.RParen);
        this.consume(es5TokensObj.Semicolon);
    }

    // 12.6.2 while 语句
    @SubhutiRule
    whileIteration() {
        this.consume(es5TokensObj.WhileTok);
        this.consume(es5TokensObj.LParen);
        this.expression();
        this.consume(es5TokensObj.RParen);
        this.statement();
    }

    // 12.6.3 for 语句
    @SubhutiRule
    forIteration() {
        let inPossible = false;
        this.consume(es5TokensObj.ForTok);
        this.consume(es5TokensObj.LParen);
        this.or([
            {
                alt: () => {
                    this.consume(es5TokensObj.VarTok);
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
        this.consume(es5TokensObj.RParen);
        this.statement();
    }

    // 12.6.3 for 语句头部
    @SubhutiRule
    forHeaderParts(inPossible) {
        this.or([
            {
                alt: () => {
                    this.consume(es5TokensObj.Semicolon);
                    this.option(() => {
                        this.expression();
                    });
                    this.consume(es5TokensObj.Semicolon);
                    this.option(() => {
                        this.expression();
                    });
                },
            },
            {
                alt: () => {
                    this.consume(es5TokensObj.InTok);
                    this.expression();
                },
            },
        ]);
    }

    // 12.7 continue 语句
    @SubhutiRule
    continueStatement() {
        this.consume(es5TokensObj.ContinueTok);
        this.option(() => {
            this.consume(es5TokensObj.IdentifierName);
        });
        this.consume(es5TokensObj.Semicolon);
    }

    // 12.8 break 语句
    @SubhutiRule
    breakStatement() {
        this.consume(es5TokensObj.BreakTok);
        this.option(() => {
            this.consume(es5TokensObj.IdentifierName);
        });
        this.consume(es5TokensObj.Semicolon);
    }

    // 12.9 return 语句
    @SubhutiRule
    returnStatement() {
        this.consume(es5TokensObj.ReturnTok);
        this.option(() => {
            this.expression();
        });
        this.consume(es5TokensObj.Semicolon);
    }

    // 12.10 with 语句
    @SubhutiRule
    withStatement() {
        this.consume(es5TokensObj.WithTok);
        this.consume(es5TokensObj.LParen);
        this.expression();
        this.consume(es5TokensObj.RParen);
        this.statement();
    }

    // 12.11 switch 语句
    @SubhutiRule
    switchStatement() {
        this.consume(es5TokensObj.SwitchTok);
        this.consume(es5TokensObj.LParen);
        this.expression();
        this.consume(es5TokensObj.RParen);
        this.caseBlock();
    }

    // 12.11 case 块
    @SubhutiRule
    caseBlock() {
        this.consume(es5TokensObj.LBrace);
        this.option(() => {
            this.caseClauses();
        });
        this.option(() => {
            this.defaultClause();
        });
        this.option(() => {
            this.caseClauses();
        });
        this.consume(es5TokensObj.RBrace);
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
        this.consume(es5TokensObj.CaseTok);
        this.expression();
        this.consume(es5TokensObj.Colon);
        this.option(() => {
            this.statementList();
        });
    }

    // 12.11 default 子句
    @SubhutiRule
    defaultClause() {
        this.consume(es5TokensObj.DefaultTok);
        this.consume(es5TokensObj.Colon);
        this.option(() => {
            this.statementList();
        });
    }

    // 12.12 标记语句
    @SubhutiRule
    labelledStatement() {
        this.consume(es5TokensObj.IdentifierName);
        this.consume(es5TokensObj.Colon);
        this.option(() => {
            this.statement();
        });
    }

    // 12.13 throw 语句
    @SubhutiRule
    throwStatement() {
        this.consume(es5TokensObj.ThrowTok);
        this.expression();
        this.consume(es5TokensObj.Semicolon);
    }

    // 12.14 try 语句
    @SubhutiRule
    tryStatement() {
        this.consume(es5TokensObj.TryTok);
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
        this.consume(es5TokensObj.CatchTok);
        this.consume(es5TokensObj.LParen);
        this.consume(es5TokensObj.IdentifierName);
        this.consume(es5TokensObj.RParen);
        this.block();
    }

    // 12.14 finally 子句
    @SubhutiRule
    finally() {
        this.consume(es5TokensObj.FinallyTok);
        this.block();
    }

    // 12.15 debugger 语句
    @SubhutiRule
    debuggerStatement() {
        this.consume(es5TokensObj.DebuggerTok);
        this.consume(es5TokensObj.Semicolon);
    }

    // 13 函数定义
    @SubhutiRule
    functionDeclaration() {
        this.consume(es5TokensObj.FunctionTok);
        this.consume(es5TokensObj.IdentifierName);
        this.consume(es5TokensObj.LParen);
        this.option(() => {
            this.formalParameterList();
        });
        this.consume(es5TokensObj.RParen);
        this.consume(es5TokensObj.LBrace);
        this.sourceElements();
        this.consume(es5TokensObj.RBrace);
    }

    // 13 函数表达式
    @SubhutiRule
    functionExpression() {
        this.consume(es5TokensObj.FunctionTok);
        this.option(() => {
            this.consume(es5TokensObj.IdentifierName);
        });
        this.consume(es5TokensObj.LParen);
        this.option(() => {
            this.formalParameterList();
        });
        this.consume(es5TokensObj.RParen);
        this.consume(es5TokensObj.LBrace);
        this.sourceElements();
        this.consume(es5TokensObj.RBrace);
    }

    // 13 形式参数列表
    @SubhutiRule
    formalParameterList() {
        this.consume(es5TokensObj.IdentifierName);
        this.MANY(() => {
            this.consume(es5TokensObj.Comma);
            this.consume(es5TokensObj.IdentifierName);
        });
    }

    // 14 程序
    @SubhutiRule
    program() {
        this.sourceElements();
        return this.getCurCst();
    }

    // 14 源元素
    @SubhutiRule
    sourceElements() {
        this.AT_LEAST_ONE(() => {
            this.or([
                {
                    alt: () => this.functionDeclaration(),
                },
                {alt: () => this.statement()},
            ]);
        });
    }

    @SubhutiRule
    identifierName() {
        this.consume(es5TokensObj.IdentifierName)
    }

    @SubhutiRule
    stringLiteral() {
        this.consume(es5TokensObj.StringLiteral)
    }
}
