import SubhutiParser from "../subhuti/SubhutiParser";
import {es6TokObj} from "./Es5Tokens";

export class Es5Parser extends SubhutiParser {
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

    parenthesisExpression() {
        this.consume(es6TokObj.LParen);
        this.expression();
        this.consume(es6TokObj.RParen);
    }

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

    elementList() {
        this.assignmentExpression();
        this.MANY(() => {
            this.elision();
            this.assignmentExpression();
        });
    }

    elision() {
        this.AT_LEAST_ONE(() => {
            this.consume(es6TokObj.Comma);
        });
    }

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

    propertyAssignment() {
        this.or([
            {alt: () => this.regularPropertyAssignment()},
            {alt: () => this.getPropertyAssignment()},
            {alt: () => this.setPropertyAssignment()},
        ]);
    }

    regularPropertyAssignment() {
        this.propertyName();
        this.consume(es6TokObj.Colon);
        this.assignmentExpression();
    }

    getPropertyAssignment() {
        this.consume(es6TokObj.GetTok);
        this.propertyName();
        this.consume(es6TokObj.LParen);
        this.consume(es6TokObj.RParen);
        this.consume(es6TokObj.LCurly);
        this.sourceElements();
        this.consume(es6TokObj.RCurly);
    }

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

    propertyName() {
        this.or([
            {alt: () => this.consume(es6TokObj.Identifier)},
            {alt: () => this.consume(es6TokObj.Identifier)},
            {alt: () => this.consume(es6TokObj.StringLiteral)},
            {alt: () => this.consume(es6TokObj.NumericLiteral)},
        ]);


    }

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

    boxMemberExpression() {
        this.consume(es6TokObj.LBracket);
        this.expression();
        this.consume(es6TokObj.RBracket);
    }

    dotMemberExpression() {
        this.consume(es6TokObj.Dot);
        this.consume(es6TokObj.Identifier);
    }

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

    plusPlus() {
        this.consume(es6TokObj.Plus)
        this.consume(es6TokObj.Plus)
    }

    MinusMinus() {
        this.consume(es6TokObj.Minus)
        this.consume(es6TokObj.Minus)
    }

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


