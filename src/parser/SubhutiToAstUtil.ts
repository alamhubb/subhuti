import type SubhutiCst from "../struct/SubhutiCst.ts";
import Es6TokenConsumer, {Es6TokenName} from "../syntax/es6/Es6Tokens.ts";
import Es6Parser from "../syntax/es6/Es6Parser.ts";
import type {
    AssignmentExpression, AssignmentOperator, CallExpression,
    Comment, ConditionalExpression,
    Directive, Expression, ExpressionMap,
    Identifier, Literal, MemberExpression,
    ModuleDeclaration,
    Node, NodeMap, Pattern,
    Program,
    Statement,
    VariableDeclaration, VariableDeclarator
} from "estree";
import {SubhutiRule} from "./SubhutiParser.ts";

export function checkCstName(cst: SubhutiCst, cstName: string) {
    if (cst.name !== cstName) {
        throwNewError(cst.name)
    }
    return cstName
}

export function throwNewError(errorMsg: string = 'syntax error') {
    throw new Error(errorMsg)
}

export default class SubhutiToAstHandler {
    createIdentifierAst(cst: SubhutiCst): Identifier {
        const astName = checkCstName(cst, Es6Parser.prototype.Identifier.name);
        const IdentifierName = cst.children[0]
        const ast: Identifier = {
            type: astName as any,
            name: IdentifierName.value,
            loc: IdentifierName.loc
        }
        return ast
    }

    createProgramAst(cst: SubhutiCst): Program {
        const astName = checkCstName(cst, Es6Parser.prototype.Program.name);
        const body = cst.children[0]

        const map = {
            [Es6Parser.prototype.StatementList.name]: "script",
            [Es6Parser.prototype.ModuleItemList.name]: "module",
        }
        let sourceType = map[body.name]
        if (!sourceType) {
            throwNewError()
        }
        const ast: Program = {
            type: astName as any,
            sourceType: sourceType as any,
            body: cst.children.map(item => this.createStatementAst(item)) as any[]
        }
        return ast
    }


    createStatementAst(cst: SubhutiCst): NodeMap[keyof NodeMap] {

        //直接返回声明
        //                 this.Statement()
        //                 this.Declaration()
        const statementDetail = cst.children[0].children[0].children[0]
        if (statementDetail.name === Es6Parser.prototype.VariableDeclaration.name) {
            return this.createVariableDeclarationAst(statementDetail)
        }
    }

    createVariableDeclarationAst(cst: SubhutiCst): NodeMap[keyof NodeMap] {
        //直接返回声明
        //                 this.Statement()
        //                 this.Declaration()
        const astName = checkCstName(cst, Es6Parser.prototype.VariableDeclaration.name);
        const ast: VariableDeclaration = {
            type: astName as any,
            declarations: cst.children[1].children.map(item => this.createVariableDeclaratorAst(item)) as any[],
            kind: cst.children[0].children[0].value as any
        }
        return ast
    }

    createVariableDeclaratorAst(cst: SubhutiCst): VariableDeclarator {
        const astName = checkCstName(cst, Es6Parser.prototype.VariableDeclarator.name);
        const ast: VariableDeclarator = {
            type: astName as any,
            id: this.createIdentifierAst(cst.children[0].children[0]) as any,
            init: this.createAssignmentExpressionAst(cst.children[1].children[1]) as any,
        }
        return ast
    }

    createImportOrExportDeclarationAst(cst: SubhutiCst): Node {
        const ast: Node = {
            type: astName as any,
            sourceType: sourceType as any,
            body: body as any
        }
        return ast
    }

