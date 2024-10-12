import SubhutiParser from "../subhuti/SubhutiParser";
import {es6TokenObj} from "./Es5Tokens";

export class ECMAScript5Parser extends SubhutiParser {
    set orgText(newText) {
        this._orgText = newText;
    }

    constructor() {
        super(t, {
            maxLookahead: 2,
        });

        this.consume = super.consume;
        this.consume = super.consume;

        this._orgText = "";

        this.c1 = undefined;
        this.c2 = undefined;
        this.c3 = undefined;
        this.c4 = undefined;
        this.c5 = undefined;

        this.performSelfAnalysis();


// Link: https://www.ecma-international.org/ecma-262/5.1/#sec-7.8
        export const AbsLiteral = createToken({ name: "AbsLiteral" });

        export const NullTok = createToken({
            name: "NullTok",
            categories: [AbsLiteral],
        });

        export const AbsBooleanLiteral = createToken({
            name: "AbsBooleanLiteral",
            categories: AbsLiteral,
        });

        export const NumericLiteral = createToken({
            name: "NumericLiteral",
            categories: AbsLiteral,
        });

        export const StringLiteral = createToken({
            name: "StringLiteral",
            categories: AbsLiteral,
        });

        export const RegularExpressionLiteral = createToken({
            name: "RegularExpressionLiteral",
            categories: AbsLiteral,
        });
    }

    primaryExpression() {
        this.or(
            this.c5 ||
            (this.c5 = [
                { ALT: () => this.consume(es6TokenObj.ThisToken) },
                { ALT: () => this.consume(es6TokenObj.Identifier) },
                { ALT: () => this.consume(es6TokenObj.AbsLiteral) },
                { ALT: () => this.arrayLiteral() },
                { ALT: () => this.objectLiteral() },
                { ALT: () => this.parenthesisExpression() },
            ]),
        );
    }

    parenthesisExpression() {
        this.consume(es6TokenObj.LParen);
        this.expression();
        this.consume(es6TokenObj.RParen);
    }

