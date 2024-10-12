import SubhutiParser, {SubhutiRule} from "../subhuti/SubhutiParser";
import {es5TokensObj} from "./Es5Tokens";

export class Es5Parser extends SubhutiParser {
    @SubhutiRule
    primaryExpression() {
        this.or(
            [
                {alt: () => this.consume(es5TokensObj.ThisTok)},
                {alt: () => this.consume(es5TokensObj.Identifier)},
                {alt: () => this.AbsLiteral()},
                {alt: () => this.array()},
                {alt: () => this.object()},
                {alt: () => this.parenthesisExpression()},
            ]
        );
    }


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


    @SubhutiRule
    parenthesisExpression() {
        this.consume(es5TokensObj.LParen);
        this.expression();
        this.consume(es5TokensObj.RParen);
    }


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


    @SubhutiRule
    elementList() {
        this.assignmentExpression();
        this.MANY(() => {
            this.elision();
            this.assignmentExpression();
        });
    }


    @SubhutiRule
    elision() {
        this.AT_LEAST_ONE(() => {
            this.consume(es5TokensObj.Comma);
        });
    }


    @SubhutiRule
    object() {
        this.consume(es5TokensObj.LCurly);
        this.OPTION(() => {
            this.propertyAssignment();
            this.MANY(() => {
                this.consume(es5TokensObj.Comma);
                this.propertyAssignment();
            });
            this.OPTION(() => {
                this.consume(es5TokensObj.Comma);
            });
        });
        this.consume(es5TokensObj.RCurly);
    }


    @SubhutiRule
    propertyAssignment() {
        this.or([
            {alt: () => this.regularPropertyAssignment()},
            {alt: () => this.getPropertyAssignment()},
            {alt: () => this.setPropertyAssignment()},
        ]);
    }


    @SubhutiRule
    regularPropertyAssignment() {
        this.propertyName();
        this.consume(es5TokensObj.Colon);
        this.assignmentExpression();
    }


    @SubhutiRule
    getPropertyAssignment() {
        this.consume(es5TokensObj.GetTok);
        this.propertyName();
        this.consume(es5TokensObj.LParen);
        this.consume(es5TokensObj.RParen);
        this.consume(es5TokensObj.LCurly);
        this.sourceElements();
        this.consume(es5TokensObj.RCurly);
    }


    @SubhutiRule
    setPropertyAssignment() {
        this.consume(es5TokensObj.SetTok);
        this.propertyName();
        this.consume(es5TokensObj.LParen);
        this.consume(es5TokensObj.Identifier);
        this.consume(es5TokensObj.RParen);
        this.consume(es5TokensObj.LCurly);
        this.sourceElements();
        this.consume(es5TokensObj.RCurly);
    }


    @SubhutiRule
    propertyName() {
        this.or([
            {alt: () => this.consume(es5TokensObj.Identifier)},
            {alt: () => this.consume(es5TokensObj.Identifier)},
            {alt: () => this.consume(es5TokensObj.StringLiteral)},
            {alt: () => this.consume(es5TokensObj.NumericLiteral)},
        ]);


    }


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


    @SubhutiRule
    boxMemberExpression() {
        this.consume(es5TokensObj.LBracket);
        this.expression();
        this.consume(es5TokensObj.RBracket);
    }


    @SubhutiRule
    dotMemberExpression() {
        this.consume(es5TokensObj.Dot);
        this.consume(es5TokensObj.Identifier);
    }


    @SubhutiRule
    arguments() {
        this.consume(es5TokensObj.LParen);
        this.OPTION(() => {
            this.assignmentExpression();
            this.MANY(() => {
                this.consume(es5TokensObj.Comma);
                this.assignmentExpression();
            });
        });
        this.consume(es5TokensObj.RParen);
    }


    @SubhutiRule
    postfixExpression() {
        this.memberCallNewExpression();
        this.OPTION({
            DEF: () => {
                this.or([
                    {alt: () => this.plusPlus()},
                    {alt: () => this.MinusMinus()},
                ]);
            },
        });
    }


