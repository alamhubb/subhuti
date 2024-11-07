import type SubhutiCst from "../struct/SubhutiCst.ts";
import Es6TokenConsumer, {Es6TokenName, es6TokensObj} from "../syntax/es6/Es6Tokens.ts";
import Es6Parser from "../syntax/es6/Es6Parser.ts";
import type {
    AssignmentExpression,
    AssignmentOperator,
    BlockStatement,
    CallExpression,
    ClassBody,
    ClassDeclaration,
    Comment,
    ConditionalExpression,
    Declaration,
    Directive,
    ExportDeclaration,
    Expression,
    ExpressionMap,
    ExpressionStatement,
    FunctionExpression,
    Identifier,
    Literal,
    MemberExpression,
    MethodDefinition,
    ModuleDeclaration,
    Node,
    NodeMap,
    Pattern,
    Program,
    PropertyDefinition, SourceLocation,
    Statement,
    StaticBlock, SubhutiTokenAst,
    VariableDeclaration,
    VariableDeclarator
} from "../struct/SubhutiEs6Ast.ts";
import {SubhutiRule} from "./SubhutiParser.ts";


export const esTreeAstType = {
    ExportNamedDeclaration: 'ExportNamedDeclaration'
}

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
        const astName = checkCstName(cst, Es6TokenConsumer.prototype.Identifier.name);
        const ast: Identifier = {
            type: astName as any,
            name: cst.value,
            loc: cst.loc
        }
        return ast
    }

    createProgramAst(cst: SubhutiCst): Program {
        const astName = checkCstName(cst, Es6Parser.prototype.Program.name);
        const first = cst.children[0]
        const map = {
            [Es6Parser.prototype.StatementList.name]: "script",
            [Es6Parser.prototype.ModuleItemList.name]: "module",
        }
        let sourceType = map[first.name]
        if (!sourceType) {
            throwNewError()
        }
        let body: Array<Directive | Statement | ModuleDeclaration>
        if (first.name === Es6Parser.prototype.ModuleItemList.name) {
            body = this.createModuleItemListAst(first)
        } else {
            body = this.createStatementListAst(first)
        }
        const ast: Program = {
            type: astName as any,
            sourceType: sourceType as any,
            body: body,
            loc: cst.loc
        }
        return ast
    }

    createModuleItemListAst(cst: SubhutiCst): ModuleDeclaration[] {
        //直接返回声明
        //                 this.Statement()
        //                 this.Declaration()
        const astName = checkCstName(cst, Es6Parser.prototype.ModuleItemList.name);
        const asts = cst.children.map(item => {
            if (item.name === Es6Parser.prototype.ImportDeclaration.name) {
            } else if (item.name === Es6Parser.prototype.ExportDeclaration.name) {
                return this.createExportDeclarationAst(item)
            } else if (item.name === Es6Parser.prototype.ImportDeclaration.name) {

            }
        })
        return asts
    }

    createStatementListAst(cst: SubhutiCst): Array<Directive | Statement | ModuleDeclaration> {
        const astName = checkCstName(cst, Es6Parser.prototype.StatementList.name);
        return cst.children.map(item => this.createStatementListItemAst(item)).flat()
    }

    createStatementListItemAst(cst: SubhutiCst): Array<Directive | Statement | ModuleDeclaration> {
        const astName = checkCstName(cst, Es6Parser.prototype.StatementListItem.name);
        return cst.children.map(item => this.createStatementAst(item)).flat()
    }

    createStatementAst(cst: SubhutiCst): Array<Directive | Statement | ModuleDeclaration> {
        const astName = checkCstName(cst, Es6Parser.prototype.Statement.name);
        const statements: Declaration[] = cst.children.map(item => this.createVariableDeclarationAst(item))
        return statements
    }


    createExportDeclarationAst(cst: SubhutiCst): ExportDeclaration {
        let astName = checkCstName(cst, Es6Parser.prototype.ExportDeclaration.name);
        const {children} = cst;
        const [exportToken, secondChild, thirdChild] = children;

        // 判断是否有 default 关键字
        const hasDefault = children.length > 2;

        return {
            type: astName as any,
            export: this.createSubhutiTokenAst(exportToken),
            default: hasDefault ? this.createSubhutiTokenAst(secondChild) : null,
            declaration: this.createClassDeclarationAst(hasDefault ? thirdChild : secondChild),
            loc: cst.loc
        };
    }

    createSubhutiTokenAst(cst: SubhutiCst): SubhutiTokenAst {
        return {
            type: cst.value,
            loc: cst.loc
        }
    }

    createClassDeclarationAst(cst: SubhutiCst): ClassDeclaration {
        const astName = checkCstName(cst, Es6Parser.prototype.ClassDeclaration.name);
        const ast: ClassDeclaration = {
            type: astName as any,
            class: this.createSubhutiTokenAst(cst.children[0]),
            id: this.createIdentifierAst(cst.children[1].children[0]),
            body: this.createClassBodyAst(cst.children[2].children[1]),
            loc: cst.loc
        }
        return ast
    }

    createClassBodyItemAst(staticCst: SubhutiCst, cst: SubhutiCst): MethodDefinition | PropertyDefinition {
        if (cst.name === Es6Parser.prototype.MethodDefinition.name) {
            return this.createMethodDefinitionAst(staticCst, cst)
        } else if (cst.name === Es6Parser.prototype.PropertyDefinition.name) {
            // return this.createExportDeclarationAst(item)
        }
    }

    createClassBodyAst(cst: SubhutiCst): ClassBody {
        const astName = checkCstName(cst, Es6Parser.prototype.ClassBody.name);
        //ClassBody.ClassElementList
        const body: Array<MethodDefinition | PropertyDefinition> = cst.children[0].children.map(item => {
                const astName = checkCstName(item, Es6Parser.prototype.ClassElement.name);
                if (item.children.length > 1) {
                    return this.createClassBodyItemAst(item.children[0], item.children[1])
                } else {
                    return this.createClassBodyItemAst(null, item.children[0])
                }
            }
        )
        const ast: ClassBody = {
            type: astName as any,
            body: body,
            loc: cst.loc
        }
        return ast
    }

    createMethodDefinitionAst(staticCst: SubhutiCst, cst: SubhutiCst): MethodDefinition {
        const astName = checkCstName(cst, Es6Parser.prototype.MethodDefinition.name);
        const ast: MethodDefinition = {
            type: astName as any,
            kind: 'method',
            static: this.createSubhutiTokenAst(staticCst),
            computed: false,
            key: this.createIdentifierAst(cst.children[0].children[0].children[0]),
            value: this.createFunctionExpressionAst(cst.children[2], cst.children[5]),
            loc: cst.loc
        } as any
        return ast
    }

    createFunctionExpressionAst(cstParams: SubhutiCst, cst: SubhutiCst): FunctionExpression {
        const astName = checkCstName(cst, Es6Parser.prototype.FunctionBody.name);
        const params = this.createFormalParametersAst(cstParams)
        const ast: FunctionExpression = {
            type: Es6Parser.prototype.FunctionExpression.name as any,
            id: null,
            params: params,
            body: this.createBlockStatementAst(cst.children[0]),
            generator: false,
            expression: false,
            async: false,
            loc: cst.loc
        } as any
        return ast
    }

    createFormalParametersAst(cst: SubhutiCst): Pattern[] {
        const astName = checkCstName(cst, Es6Parser.prototype.FormalParameters.name);
        // FormalParameterList.FormalsList
        const params = cst.children[0].children[0].children.filter(item => item.name === Es6Parser.prototype.FormalParameter.name).map(item => {
            return this.createIdentifierAst(item.children[0].children[0].children[0].children[0])
        })
        return params
    }


    createBlockStatementAst(cst: SubhutiCst): BlockStatement {
        const astName = checkCstName(cst, Es6Parser.prototype.StatementList.name);
        const ast: BlockStatement = {
            type: Es6Parser.prototype.BlockStatement.name as any,
            body: cst.children[0].children.map(item =>
                this.createExpressionStatementAst(item.children[0])
            ) as any,
            loc: cst.loc
        }
        return ast
    }

    createExpressionStatementAst(cst: SubhutiCst): ExpressionStatement {
        const astName = checkCstName(cst, Es6Parser.prototype.ExpressionStatement.name);
        const ast: ExpressionStatement = {
            type: astName as any,
            expression: this.createAssignmentExpressionAst(cst.children[0].children[0]),
            loc: cst.loc
        } as any
        return ast
    }

    createCallExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.CallExpression.name);
        if (cst.children.length > 1) {
            const argumentsCst = cst.children[1]
            const ArgumentListCst = argumentsCst.children[1]

            const argumentsAst: any[] = ArgumentListCst.children.map(item => this.createAssignmentExpressionAst(item)) as any[]

            const ast: CallExpression = {
                type: astName as any,
                callee: this.createMemberExpressionAst(cst.children[0]),
                arguments: argumentsAst,
                optional: false,
                loc: cst.loc
            } as any
            return ast
        }
        return this.createExpressionAst(cst.children[0])
    }


    createMemberExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.MemberExpression.name);
        if (cst.children.length > 1) {
            const ast: MemberExpression = {
                type: astName as any,
                object: this.createIdentifierAst(cst.children[0].children[0].children[0]),
                property: this.createIdentifierAst(cst.children[2]),
                computed: false,
                optional: false,
                loc: cst.loc
            } as any
            return ast
        }
        return this.createExpressionAst(cst.children[0])
    }

    createVariableDeclarationAst(cst: SubhutiCst): VariableDeclaration {
        //直接返回声明
        //                 this.Statement()
        //                 this.Declaration()
        const astName = checkCstName(cst, Es6Parser.prototype.VariableDeclaration.name);
        const ast: VariableDeclaration = {
            type: astName as any,
            declarations: cst.children[1].children.map(item => this.createVariableDeclaratorAst(item)) as any[],
            kind: this.createSubhutiTokenAst(cst.children[0].children[0]),
            loc: cst.loc
        }
        return ast
    }

    createVariableDeclaratorAst(cst: SubhutiCst): VariableDeclarator {
        const astName = checkCstName(cst, Es6Parser.prototype.VariableDeclarator.name);
        const ast: VariableDeclarator = {
            type: astName as any,
            id: this.createIdentifierAst(cst.children[0].children[0]) as any,
            init: this.createAssignmentExpressionAst(cst.children[1].children[1]) as any,
            loc: cst.loc
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

    createPrimaryExpressionAst(cst: SubhutiCst): Expression {
        const astName = checkCstName(cst, Es6Parser.prototype.PrimaryExpression.name);
        const first = cst.children[0]
        if (first.name === Es6Parser.prototype.IdentifierReference.name) {
            return this.createIdentifierAst(first.children[0])
        } else if (first.name === Es6Parser.prototype.Literal.name) {
            return this.createLiteralAst(first)
        }
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
            right: right,
            loc: cst.loc
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
            loc: cst.loc
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
