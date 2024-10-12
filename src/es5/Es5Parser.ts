import SubhutiParser, {SubhutiRule} from "../subhuti/SubhutiParser";
import {es6TokObj} from "./Es5Tokens";

export class Es5Parser extends SubhutiParser {
    @SubhutiRule
    primaryExpression() {
        this.or(
            [
                {alt: () => this.consume(es6TokObj.ThisTok)},
                {alt: () => this.consume(es6TokObj.Identifier)},
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
            {alt: () => this.consume(es6TokObj.NullTok)},
            {alt: () => this.consume(es6TokObj.TrueTok)},
            {alt: () => this.consume(es6TokObj.FalseTok)},
            {alt: () => this.consume(es6TokObj.NumericLiteral)},
            {alt: () => this.consume(es6TokObj.StringLiteral)},
            {alt: () => this.consume(es6TokObj.RegularExpressionLiteral)},
        ]);

    }


    @SubhutiRule
    parenthesisExpression() {
        this.consume(es6TokObj.LParen);
        this.expression();
        this.consume(es6TokObj.RParen);
    }


    @SubhutiRule
    array() {
        this.consume(es6TokObj.LBracket);
        this.MANY(() => {
            this.or([
                {alt: () => this.elementList()},
                {alt: () => this.elision()},
            ]);
        });
        this.consume(es6TokObj.RBracket);
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
            this.consume(es6TokObj.Comma);
        });
    }


    @SubhutiRule
    object() {
        this.consume(es6TokObj.LCurly);
        this.OPTION(() => {
            this.propertyAssignment();
            this.MANY(() => {
                this.consume(es6TokObj.Comma);
                this.propertyAssignment();
            });
            this.OPTION(() => {
                this.consume(es6TokObj.Comma);
            });
        });
        this.consume(es6TokObj.RCurly);
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
        this.consume(es6TokObj.Colon);
        this.assignmentExpression();
    }


    @SubhutiRule
    getPropertyAssignment() {
        this.consume(es6TokObj.GetTok);
        this.propertyName();
        this.consume(es6TokObj.LParen);
        this.consume(es6TokObj.RParen);
        this.consume(es6TokObj.LCurly);
        this.sourceElements();
        this.consume(es6TokObj.RCurly);
    }


    @SubhutiRule
    setPropertyAssignment() {
        this.consume(es6TokObj.SetTok);
        this.propertyName();
        this.consume(es6TokObj.LParen);
        this.consume(es6TokObj.Identifier);
        this.consume(es6TokObj.RParen);
        this.consume(es6TokObj.LCurly);
        this.sourceElements();
        this.consume(es6TokObj.RCurly);
    }


    @SubhutiRule
    propertyName() {
        this.or([
            {alt: () => this.consume(es6TokObj.Identifier)},
            {alt: () => this.consume(es6TokObj.Identifier)},
            {alt: () => this.consume(es6TokObj.StringLiteral)},
            {alt: () => this.consume(es6TokObj.NumericLiteral)},
        ]);


    }


    @SubhutiRule
    memberCallNewExpression() {
        this.MANY(() => {
            this.consume(es6TokObj.NewTok);
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
        this.consume(es6TokObj.LBracket);
        this.expression();
        this.consume(es6TokObj.RBracket);
    }


    @SubhutiRule
    dotMemberExpression() {
        this.consume(es6TokObj.Dot);
        this.consume(es6TokObj.Identifier);
    }


    @SubhutiRule
    arguments() {
        this.consume(es6TokObj.LParen);
        this.OPTION(() => {
            this.assignmentExpression();
            this.MANY(() => {
                this.consume(es6TokObj.Comma);
                this.assignmentExpression();
            });
        });
        this.consume(es6TokObj.RParen);
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
        this.consume(es6TokObj.Plus)
        this.consume(es6TokObj.Plus)
    }


    @SubhutiRule
    MinusMinus() {
        this.consume(es6TokObj.Minus)
        this.consume(es6TokObj.Minus)
    }


    @SubhutiRule
    unaryExpression() {
        this.or([
            {alt: () => this.postfixExpression()},
            {
                alt: () => {
                    this.or([
                        {alt: () => this.consume(es6TokObj.DeleteTok)},
                        {alt: () => this.consume(es6TokObj.VoidTok)},
                        {alt: () => this.consume(es6TokObj.TypeOfTok)},
                        {alt: () => this.plusPlus()},
                        {alt: () => this.MinusMinus()},
                        {alt: () => this.consume(es6TokObj.Plus)},
                        {alt: () => this.consume(es6TokObj.Minus)},
                        {alt: () => this.consume(es6TokObj.Tilde)},
                        {alt: () => this.consume(es6TokObj.Exclamation)},
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
                    {alt: () => this.consume(es6TokObj.VerticalBarVerticalBar)},
                    {alt: () => this.consume(es6TokObj.AmpersandAmpersand)},
                    {alt: () => this.consume(es6TokObj.VerticalBar)},
                    {alt: () => this.consume(es6TokObj.Circumflex)},
                    {alt: () => this.consume(es6TokObj.Ampersand)},
                    {alt: () => this.AbsEqualityOperator()},
                    {alt: () => this.AbsRelationalOperator()},
                    {alt: () => this.consume(es6TokObj.InstanceOfTok)},
                    {alt: () => this.consume(es6TokObj.InTok)},
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
                {alt: () => this.consume(es6TokObj.Eq)},
                {alt: () => this.consume(es6TokObj.PlusEq)},
                {alt: () => this.consume(es6TokObj.AmpersandAmpersand)},
                {alt: () => this.consume(es6TokObj.VerticalBar)},
                {alt: () => this.consume(es6TokObj.Circumflex)},
                {alt: () => this.consume(es6TokObj.Ampersand)},
                {alt: () => this.AbsEqualityOperator()},
                {alt: () => this.AbsRelationalOperator()},
                {alt: () => this.consume(es6TokObj.InstanceOfTok)},
                {alt: () => this.consume(es6TokObj.InTok)},
                {alt: () => this.AbsShiftOperator()},
                {alt: () => this.AbsMultiplicativeOperator()},
                {alt: () => this.AbsAdditiveOperator()},
            ])
    }


    @SubhutiRule
    AbsEqualityOperator() {
        this.or(
            [
                {alt: () => this.consume(es6TokObj.EqEq)},
                {alt: () => this.consume(es6TokObj.NotEq)},
                {alt: () => this.consume(es6TokObj.EqEq)},
                {alt: () => this.consume(es6TokObj.NotEqEq)},
            ])
    }

    @SubhutiRule
    AbsRelationalOperator() {
        this.or(
            [
                {alt: () => this.consume(es6TokObj.Less)},
                {alt: () => this.consume(es6TokObj.Greater)},
                {alt: () => this.consume(es6TokObj.LessEq)},
                {alt: () => this.consume(es6TokObj.GreaterEq)},
            ])
    }


    @SubhutiRule
    AbsShiftOperator() {
        this.or(
            [
                {alt: () => this.consume(es6TokObj.LessLess)},
                {alt: () => this.consume(es6TokObj.MoreMore)},
                {alt: () => this.consume(es6TokObj.MoreMoreMore)},
            ])
    }


    @SubhutiRule
    AbsMultiplicativeOperator() {
        this.or(
            [
                {alt: () => this.consume(es6TokObj.Asterisk)},
                {alt: () => this.consume(es6TokObj.Slash)},
                {alt: () => this.consume(es6TokObj.Percent)},
            ])
    }


    @SubhutiRule
    AbsAdditiveOperator() {
        this.or(
            [
                {alt: () => this.consume(es6TokObj.Plus)},
                {alt: () => this.consume(es6TokObj.Minus)},
            ])
    }


    @SubhutiRule
    binaryExpressionNoIn() {
        this.unaryExpression();
        this.MANY(() => {
            this.or(
                [
                    {alt: () => this.AbsAssignmentOperator()},
                    {alt: () => this.consume(es6TokObj.VerticalBarVerticalBar)},
                    {alt: () => this.consume(es6TokObj.AmpersandAmpersand)},
                    {alt: () => this.consume(es6TokObj.VerticalBar)},
                    {alt: () => this.consume(es6TokObj.Circumflex)},
                    {alt: () => this.consume(es6TokObj.Ampersand)},
                    {alt: () => this.AbsEqualityOperator()},
                    {alt: () => this.AbsRelationalOperator()},
                    {alt: () => this.consume(es6TokObj.InstanceOfTok)},
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
            this.consume(es6TokObj.Question);
            this.assignmentExpression();
            this.consume(es6TokObj.Colon);
            this.assignmentExpression();
        });
    }


    @SubhutiRule
    assignmentExpressionNoIn() {
        this.binaryExpressionNoIn();
        this.OPTION(() => {
            this.consume(es6TokObj.Question);
            this.assignmentExpression();
            this.consume(es6TokObj.Colon);
            this.assignmentExpressionNoIn();
        });
    }


    @SubhutiRule
    expression() {
        this.assignmentExpression();
        this.MANY(() => {
            this.consume(es6TokObj.Comma);
            this.assignmentExpression();
        });
    }


    @SubhutiRule
    expressionNoIn() {
        this.assignmentExpressionNoIn();
        this.MANY(() => {
            this.consume(es6TokObj.Comma);
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
        this.consume(es6TokObj.LCurly);
        this.OPTION(() => {
            this.statementList();
        });
        this.consume(es6TokObj.RCurly);
    }


    @SubhutiRule
    statementList() {
        this.AT_LEAST_ONE(() => {
            this.statement();
        });
    }


    @SubhutiRule
    variableStatement() {
        this.consume(es6TokObj.VarTok);
        this.variableDeclarationList();
        this.consume(es6TokObj.Semicolon);
    }


    @SubhutiRule
    variableDeclarationList() {
        this.variableDeclaration();
        this.MANY(() => {
            this.consume(es6TokObj.Comma);
            this.variableDeclaration();
        });
    }


    @SubhutiRule
    variableDeclarationListNoIn() {
        let numOfVars = 1;
        this.variableDeclarationNoIn();
        this.MANY(() => {
            this.consume(es6TokObj.Comma);
            this.variableDeclarationNoIn();
            numOfVars++;
        });
        return numOfVars;
    }


    @SubhutiRule
    variableDeclaration() {
        this.consume(es6TokObj.Identifier);
        this.OPTION(() => {
            this.initialiser();
        });
    }


    @SubhutiRule
    variableDeclarationNoIn() {
        this.consume(es6TokObj.Identifier);
        this.OPTION(() => {
            this.initialiserNoIn();
        });
    }


    @SubhutiRule
    initialiser() {
        this.consume(es6TokObj.Eq);
        this.assignmentExpression();
    }


    @SubhutiRule
    initialiserNoIn() {
        this.consume(es6TokObj.Eq);
        this.assignmentExpressionNoIn();
    }


    @SubhutiRule
    emptyStatement() {
        this.consume(es6TokObj.Semicolon);
    }


    @SubhutiRule
    expressionStatement() {
        this.expression();
        this.consume(es6TokObj.Semicolon);
    }


    @SubhutiRule
    ifStatement() {
        this.consume(es6TokObj.IfTok);
        this.consume(es6TokObj.LParen);
        this.expression();
        this.consume(es6TokObj.RParen);
        this.statement();
        this.OPTION(() => {
            this.consume(es6TokObj.ElseTok);
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
        this.consume(es6TokObj.DoTok);
        this.statement();
        this.consume(es6TokObj.WhileTok);
        this.consume(es6TokObj.LParen);
        this.expression();
        this.consume(es6TokObj.RParen);
        this.consume(es6TokObj.Semicolon);
    }


    @SubhutiRule
    whileIteration() {
        this.consume(es6TokObj.WhileTok);
        this.consume(es6TokObj.LParen);
        this.expression();
        this.consume(es6TokObj.RParen);
        this.statement();
    }


    @SubhutiRule
    forIteration() {
        let inPossible = false;

        this.consume(es6TokObj.ForTok);
        this.consume(es6TokObj.LParen);
        this.or([
            {
                alt: () => {
                    this.consume(es6TokObj.VarTok);
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
        this.consume(es6TokObj.RParen);
        this.statement();
    }


    @SubhutiRule
    forHeaderParts(inPossible) {
        this.or([
            {
                alt: () => {
                    this.consume(es6TokObj.Semicolon);
                    this.OPTION(() => {
                        this.expression();
                    });
                    this.consume(es6TokObj.Semicolon);
                    this.OPTION(() => {
                        this.expression();
                    });
                },
            },
            {
                alt: () => {
                    this.consume(es6TokObj.InTok);
                    this.expression();
                },
            },
        ]);
    }


    @SubhutiRule
    continueStatement() {
        this.consume(es6TokObj.ContinueTok);
        this.OPTION({
            DEF: () => {
                this.consume(es6TokObj.Identifier);
            },
        });
        this.consume(es6TokObj.Semicolon);
    }


    @SubhutiRule
    breakStatement() {
        this.consume(es6TokObj.BreakTok);
        this.OPTION({
            DEF: () => {
                this.consume(es6TokObj.Identifier);
            },
        });
        this.consume(es6TokObj.Semicolon);
    }


    @SubhutiRule
    returnStatement() {
        this.consume(es6TokObj.ReturnTok);
        this.OPTION({
            DEF: () => {
                this.expression();
            },
        });
        this.consume(es6TokObj.Semicolon);
    }


    @SubhutiRule
    withStatement() {
        this.consume(es6TokObj.WithTok);
        this.consume(es6TokObj.LParen);
        this.expression();
        this.consume(es6TokObj.RParen);
        this.statement();
    }


    @SubhutiRule
    switchStatement() {
        this.consume(es6TokObj.SwitchTok);
        this.consume(es6TokObj.LParen);
        this.expression();
        this.consume(es6TokObj.RParen);
        this.caseBlock();
    }


    @SubhutiRule
    caseBlock() {
        this.consume(es6TokObj.LCurly);
        this.OPTION(() => {
            this.caseClauses();
        });
        this.OPTION(() => {
            this.defaultClause();
        });
        this.OPTION(() => {
            this.caseClauses();
        });
        this.consume(es6TokObj.RCurly);
    }


    @SubhutiRule
    caseClauses() {
        this.AT_LEAST_ONE(() => {
            this.caseClause();
        });
    }


    @SubhutiRule
    caseClause() {
        this.consume(es6TokObj.CaseTok);
        this.expression();
        this.consume(es6TokObj.Colon);
        this.OPTION(() => {
            this.statementList();
        });
    }


    @SubhutiRule
    defaultClause() {
        this.consume(es6TokObj.DefaultTok);
        this.consume(es6TokObj.Colon);
        this.OPTION(() => {
            this.statementList();
        });
    }


    @SubhutiRule
    labelledStatement() {
        this.consume(es6TokObj.Identifier);
        this.consume(es6TokObj.Colon);
        this.OPTION(() => {
            this.statement();
        });
    }


    @SubhutiRule
    throwStatement() {
        this.consume(es6TokObj.ThrowTok);
        /*if (this.lineTerminatorHere()) {
            this.SAVE_ERRor(
                new MismatchedTokenenException(
                    "Line Terminator not allowed before Expression in Throw Statement",
                ),
            );
        }*/
        this.expression();
        this.consume(es6TokObj.Semicolon);
    }


    @SubhutiRule
    tryStatement() {
        this.consume(es6TokObj.TryTok);
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
        this.consume(es6TokObj.CatchTok);
        this.consume(es6TokObj.LParen);
        this.consume(es6TokObj.Identifier);
        this.consume(es6TokObj.RParen);
        this.block();
    }


    @SubhutiRule
    finally() {
        this.consume(es6TokObj.FinallyTok);
        this.block();
    }


    @SubhutiRule
    debuggerStatement() {
        this.consume(es6TokObj.DebuggerTok);
        this.consume(es6TokObj.Semicolon);
    }


    @SubhutiRule
    functionDeclaration() {
        this.consume(es6TokObj.FunctionTok);
        this.consume(es6TokObj.Identifier);
        this.consume(es6TokObj.LParen);
        this.OPTION(() => {
            this.formalParameterList();
        });
        this.consume(es6TokObj.RParen);
        this.consume(es6TokObj.LCurly);
        this.sourceElements();
        this.consume(es6TokObj.RCurly);
    }


    @SubhutiRule
    functionExpression() {
        this.consume(es6TokObj.FunctionTok);
        this.OPTION(() => {
            this.consume(es6TokObj.Identifier);
        });
        this.consume(es6TokObj.LParen);
        this.OPTION(() => {
            this.formalParameterList();
        });
        this.consume(es6TokObj.RParen);
        this.consume(es6TokObj.LCurly);
        this.sourceElements();
        this.consume(es6TokObj.RCurly);
    }


    @SubhutiRule
    formalParameterList() {
        this.consume(es6TokObj.Identifier);
        this.MANY(() => {
            this.consume(es6TokObj.Comma);
            this.consume(es6TokObj.Identifier);
        });
    }


    @SubhutiRule
    program() {
        this.sourceElements();
        return this.getCurCst()
    }


    @SubhutiRule
    sourceElements() {
        this.MANY(() => {
            this.or([
                {
                    alt: () => this.functionDeclaration(),

                },
                {alt: () => this.statement()},
            ]);
        });
    }
}
