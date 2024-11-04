import type SubhutiCst from "../struct/SubhutiCst.ts";
import {Es6TokenName} from "../syntax/es6/Es6Tokens.ts";
import Es6Parser from "../syntax/es6/Es6Parser.ts";
import type {
    AssignmentExpression, AssignmentOperator, CallExpression,
    Comment, ConditionalExpression,
    Directive, Expression, ExpressionMap,
    Identifier, MemberExpression,
    ModuleDeclaration,
    Node, NodeMap, Pattern,
    Program,
    Statement,
    VariableDeclaration, VariableDeclarator
} from "estree";
import {SubhutiRule} from "./SubhutiParser.ts";

export function checkCstName(cst: SubhutiCst, cstName: string) {
    if (cst.name !== cstName) {
        throwNewError()
    }
    return cstName
}

export function throwNewError(errorMsg: string = 'syntax error') {
    throw new Error(errorMsg)
}

export default class SubhutiToAstUtil {

    static createIdentifierAst(cst: SubhutiCst): Identifier {
        const astName = checkCstName(cst, Es6Parser.prototype.Identifier.name);
        const IdentifierName = cst.children[0]
        const ast: Identifier = {
            type: astName as any,
            name: IdentifierName.value
        }
        return ast
    }

    static createProgramAst(cst: SubhutiCst): Program {
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
            body: cst.children.map(item => SubhutiToAstUtil.createStatementAst(item)) as any[]
        }
        return ast
    }


    static createStatementAst(cst: SubhutiCst): NodeMap[keyof NodeMap] {

        //直接返回声明
        //                 this.Statement()
        //                 this.Declaration()
        const statementDetail = cst.children[0].children[0].children[0]
        console.log(cst)
        console.log(statementDetail)
        if (statementDetail.name === Es6Parser.prototype.VariableStatement.name) {
            return SubhutiToAstUtil.createVariableDeclarationAst(statementDetail)
        }
    }

    static createVariableDeclarationAst(cst: SubhutiCst): NodeMap[keyof NodeMap] {
        //直接返回声明
        //                 this.Statement()
        //                 this.Declaration()
        const astName = checkCstName(cst, Es6Parser.prototype.VariableStatement.name);
        const ast: VariableDeclaration = {
            type: astName as any,
            declarations: cst.children[1].children.map(item => SubhutiToAstUtil.createVariableDeclaratorAst(item)) as any[],
            kind: cst.children[0].children[0].value as any
        }
        return ast
    }

    static createVariableDeclaratorAst(cst: SubhutiCst): VariableDeclarator {
        const astName = checkCstName(cst, Es6Parser.prototype.VariableDeclarator.name);
        const ast: VariableDeclarator = {
            type: astName as any,
            id: cst.children[0].children[0] as any,
            init: SubhutiToAstUtil.createExpressionAst(cst.children[1]) as any,
        }
        return ast
    }

    static createImportOrExportDeclarationAst(cst: SubhutiCst): Node {
        const ast: Node = {
            type: astName as any,
            sourceType: sourceType as any,
            body: body as any
        }
        return ast
    }

    static createExpressionAst(cst: SubhutiCst): Expression {
        const astName = cst.name
        let left
        if (astName === Es6Parser.prototype.AssignmentExpression.name) {
            left = SubhutiToAstUtil.createAssignmentExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.ConditionalExpression.name) {
            left = SubhutiToAstUtil.createConditionalExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.LogicalORExpression.name) {
            left = SubhutiToAstUtil.createLogicalORExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.LogicalANDExpression.name) {
            left = SubhutiToAstUtil.createLogicalANDExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.BitwiseORExpression.name) {
            left = SubhutiToAstUtil.createBitwiseORExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.BitwiseXORExpression.name) {
            left = SubhutiToAstUtil.createBitwiseXORExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.BitwiseANDExpression.name) {
            left = SubhutiToAstUtil.createBitwiseANDExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.EqualityExpression.name) {
            left = SubhutiToAstUtil.createEqualityExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.RelationalExpression.name) {
            left = SubhutiToAstUtil.createRelationalExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.ShiftExpression.name) {
            left = SubhutiToAstUtil.createShiftExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.AdditiveExpression.name) {
            left = SubhutiToAstUtil.createAdditiveExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.MultiplicativeExpression.name) {
            left = SubhutiToAstUtil.createMultiplicativeExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.UnaryExpression.name) {
            left = SubhutiToAstUtil.createUnaryExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.PostfixExpression.name) {
            left = SubhutiToAstUtil.createPostfixExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.LeftHandSideExpression.name) {
            left = SubhutiToAstUtil.createLeftHandSideExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.CallExpression.name) {
            left = SubhutiToAstUtil.createCallExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.NewExpression.name) {
            left = SubhutiToAstUtil.createNewExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.MemberExpression.name) {
            left = SubhutiToAstUtil.createMemberExpressionAst(cst)
        } else if (astName === Es6Parser.prototype.PrimaryExpression.name) {
            left = SubhutiToAstUtil.createPrimaryExpressionAst(cst)
        }
        return left
    }

    static createLogicalORExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.LogicalORExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }

    static createLogicalANDExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.LogicalANDExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }

    static createBitwiseORExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.BitwiseORExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }

    static createBitwiseXORExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.BitwiseXORExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }

    static createBitwiseANDExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.BitwiseANDExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }

    static createEqualityExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.EqualityExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }

    static createRelationalExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.RelationalExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }

    static createShiftExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.ShiftExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }

    static createAdditiveExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.AdditiveExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }

    static createMultiplicativeExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.MultiplicativeExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }

    static createUnaryExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.UnaryExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }

    static createPostfixExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.PostfixExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }

    static createLeftHandSideExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.LeftHandSideExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }

    static createNewExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.NewExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }

    static createMemberExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.MemberExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }

    static createPrimaryExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.PrimaryExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }


    static createCallExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.CallExpression.name);
        if (cst.children.length > 1) {

        }
        return SubhutiToAstUtil.createExpressionAst(cst.children[0])
    }


    static createAssignmentExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.AssignmentExpression.name);
        let left
        let right
        if (cst.children.length === 1) {
            return SubhutiToAstUtil.createExpressionAst(cst.children[0])
        }
        const ast: AssignmentExpression = {
            type: astName as any,
            // operator: AssignmentOperator;
            left: left,
            right: right
        } as any
        return ast
    }

    static createConditionalExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.ConditionalExpression.name);
        const firstChild = cst.children[0]
        let test = SubhutiToAstUtil.createExpressionAst(firstChild)
        let alternate
        let consequent
        if (cst.children.length === 1) {
            const firstChild = cst.children[0]
            return SubhutiToAstUtil.createExpressionAst(firstChild)
        } else {
            alternate = SubhutiToAstUtil.createAssignmentExpressionAst(cst.children[1])
            consequent = SubhutiToAstUtil.createAssignmentExpressionAst(cst.children[2])
        }
        const ast: ConditionalExpression = {
            type: astName as any,
            test: test as any,
            alternate: alternate as any,
            consequent: consequent as any,
        } as any
        return ast
    }


    static createAssignmentOperatorAst(cst: SubhutiCst): AssignmentOperator {
        const astName = checkCstName(cst, Es6Parser.prototype.AssignmentOperator.name);
        const ast: AssignmentExpression = cst.children[0].value as any
        return ast as any
    }
}