    arrayLiteral() {
        this.consume(es6TokenObj.LBracket);
        this.MANY(() => {
            this.or([
                { ALT: () => this.elementList() },
                { ALT: () => this.elision() },
            ]);
        });
        this.consume(es6TokenObj.RBracket);
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
            this.consume(es6TokenObj.Comma);
        });
    }

    objectLiteral() {
        this.consume(es6TokenObj.LCurly);
        this.OPTION(() => {
            this.propertyAssignment();
            this.MANY(() => {
                this.consume(es6TokenObj.Comma);
                this.propertyAssignment();
            });
            this.OPTION2(() => {
                this.consume(es6TokenObj.Comma);
            });
        });
        this.consume(es6TokenObj.RCurly);
    }

    propertyAssignment() {
        this.or([
            { ALT: () => this.regularPropertyAssignment() },
            { ALT: () => this.getPropertyAssignment() },
            { ALT: () => this.setPropertyAssignment() },
        ]);
    }

    regularPropertyAssignment() {
        this.propertyName();
        this.consume(es6TokenObj.Colon);
        this.assignmentExpression();
    }

    getPropertyAssignment() {
        this.consume(es6TokenObj.GetToken);
        this.propertyName();
        this.consume(es6TokenObj.LParen);
        this.consume(es6TokenObj.RParen);
        this.consume(es6TokenObj.LCurly);
        this.sourceElements();
        this.consume(es6TokenObj.RCurly);
    }

    setPropertyAssignment() {
        this.consume(es6TokenObj.SetToken);
        this.propertyName();
        this.consume(es6TokenObj.LParen);
        this.consume(es6TokenObj.Identifier);
        this.consume(es6TokenObj.RParen);
        this.consume(es6TokenObj.LCurly);
        this.sourceElements();
        this.consume(es6TokenObj.RCurly);
    }

    propertyName() {
        this.or([
            { ALT: () => this.consume(es6TokenObj.IdentifierName) },
            { ALT: () => this.consume(es6TokenObj.IdentifierName) },
            { ALT: () => this.consume(es6TokenObj.StringLiteral) },
            { ALT: () => this.consume(es6TokenObj.NumericLiteral) },
        ]);


    }

    memberCallNewExpression() {
        this.MANY(() => {
            this.consume(es6TokenObj.NewToken);
        });

        this.or([
            { ALT: () => this.primaryExpression() },
            { ALT: () => this.functionExpression() },
        ]);

        this.MANY2(() => {
            this.or2([
                { ALT: () => this.boxMemberExpression() },
                { ALT: () => this.dotMemberExpression() },
                { ALT: () => this.arguments() },
            ]);
        });
    }

    boxMemberExpression() {
        this.consume(es6TokenObj.LBracket);
        this.expression();
        this.consume(es6TokenObj.RBracket);
    }

    dotMemberExpression() {
        this.consume(es6TokenObj.Dot);
        this.consume(es6TokenObj.IdentifierName);
    }

    arguments() {
        this.consume(es6TokenObj.LParen);
        this.OPTION(() => {
            this.assignmentExpression();
            this.MANY(() => {
                this.consume(es6TokenObj.Comma);
                this.assignmentExpression();
            });
        });
        this.consume(es6TokenObj.RParen);
    }

    postfixExpression() {
        this.memberCallNewExpression();
        this.OPTION({
            GATE: this.noLineTerminatorHere,
            DEF: () => {
                this.or([
                    { ALT: () => this.consume(es6TokenObj.PlusPlus) },
                    { ALT: () => this.consume(es6TokenObj.MinusMinus) },
                ]);
            },
        });
    }

    unaryExpression() {
        this.or([
            { ALT: () => this.postfixExpression() },
            {
                ALT: () => {
                    this.or2(
                        this.c1 ||
                        (this.c1 = [
                            { ALT: () => this.consume(es6TokenObj.DeleteToken) },
                            { ALT: () => this.consume(es6TokenObj.VoidToken) },
                            { ALT: () => this.consume(es6TokenObj.TypeOfToken) },
                            { ALT: () => this.consume(es6TokenObj.PlusPlus) },
                            { ALT: () => this.consume(es6TokenObj.MinusMinus) },
                            { ALT: () => this.consume(es6TokenObj.Plus) },
                            { ALT: () => this.consume(es6TokenObj.Minus) },
                            { ALT: () => this.consume(es6TokenObj.Tilde) },
                            { ALT: () => this.consume(es6TokenObj.Exclamation) },
                        ]),
                    );
                    this.unaryExpression();
                },
            },
        ]);
    }

    binaryExpression() {
        this.unaryExpression();
        this.MANY(() => {
            this.or(
                this.c3 ||
                (this.c3 = [
                    { ALT: () => this.consume(es6TokenObj.AbsAssignmentOperator) },
                    { ALT: () => this.consume(es6TokenObj.VerticalBarVerticalBar) },
                    { ALT: () => this.consume(es6TokenObj.AmpersandAmpersand) },
                    { ALT: () => this.consume(es6TokenObj.VerticalBar) },
                    { ALT: () => this.consume(es6TokenObj.Circumflex) },
                    { ALT: () => this.consume(es6TokenObj.Ampersand) },
                    { ALT: () => this.consume(es6TokenObj.AbsEqualityOperator) },
                    { ALT: () => this.consume(es6TokenObj.AbsRelationalOperator) },
                    { ALT: () => this.consume(es6TokenObj.InstanceOfToken) },
                    { ALT: () => this.consume(es6TokenObj.InToken) },
                    { ALT: () => this.consume(es6TokenObj.AbsShiftOperator) },
                    { ALT: () => this.consume(es6TokenObj.AbsMultiplicativeOperator) },
                    { ALT: () => this.consume(es6TokenObj.AbsAdditiveOperator) },
                ]),
            );
            this.unaryExpression();
        });
    }

    binaryExpressionNoIn() {
        this.unaryExpression();
        this.MANY(() => {
            this.or(
                this.c4 ||
                (this.c4 = [
                    { ALT: () => this.consume(es6TokenObj.AbsAssignmentOperator) },
                    { ALT: () => this.consume(es6TokenObj.VerticalBarVerticalBar) },
                    { ALT: () => this.consume(es6TokenObj.AmpersandAmpersand) },
                    { ALT: () => this.consume(es6TokenObj.VerticalBar) },
                    { ALT: () => this.consume(es6TokenObj.Circumflex) },
                    { ALT: () => this.consume(es6TokenObj.Ampersand) },
                    { ALT: () => this.consume(es6TokenObj.AbsEqualityOperator) },
                    { ALT: () => this.consume(es6TokenObj.AbsRelationalOperator) },
                    { ALT: () => this.consume(es6TokenObj.InstanceOfToken) },
                    { ALT: () => this.consume(es6TokenObj.AbsShiftOperator) },
                    { ALT: () => this.consume(es6TokenObj.AbsMultiplicativeOperator) },
                    { ALT: () => this.consume(es6TokenObj.AbsAdditiveOperator) },
                ]),
            );
            this.unaryExpression();
        });
    }

    assignmentExpression() {
        this.binaryExpression();
        this.OPTION(() => {
            this.consume(es6TokenObj.Question);
            this.assignmentExpression();
            this.consume(es6TokenObj.Colon);
            this.assignmentExpression();
        });
    }

    assignmentExpressionNoIn() {
        this.binaryExpressionNoIn();
        this.OPTION(() => {
            this.consume(es6TokenObj.Question);
            this.assignmentExpression();
            this.consume(es6TokenObj.Colon);
            this.assignmentExpressionNoIn();
        });
    }

    expression() {
        this.assignmentExpression();
        this.MANY(() => {
            this.consume(es6TokenObj.Comma);
            this.assignmentExpression();
        });
    }

    expressionNoIn() {
        this.assignmentExpressionNoIn();
        this.MANY(() => {
            this.consume(es6TokenObj.Comma);
            this.assignmentExpressionNoIn();
        });
    }

    statement() {
        this.or(
            this.c2 ||
            (this.c2 = [
                { ALT: () => this.block() },
                { ALT: () => this.variableStatement() },
                { ALT: () => this.emptyStatement() },
                { ALT: () => this.labelledStatement() },
                {
                    ALT: () => this.expressionStatement(),
                    IGNorE_AMBIGUITIES: true,
                },
                { ALT: () => this.ifStatement() },
                { ALT: () => this.iterationStatement() },
                { ALT: () => this.continueStatement() },
                { ALT: () => this.breakStatement() },
                { ALT: () => this.returnStatement() },
                { ALT: () => this.withStatement() },
                { ALT: () => this.switchStatement() },
                { ALT: () => this.throwStatement() },
                { ALT: () => this.tryStatement() },
                { ALT: () => this.debuggerStatement() },
            ]),
        );
    }

    block() {
        this.consume(es6TokenObj.LCurly);
        this.OPTION(() => {
            this.statementList();
        });
        this.consume(es6TokenObj.RCurly);
    }

    statementList() {
        this.AT_LEAST_ONE(() => {
            this.statement();
        });
    }

    variableStatement() {
        this.consume(es6TokenObj.VarToken);
        this.variableDeclarationList();
        this.consume(es6TokenObj.Semicolon, ENABLE_SEMICOLON_INSERTION);
    }

    variableDeclarationList() {
        this.variableDeclaration();
        this.MANY(() => {
            this.consume(es6TokenObj.Comma);
            this.variableDeclaration();
        });
    }

    variableDeclarationListNoIn() {
        let numOfVars = 1;
        this.variableDeclarationNoIn();
        this.MANY(() => {
            this.consume(es6TokenObj.Comma);
            this.variableDeclarationNoIn();
            numOfVars++;
        });
        return numOfVars;
    }

    variableDeclaration() {
        this.consume(es6TokenObj.Identifier);
        this.OPTION(() => {
            this.initialiser();
        });
    }

    variableDeclarationNoIn() {
        this.consume(es6TokenObj.Identifier);
        this.OPTION(() => {
            this.initialiserNoIn();
        });
    }

    initialiser() {
        this.consume(es6TokenObj.Eq);
        this.assignmentExpression();
    }

    initialiserNoIn() {
        this.consume(es6TokenObj.Eq);
        this.assignmentExpressionNoIn();
    }

    emptyStatement() {
        this.consume(es6TokenObj.Semicolon, DISABLE_SEMICOLON_INSERTION);
    }

    expressionStatement() {
        this.expression();
        this.consume(es6TokenObj.Semicolon, ENABLE_SEMICOLON_INSERTION);
    }

    ifStatement() {
        this.consume(es6TokenObj.IfToken);
        this.consume(es6TokenObj.LParen);
        this.expression();
        this.consume(es6TokenObj.RParen);
        this.statement();
        this.OPTION(() => {
            this.consume(es6TokenObj.ElseToken);
            this.statement();
        });
    }

    iterationStatement() {
        this.or([
            { ALT: () => this.doIteration() },
            { ALT: () => this.whileIteration() },
            { ALT: () => this.forIteration() },
        ]);
    }

    doIteration() {
        this.consume(es6TokenObj.DoToken);
        this.statement();
        this.consume(es6TokenObj.WhileToken);
        this.consume(es6TokenObj.LParen);
        this.expression();
        this.consume(es6TokenObj.RParen);
        this.consume(es6TokenObj.Semicolon, ENABLE_SEMICOLON_INSERTION);
    }

    whileIteration() {
        this.consume(es6TokenObj.WhileToken);
        this.consume(es6TokenObj.LParen);
        this.expression();
        this.consume(es6TokenObj.RParen);
        this.statement();
    }

    forIteration() {
        let inPossible = false;

        this.consume(es6TokenObj.ForToken);
        this.consume(es6TokenObj.LParen);
        this.or([
            {
                ALT: () => {
                    this.consume(es6TokenObj.VarToken);
                    const numOfVars = this.variableDeclarationListNoIn();
                    inPossible = numOfVars === 1;
                    this.forHeaderParts(inPossible);
                },
            },
            {
                ALT: () => {
                    this.OPTION(() => {
                        const headerExp = this.expressionNoIn();
                        inPossible = this.canInComeAfterExp(headerExp);
                    });
                    this.forHeaderParts(inPossible);
                },
            },
        ]);
        this.consume(es6TokenObj.RParen);
        this.statement();
    }

    forHeaderParts(inPossible) {
        this.or([
            {
                ALT: () => {
                    this.consume(es6TokenObj.Semicolon, DISABLE_SEMICOLON_INSERTION);
                    this.OPTION(() => {
                        this.expression();
                    });
                    this.consume(es6TokenObj.Semicolon, DISABLE_SEMICOLON_INSERTION);
                    this.OPTION2(() => {
                        this.expression();
                    });
                },
            },
            {
                GATE: () => inPossible,
                ALT: () => {
                    this.consume(es6TokenObj.InToken);
                    this.expression();
                },
            },
        ]);
    }

    continueStatement() {
        this.consume(es6TokenObj.ContinueToken);
        this.OPTION({
            GATE: this.noLineTerminatorHere,
            DEF: () => {
                this.consume(es6TokenObj.Identifier);
            },
        });
        this.consume(es6TokenObj.Semicolon, ENABLE_SEMICOLON_INSERTION);
    }

    breakStatement() {
        this.consume(es6TokenObj.BreakToken);
        this.OPTION({
            GATE: this.noLineTerminatorHere,
            DEF: () => {
                this.consume(es6TokenObj.Identifier);
            },
        });
        this.consume(es6TokenObj.Semicolon, ENABLE_SEMICOLON_INSERTION);
    }

    returnStatement() {
        this.consume(es6TokenObj.ReturnToken);
        this.OPTION({
            GATE: this.noLineTerminatorHere,
            DEF: () => {
                this.expression();
            },
        });
        this.consume(es6TokenObj.Semicolon, ENABLE_SEMICOLON_INSERTION);
    }

    withStatement() {
        this.consume(es6TokenObj.WithToken);
        this.consume(es6TokenObj.LParen);
        this.expression();
        this.consume(es6TokenObj.RParen);
        this.statement();
    }

    switchStatement() {
        this.consume(es6TokenObj.SwitchToken);
        this.consume(es6TokenObj.LParen);
        this.expression();
        this.consume(es6TokenObj.RParen);
        this.caseBlock();
    }

    caseBlock() {
        this.consume(es6TokenObj.LCurly);
        this.OPTION(() => {
            this.caseClauses();
        });
        this.OPTION2(() => {
            this.defaultClause();
        });
        this.OPTION3(() => {
            this.caseClauses();
        });
        this.consume(es6TokenObj.RCurly);
    }

    caseClauses() {
        this.AT_LEAST_ONE(() => {
            this.caseClause();
        });
    }

    caseClause() {
        this.consume(es6TokenObj.CaseToken);
        this.expression();
        this.consume(es6TokenObj.Colon);
        this.OPTION(() => {
            this.statementList();
        });
    }

    defaultClause() {
        this.consume(es6TokenObj.DefaultToken);
        this.consume(es6TokenObj.Colon);
        this.OPTION(() => {
            this.statementList();
        });
    }

    labelledStatement() {
        this.consume(es6TokenObj.Identifier);
        this.consume(es6TokenObj.Colon);
        this.OPTION(() => {
            this.statement();
        });
    }

    throwStatement() {
        this.consume(es6TokenObj.ThrowToken);
        if (this.lineTerminatorHere()) {
            this.SAVE_ERRor(
                new MismatchedTokenenException(
                    "Line Terminator not allowed before Expression in Throw Statement",
                ),
            );
        }
        this.expression();
        this.consume(es6TokenObj.Semicolon, ENABLE_SEMICOLON_INSERTION);
    }

    tryStatement() {
        this.consume(es6TokenObj.TryToken);
        this.block();

        this.or([
            {
                ALT: () => {
                    this.catch();
                    this.OPTION(() => {
                        this.finally();
                    });
                },
            },
            { ALT: () => this.finally() },
        ]);
    }

    catch() {
        this.consume(es6TokenObj.CatchToken);
        this.consume(es6TokenObj.LParen);
        this.consume(es6TokenObj.Identifier);
        this.consume(es6TokenObj.RParen);
        this.block();
    }

    finally() {
        this.consume(es6TokenObj.FinallyToken);
        this.block();
    }

    debuggerStatement() {
        this.consume(es6TokenObj.DebuggerToken);
        this.consume(es6TokenObj.Semicolon, ENABLE_SEMICOLON_INSERTION);
    }

    functionDeclaration() {
        this.consume(es6TokenObj.FunctionToken);
        this.consume(es6TokenObj.Identifier);
        this.consume(es6TokenObj.LParen);
        this.OPTION(() => {
            this.formalParameterList();
        });
        this.consume(es6TokenObj.RParen);
        this.consume(es6TokenObj.LCurly);
        this.sourceElements();
        this.consume(es6TokenObj.RCurly);
    }

    functionExpression() {
        this.consume(es6TokenObj.FunctionToken);
        this.OPTION1(() => {
            this.consume(es6TokenObj.Identifier);
        });
        this.consume(es6TokenObj.LParen);
        this.OPTION2(() => {
            this.formalParameterList();
        });
        this.consume(es6TokenObj.RParen);
        this.consume(es6TokenObj.LCurly);
        this.sourceElements();
        this.consume(es6TokenObj.RCurly);
    }

    formalParameterList() {
        this.consume(es6TokenObj.Identifier);
        this.MANY(() => {
            this.consume(es6TokenObj.Comma);
            this.consume(es6TokenObj.Identifier);
        });
    }

    program() {
        this.sourceElements();
    }

    sourceElements() {
        this.MANY(() => {
            this.or([
                {
                    ALT: () => this.functionDeclaration(),
                    IGNorE_AMBIGUITIES: true,
                },
                { ALT: () => this.statement() },
            ]);
        });
    }
}

const insertedSemiColon = {
    tokenTypeIdx: es6TokenObj.Semicolon.tokenTypeIdx,
    image: ";",
    startOffset: NaN,
    endOffset: NaN,
    automaticallyInserted: true,
};