    @SubhutiRule
    plusPlus() {
        this.consume(es5TokensObj.Plus)
        this.consume(es5TokensObj.Plus)
    }


    @SubhutiRule
    MinusMinus() {
        this.consume(es5TokensObj.Minus)
        this.consume(es5TokensObj.Minus)
    }


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
                        {alt: () => this.plusPlus()},
                        {alt: () => this.MinusMinus()},
                        {alt: () => this.consume(es5TokensObj.Plus)},
                        {alt: () => this.consume(es5TokensObj.Minus)},
                        {alt: () => this.consume(es5TokensObj.Tilde)},
                        {alt: () => this.consume(es5TokensObj.Exclamation)},
                    ])

                    this.unaryExpression();
                },
            },
        ]);
    }


    @SubhutiRule
    binaryExpression() {
        this.unaryExpression();
        this.MANY(() => {
            this.or(
                [
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
                ])
            this.unaryExpression();
        });
    }

    @SubhutiRule
    AbsAssignmentOperator() {
        this.or(
            [
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
            ])
    }


    @SubhutiRule
    AbsEqualityOperator() {
        this.or(
            [
                {alt: () => this.consume(es5TokensObj.EqEq)},
                {alt: () => this.consume(es5TokensObj.NotEq)},
                {alt: () => this.consume(es5TokensObj.EqEq)},
                {alt: () => this.consume(es5TokensObj.NotEqEq)},
            ])
    }

    @SubhutiRule
    AbsRelationalOperator() {
        this.or(
            [
                {alt: () => this.consume(es5TokensObj.Less)},
                {alt: () => this.consume(es5TokensObj.Greater)},
                {alt: () => this.consume(es5TokensObj.LessEq)},
                {alt: () => this.consume(es5TokensObj.GreaterEq)},
            ])
    }


    @SubhutiRule
    AbsShiftOperator() {
        this.or(
            [
                {alt: () => this.consume(es5TokensObj.LessLess)},
                {alt: () => this.consume(es5TokensObj.MoreMore)},
                {alt: () => this.consume(es5TokensObj.MoreMoreMore)},
            ])
    }


    @SubhutiRule
    AbsMultiplicativeOperator() {
        this.or(
            [
                {alt: () => this.consume(es5TokensObj.Asterisk)},
                {alt: () => this.consume(es5TokensObj.Slash)},
                {alt: () => this.consume(es5TokensObj.Percent)},
            ])
    }


    @SubhutiRule
    AbsAdditiveOperator() {
        this.or(
            [
                {alt: () => this.consume(es5TokensObj.Plus)},
                {alt: () => this.consume(es5TokensObj.Minus)},
            ])
    }


    @SubhutiRule
    binaryExpressionNoIn() {
        this.unaryExpression();
        this.MANY(() => {
            this.or(
                [
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
                ]
            );
            this.unaryExpression();
        });
    }


    @SubhutiRule
    assignmentExpression() {
        this.binaryExpression();
        this.OPTION(() => {
            this.consume(es5TokensObj.Question);
            this.assignmentExpression();
            this.consume(es5TokensObj.Colon);
            this.assignmentExpression();
        });
    }


    @SubhutiRule
    assignmentExpressionNoIn() {
        this.binaryExpressionNoIn();
        this.OPTION(() => {
            this.consume(es5TokensObj.Question);
            this.assignmentExpression();
            this.consume(es5TokensObj.Colon);
            this.assignmentExpressionNoIn();
        });
    }


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


    @SubhutiRule
    statement() {
        this.or(
            [
                {alt: () => this.block()},
                {alt: () => this.variableStatement()},
                {alt: () => this.emptyStatement()},
                {alt: () => this.labelledStatement()},
                {
                    alt: () => this.expressionStatement(),

                },
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
            ]
        );
    }


    @SubhutiRule
    block() {
        this.consume(es5TokensObj.LCurly);
        this.OPTION(() => {
            this.statementList();
        });
        this.consume(es5TokensObj.RCurly);
    }


    @SubhutiRule
    statementList() {
        this.AT_LEAST_ONE(() => {
            this.statement();
        });
    }


    @SubhutiRule
    variableStatement() {
        this.consume(es5TokensObj.VarTok);
        this.variableDeclarationList();
        this.consume(es5TokensObj.Semicolon);
    }


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


    @SubhutiRule
    variableDeclaration() {
        this.consume(es5TokensObj.Identifier);
        this.OPTION(() => {
            this.initialiser();
        });
    }


    @SubhutiRule
    variableDeclarationNoIn() {
        this.consume(es5TokensObj.Identifier);
        this.OPTION(() => {
            this.initialiserNoIn();
        });
    }


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


    @SubhutiRule
    emptyStatement() {
        this.consume(es5TokensObj.Semicolon);
    }


    @SubhutiRule
    expressionStatement() {
        this.expression();
        this.consume(es5TokensObj.Semicolon);
    }


    @SubhutiRule
    ifStatement() {
        this.consume(es5TokensObj.IfTok);
        this.consume(es5TokensObj.LParen);
        this.expression();
        this.consume(es5TokensObj.RParen);
        this.statement();
        this.OPTION(() => {
            this.consume(es5TokensObj.ElseTok);
            this.statement();
        });
    }


    @SubhutiRule
    iterationStatement() {
        this.or([
            {alt: () => this.doIteration()},
            {alt: () => this.whileIteration()},
            {alt: () => this.forIteration()},
        ]);
    }


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


    @SubhutiRule
    whileIteration() {
        this.consume(es5TokensObj.WhileTok);
        this.consume(es5TokensObj.LParen);
        this.expression();
        this.consume(es5TokensObj.RParen);
        this.statement();
    }


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
                    // this.OPTION(() => {
                    //     const headerExp = this.expressionNoIn();
                    //     inPossible = this.canInComeAfterExp(headerExp);
                    // });
                    this.forHeaderParts(inPossible);
                },
            },
        ]);
        this.consume(es5TokensObj.RParen);
        this.statement();
    }


    @SubhutiRule
    forHeaderParts(inPossible) {
        this.or([
            {
                alt: () => {
                    this.consume(es5TokensObj.Semicolon);
                    this.OPTION(() => {
                        this.expression();
                    });
                    this.consume(es5TokensObj.Semicolon);
                    this.OPTION(() => {
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


    @SubhutiRule
    continueStatement() {
        this.consume(es5TokensObj.ContinueTok);
        this.OPTION({
            DEF: () => {
                this.consume(es5TokensObj.Identifier);
            },
        });
        this.consume(es5TokensObj.Semicolon);
    }


    @SubhutiRule
    breakStatement() {
        this.consume(es5TokensObj.BreakTok);
        this.OPTION({
            DEF: () => {
                this.consume(es5TokensObj.Identifier);
            },
        });
        this.consume(es5TokensObj.Semicolon);
    }


    @SubhutiRule
    returnStatement() {
        this.consume(es5TokensObj.ReturnTok);
        this.OPTION({
            DEF: () => {
                this.expression();
            },
        });
        this.consume(es5TokensObj.Semicolon);
    }


    @SubhutiRule
    withStatement() {
        this.consume(es5TokensObj.WithTok);
        this.consume(es5TokensObj.LParen);
        this.expression();
        this.consume(es5TokensObj.RParen);
        this.statement();
    }


    @SubhutiRule
    switchStatement() {
        this.consume(es5TokensObj.SwitchTok);
        this.consume(es5TokensObj.LParen);
        this.expression();
        this.consume(es5TokensObj.RParen);
        this.caseBlock();
    }


    @SubhutiRule
    caseBlock() {
        this.consume(es5TokensObj.LCurly);
        this.OPTION(() => {
            this.caseClauses();
        });
        this.OPTION(() => {
            this.defaultClause();
        });
        this.OPTION(() => {
            this.caseClauses();
        });
        this.consume(es5TokensObj.RCurly);
    }


    @SubhutiRule
    caseClauses() {
        this.AT_LEAST_ONE(() => {
            this.caseClause();
        });
    }


    @SubhutiRule
    caseClause() {
        this.consume(es5TokensObj.CaseTok);
        this.expression();
        this.consume(es5TokensObj.Colon);
        this.OPTION(() => {
            this.statementList();
        });
    }


    @SubhutiRule
    defaultClause() {
        this.consume(es5TokensObj.DefaultTok);
        this.consume(es5TokensObj.Colon);
        this.OPTION(() => {
            this.statementList();
        });
    }


    @SubhutiRule
    labelledStatement() {
        this.consume(es5TokensObj.Identifier);
        this.consume(es5TokensObj.Colon);
        this.OPTION(() => {
            this.statement();
        });
    }


    @SubhutiRule
    throwStatement() {
        this.consume(es5TokensObj.ThrowTok);
        /*if (this.lineTerminatorHere()) {
            this.SAVE_ERRor(
                new MismatchedTokenenException(
                    "Line Terminator not allowed before Expression in Throw Statement",
                ),
            );
        }*/
        this.expression();
        this.consume(es5TokensObj.Semicolon);
    }


    @SubhutiRule
    tryStatement() {
        this.consume(es5TokensObj.TryTok);
        this.block();

        this.or([
            {
                alt: () => {
                    this.catch();
                    this.OPTION(() => {
                        this.finally();
                    });
                },
            },
            {alt: () => this.finally()},
        ]);
    }


    @SubhutiRule
    catch() {
        this.consume(es5TokensObj.CatchTok);
        this.consume(es5TokensObj.LParen);
        this.consume(es5TokensObj.Identifier);
        this.consume(es5TokensObj.RParen);
        this.block();
    }


    @SubhutiRule
    finally() {
        this.consume(es5TokensObj.FinallyTok);
        this.block();
    }


    @SubhutiRule
    debuggerStatement() {
        this.consume(es5TokensObj.DebuggerTok);
        this.consume(es5TokensObj.Semicolon);
    }


    @SubhutiRule
    functionDeclaration() {
        this.consume(es5TokensObj.FunctionTok);
        this.consume(es5TokensObj.Identifier);
        this.consume(es5TokensObj.LParen);
        this.OPTION(() => {
            this.formalParameterList();
        });
        this.consume(es5TokensObj.RParen);
        this.consume(es5TokensObj.LCurly);
        this.sourceElements();
        this.consume(es5TokensObj.RCurly);
    }


    @SubhutiRule
    functionExpression() {
        this.consume(es5TokensObj.FunctionTok);
        this.OPTION(() => {
            this.consume(es5TokensObj.Identifier);
        });
        this.consume(es5TokensObj.LParen);
        this.OPTION(() => {
            this.formalParameterList();
        });
        this.consume(es5TokensObj.RParen);
        this.consume(es5TokensObj.LCurly);
        this.sourceElements();
        this.consume(es5TokensObj.RCurly);
    }


    @SubhutiRule
    formalParameterList() {
        this.consume(es5TokensObj.Identifier);
        this.MANY(() => {
            this.consume(es5TokensObj.Comma);
            this.consume(es5TokensObj.Identifier);
        });
    }


    @SubhutiRule
    program() {
        // this.sourceElements();
        this.or([
            {
                alt: () => {
                    this.consume(es5TokensObj.Comma);
                    this.consume(es5TokensObj.Identifier);
                },
            },
            {
                alt: () => {
                    this.consume(es5TokensObj.Comma);
                    this.consume(es5TokensObj.Identifier);
                },
            },
        ])
        return this.getCurCst()
    }


    @SubhutiRule
    sourceElements() {
        this.MANY(() => {
            console.log('执行了 many')
            this.or([
                {
                    alt: () => this.functionDeclaration(),

                },
                {alt: () => this.statement()},
            ]);
        });
    }
}
