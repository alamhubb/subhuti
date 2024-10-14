import {Es5Parser} from "../es5/Es5Parser";
import {SubhutiRule} from "../subhuti/SubhutiParser";
import SubhutiMatchToken from "../subhuti/struct/SubhutiMatchToken";
import Es6TokenConsumer from "./Es6TokenConsume";

export default class Es6Parser<T extends Es6TokenConsumer = Es6TokenConsumer> extends Es5Parser<T> {
    constructor(tokens?: SubhutiMatchToken[]) {
        super(tokens)
        this.tokenConsumer = new Es6TokenConsumer(this) as T
        this.thisClassName = this.constructor.name;
    }

    @SubhutiRule
    Scripts() {
        this.Script()
        return this.getCurCst()
    }

    @SubhutiRule
    Script() {
        this.option(() => this.ScriptBody());
        return this.getCurCst()
    }

    @SubhutiRule
    ScriptBody() {
        this.StatementList()
        return this.getCurCst()
    }

    @SubhutiRule
    Module() {
        this.option(() => this.ModuleBody());
        return this.getCurCst()
    }

    @SubhutiRule
    ModuleBody() {
        this.ModuleItemList();
        return this.getCurCst()
    }

    @SubhutiRule
    ModuleItemList() {
        this.AT_LEAST_ONE(() => {
            this.ModuleItem();
        });
    }

    @SubhutiRule
    ModuleItem() {
        this.or([
            {alt: () => this.importDeclaration()},
            {alt: () => this.exportDeclaration()},
            {alt: () => this.StatementListItem()},
        ]);
    }

    @SubhutiRule
    importDeclaration() {
        this.or([
            {
                alt: () => {
                    this.tokenConsumer.ImportTok();
                    this.importClause();
                    this.fromClause();
                    this.tokenConsumer.Semicolon();
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.ImportTok();
                    this.moduleSpecifier();
                    this.tokenConsumer.Semicolon();
                }
            },
        ]);
    }

    @SubhutiRule
    importClause() {
        this.or([
            {alt: () => this.importedDefaultBinding()},
            {alt: () => this.namespaceImport()},
            {alt: () => this.namedImports()},
            {
                alt: () => {
                    this.importedDefaultBinding();
                    this.tokenConsumer.Comma();
                    this.namespaceImport();
                }
            },
            {
                alt: () => {
                    this.importedDefaultBinding();
                    this.tokenConsumer.Comma();
                    this.namedImports();
                }
            },
        ]);
    }

    @SubhutiRule
    importedDefaultBinding() {
        this.importedBinding();
    }

    @SubhutiRule
    namespaceImport() {
        this.tokenConsumer.Asterisk();
        this.tokenConsumer.AsTok();
        this.importedBinding();
    }

    @SubhutiRule
    namedImports() {
        this.tokenConsumer.LBrace();
        this.option(() => {
            this.importsList();
            this.option(() => this.tokenConsumer.Comma());
        });
        this.tokenConsumer.RBrace();
    }

    @SubhutiRule
    fromClause() {
        this.tokenConsumer.FromTok();
        this.moduleSpecifier();
    }

    @SubhutiRule
    importsList() {
        this.importSpecifier();
        this.MANY(() => {
            this.tokenConsumer.Comma();
            this.importSpecifier();
        });
    }

    @SubhutiRule
    importSpecifier() {
        this.or([
            {alt: () => this.importedBinding()},
            {
                alt: () => {
                    this.tokenConsumer.IdentifierName();
                    this.tokenConsumer.AsTok();
                    this.importedBinding();
                }
            },
        ]);
    }

    @SubhutiRule
    moduleSpecifier() {
        this.stringLiteral();
    }

    @SubhutiRule
    importedBinding() {
        this.bindingIdentifier();
    }

    @SubhutiRule
    bindingIdentifier() {
        this.tokenConsumer.IdentifierName();
    }

    @SubhutiRule
    exportDeclaration() {
        this.or([
            {
                alt: () => {
                    this.tokenConsumer.ExportTok();
                    this.tokenConsumer.Asterisk();
                    this.fromClause();
                    this.tokenConsumer.Semicolon();
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.ExportTok();
                    this.exportClause();
                    this.fromClause();
                    this.tokenConsumer.Semicolon();
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.ExportTok();
                    this.exportClause();
                    this.tokenConsumer.Semicolon();
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.ExportTok();
                    this.variableStatement();
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.ExportTok();
                    this.declaration();
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.ExportTok();
                    this.tokenConsumer.DefaultTok();
                    this.hoistableDeclaration();
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.ExportTok();
                    this.tokenConsumer.DefaultTok();
                    this.classDeclaration();
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.ExportTok();
                    this.tokenConsumer.DefaultTok();
                    this.assignmentExpression();
                    this.tokenConsumer.Semicolon();
                }
            },
        ]);
    }

    @SubhutiRule
    exportClause() {
        this.tokenConsumer.LBrace();
        this.option(() => {
            this.exportsList();
            this.option(() => this.tokenConsumer.Comma());
        });
        this.tokenConsumer.RBrace();
    }

    @SubhutiRule
    exportsList() {
        this.exportSpecifier();
        this.MANY(() => {
            this.tokenConsumer.Comma();
            this.exportSpecifier();
        });
    }

    @SubhutiRule
    exportSpecifier() {
        this.or([
            {alt: () => this.tokenConsumer.IdentifierName()},
            {
                alt: () => {
                    this.tokenConsumer.IdentifierName();
                    this.tokenConsumer.AsTok();
                    this.tokenConsumer.IdentifierName();
                }
            },
        ]);
    }

    @SubhutiRule
    variableStatement() {
        // 实现 variableStatement
    }

    @SubhutiRule
    declaration() {
        // 实现 declaration
    }

    @SubhutiRule
    hoistableDeclaration() {
        // 实现 hoistableDeclaration
    }

    @SubhutiRule
    classDeclaration() {
        // 实现 classDeclaration
    }

    BlockStatement(){
        this.Block()
    }

    Block(){
        this.option(()=>{
            this.StatementList()
        })
    }

    StatementList(){
        this.StatementListItem()
    }
    // 以下方法可能需要在 Es5Parser 中实现或重写
    @SubhutiRule
    StatementListItem() {
        // 实现 StatementListItem
        this.Statement()
        this.Declaration()
    }

    Statement(){

    }

    Declaration(){

    }

}