    createExpressionAst(cst: SubhutiCst): Expression {
        const astName = cst.name
        let left
        if (astName === Es6Parser.prototype.AssignmentExpression.name) {
            left = this.createAssignmentExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.ConditionalExpression.name) {
            left = this.createConditionalExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.LogicalORExpression.name) {
            left = this.createLogicalORExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.LogicalANDExpression.name) {
            left = this.createLogicalANDExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.BitwiseORExpression.name) {
            left = this.createBitwiseORExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.BitwiseXORExpression.name) {
            left = this.createBitwiseXORExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.BitwiseANDExpression.name) {
            left = this.createBitwiseANDExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.EqualityExpression.name) {
            left = this.createEqualityExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.RelationalExpression.name) {
            left = this.createRelationalExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.ShiftExpression.name) {
            left = this.createShiftExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.AdditiveExpression.name) {
            left = this.createAdditiveExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.MultiplicativeExpression.name) {
            left = this.createMultiplicativeExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.UnaryExpression.name) {
            left = this.createUnaryExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.PostfixExpression.name) {
            left = this.createPostfixExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.LeftHandSideExpression.name) {
            left = this.createLeftHandSideExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.CallExpression.name) {
            left = this.createCallExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.NewExpression.name) {
            left = this.createNewExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.MemberExpression.name) {
            left = this.createMemberExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.PrimaryExpression.name) {
            left = this.createPrimaryExpressionAst(cst)
        }
        return left
    }

    createLogicalORExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.LogicalORExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }

    createLogicalANDExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.LogicalANDExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }

    createBitwiseORExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.BitwiseORExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }

    createBitwiseXORExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.BitwiseXORExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }

    createBitwiseANDExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.BitwiseANDExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }

    createEqualityExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.EqualityExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }

    createRelationalExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.RelationalExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }

    createShiftExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.ShiftExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }

    createAdditiveExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.AdditiveExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }

    createMultiplicativeExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.MultiplicativeExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }

    createUnaryExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.UnaryExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }

    createPostfixExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.PostfixExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }

    createLeftHandSideExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.LeftHandSideExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }

    createNewExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.NewExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }

    createMemberExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.MemberExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }

    createPrimaryExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.PrimaryExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createLiteralAst(cst.children[0])
    }

    createLiteralAst(cst: SubhutiCst): Literal {
        const astName = checkCstName(cst, Es6Parser.prototype.Literal.name);
        const firstChild = cst.children[0]
        console.log(firstChild.name);
        let value
        if (firstChild.name === Es6TokenConsumer.prototype.NumericLiteral.name) {
            value = Number(firstChild.value)
        } else if (firstChild.name === Es6TokenConsumer.prototype.TrueTok.name) {
            value = true
        } else if (firstChild.name === Es6TokenConsumer.prototype.FalseTok.name) {
            value = false
        } else {
            value = firstChild.value
        }
        const ast: Literal = {
            type: astName as any,
            value: value,
            loc: firstChild.loc
        }
        return ast
    }


    createCallExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.CallExpression.name);
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }


    createAssignmentExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.AssignmentExpression.name);
        let left
        let right
        if (cst.children.length === 1) {
            return this.createExpressionAst(cst.children[0])
        }
        const ast: AssignmentExpression = {
            type: astName as any,
            // operator: AssignmentOperator;
            left: left,
            right: right
        } as any
        return ast
    }

    createConditionalExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.ConditionalExpression.name);
        const firstChild = cst.children[0]
        let test = this.createExpressionAst(firstChild)
        let alternate
        let consequent
        if (cst.children.length === 1) {
            return this.createExpressionAst(cst.children[0])
        } else {
            alternate = this.createAssignmentExpressionAst(cst.children[1])
            consequent = this.createAssignmentExpressionAst(cst.children[2])
        }
        const ast: ConditionalExpression = {
            type: astName as any,
            test: test as any,
            alternate: alternate as any,
            consequent: consequent as any,
        } as any
        return ast
    }


    createAssignmentOperatorAst(cst: SubhutiCst): AssignmentOperator {
        const astName = checkCstName(cst, Es6Parser.prototype.AssignmentOperator.name);
        const ast: AssignmentExpression = cst.children[0].value as any
        return ast as any
    }
}

export const SubhutiToAstUtil = new SubhutiToAstHandler()
