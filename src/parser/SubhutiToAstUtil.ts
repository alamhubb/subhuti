import type SubhutiCst from "../struct/SubhutiCst.ts";
import {Es6TokenName} from "../syntax/es6/Es6Tokens.ts";
import Es6Parser from "../syntax/es6/Es6Parser.ts";
import type {
    Comment,
    Directive,
    Identifier,
    ModuleDeclaration,
    Node,
    Program,
    Statement,
    VariableDeclaration, VariableDeclarator
} from "estree";

function checkCstName(cst: SubhutiCst, cstName: string) {
    if (cst.name !== cstName) {
        throwNewError()
    }
    return cstName
}

function throwNewError(errorMsg: string = 'syntax error') {
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
            body: cst.children as any[]
        }
        return ast
    }


    static createStatementAst(cst: SubhutiCst): Node {
        const ast: Node = {
            type: astName as any,
            sourceType: sourceType as any,
            body: body as any
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

    static createVariableDeclarationAst(cst: SubhutiCst): VariableDeclaration {
        const astName = checkCstName(cst, Es6Parser.prototype.VariableDeclaration.name);
        let kind = cst.children[0].name
        const ast: VariableDeclaration = {
            type: astName as any,
            declarations: cst.children[1].children as any[],
            kind: kind as any
        }
        return ast
    }

    static createVariableDeclaratorAst(cst: SubhutiCst): VariableDeclaration {
        const astName = checkCstName(cst, Es6Parser.prototype.VariableDeclaration.name);
        let kind = cst.children[0].name
        const ast: VariableDeclaration = {
            type: astName as any,
            declarations: cst.children[1].children as any[],
            kind: kind as any
        }
        return ast
    }
}