    AbsAssignmentOperator(){
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

    AbsEqualityOperator(){
        this.or(
            [
                {alt: () => this.consume(es6TokObj.EqEq)},
                {alt: () => this.consume(es6TokObj.NotEq)},
                {alt: () => this.consume(es6TokObj.EqEq)},
                {alt: () => this.consume(es6TokObj.NotEqEq)},
            ])
    }


    AbsRelationalOperator(){
        this.or(
            [
                {alt: () => this.consume(es6TokObj.Less)},
                {alt: () => this.consume(es6TokObj.Greater)},
                {alt: () => this.consume(es6TokObj.LessEq)},
                {alt: () => this.consume(es6TokObj.GreaterEq)},
            ])
    }

    AbsShiftOperator(){
        this.or(
            [
                {alt: () => this.consume(es6TokObj.LessLess)},
                {alt: () => this.consume(es6TokObj.MoreMore)},
                {alt: () => this.consume(es6TokObj.MoreMoreMore)},
            ])
    }

    AbsMultiplicativeOperator(){
        this.or(
            [
                {alt: () => this.consume(es6TokObj.Asterisk)},
                {alt: () => this.consume(es6TokObj.Slash)},
                {alt: () => this.consume(es6TokObj.Percent)},
            ])
    }

    AbsAdditiveOperator(){
        this.or(
            [
                {alt: () => this.consume(es6TokObj.Plus)},
                {alt: () => this.consume(es6TokObj.Minus)},
            ])
    }

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

    assignmentExpression() {
        this.binaryExpression();
        this.OPTION(() => {
            this.consume(es6TokObj.Question);
            this.assignmentExpression();
            this.consume(es6TokObj.Colon);
            this.assignmentExpression();
        });
    }

    assignmentExpressionNoIn() {
        this.binaryExpressionNoIn();
        this.OPTION(() => {
            this.consume(es6TokObj.Question);
            this.assignmentExpression();
            this.consume(es6TokObj.Colon);
            this.assignmentExpressionNoIn();
        });
    }

    expression() {
        this.assignmentExpression();
        this.MANY(() => {
            this.consume(es6TokObj.Comma);
            this.assignmentExpression();
        });
    }

    expressionNoIn() {
        this.assignmentExpressionNoIn();
        this.MANY(() => {
            this.consume(es6TokObj.Comma);
            this.assignmentExpressionNoIn();
        });
    }

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

    block() {
        this.consume(es6TokObj.LCurly);
        this.OPTION(() => {
            this.statementList();
        });
        this.consume(es6TokObj.RCurly);
    }

    statementList() {
        this.AT_LEAST_ONE(() => {
            this.statement();
        });
    }

    variableStatement() {
        this.consume(es6TokObj.VarTok);
        this.variableDeclarationList();
        this.consume(es6TokObj.Semicolon);
    }

    variableDeclarationList() {
        this.variableDeclaration();
        this.MANY(() => {
            this.consume(es6TokObj.Comma);
            this.variableDeclaration();
        });
    }

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

    variableDeclaration() {
        this.consume(es6TokObj.Identifier);
        this.OPTION(() => {
            this.initialiser();
        });
    }

    variableDeclarationNoIn() {
        this.consume(es6TokObj.Identifier);
        this.OPTION(() => {
            this.initialiserNoIn();
        });
    }

    initialiser() {
        this.consume(es6TokObj.Eq);
        this.assignmentExpression();
    }

    initialiserNoIn() {
        this.consume(es6TokObj.Eq);
        this.assignmentExpressionNoIn();
    }

    emptyStatement() {
        this.consume(es6TokObj.Semicolon);
    }

    expressionStatement() {
        this.expression();
        this.consume(es6TokObj.Semicolon);
    }

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

    iterationStatement() {
        this.or([
            {alt: () => this.doIteration()},
            {alt: () => this.whileIteration()},
            {alt: () => this.forIteration()},
        ]);
    }

    doIteration() {
        this.consume(es6TokObj.DoTok);
        this.statement();
        this.consume(es6TokObj.WhileTok);
        this.consume(es6TokObj.LParen);
        this.expression();
        this.consume(es6TokObj.RParen);
        this.consume(es6TokObj.Semicolon);
    }

    whileIteration() {
        this.consume(es6TokObj.WhileTok);
        this.consume(es6TokObj.LParen);
        this.expression();
        this.consume(es6TokObj.RParen);
        this.statement();
    }

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

    continueStatement() {
        this.consume(es6TokObj.ContinueTok);
        this.OPTION({
            DEF: () => {
                this.consume(es6TokObj.Identifier);
            },
        });
        this.consume(es6TokObj.Semicolon);
    }

    breakStatement() {
        this.consume(es6TokObj.BreakTok);
        this.OPTION({
            DEF: () => {
                this.consume(es6TokObj.Identifier);
            },
        });
        this.consume(es6TokObj.Semicolon);
    }

    returnStatement() {
        this.consume(es6TokObj.ReturnTok);
        this.OPTION({
            DEF: () => {
                this.expression();
            },
        });
        this.consume(es6TokObj.Semicolon);
    }

    withStatement() {
        this.consume(es6TokObj.WithTok);
        this.consume(es6TokObj.LParen);
        this.expression();
        this.consume(es6TokObj.RParen);
        this.statement();
    }

    switchStatement() {
        this.consume(es6TokObj.SwitchTok);
        this.consume(es6TokObj.LParen);
        this.expression();
        this.consume(es6TokObj.RParen);
        this.caseBlock();
    }

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

    caseClauses() {
        this.AT_LEAST_ONE(() => {
            this.caseClause();
        });
    }

    caseClause() {
        this.consume(es6TokObj.CaseTok);
        this.expression();
        this.consume(es6TokObj.Colon);
        this.OPTION(() => {
            this.statementList();
        });
    }

    defaultClause() {
        this.consume(es6TokObj.DefaultTok);
        this.consume(es6TokObj.Colon);
        this.OPTION(() => {
            this.statementList();
        });
    }

    labelledStatement() {
        this.consume(es6TokObj.Identifier);
        this.consume(es6TokObj.Colon);
        this.OPTION(() => {
            this.statement();
        });
    }

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

    catch() {
        this.consume(es6TokObj.CatchTok);
        this.consume(es6TokObj.LParen);
        this.consume(es6TokObj.Identifier);
        this.consume(es6TokObj.RParen);
        this.block();
    }

    finally() {
        this.consume(es6TokObj.FinallyTok);
        this.block();
    }

    debuggerStatement() {
        this.consume(es6TokObj.DebuggerTok);
        this.consume(es6TokObj.Semicolon);
    }

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

    formalParameterList() {
        this.consume(es6TokObj.Identifier);
        this.MANY(() => {
            this.consume(es6TokObj.Comma);
            this.consume(es6TokObj.Identifier);
        });
    }

    program() {
        this.sourceElements();
    }

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
