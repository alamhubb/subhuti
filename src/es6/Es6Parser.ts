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

    // Import Declaration
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

    // Import Clause
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

    // Imported Default Binding
    @SubhutiRule
    importedDefaultBinding() {
        this.importedBinding();
    }

    // Namespace Import
    @SubhutiRule
    namespaceImport() {
        this.tokenConsumer.Asterisk();
        this.tokenConsumer.AsTok();
        this.importedBinding();
    }

    // Named Imports
    @SubhutiRule
    namedImports() {
        this.tokenConsumer.LBrace();
        this.option(() => this.importsList());
        this.option(() => this.tokenConsumer.Comma());
        this.tokenConsumer.RBrace();
    }

    // From Clause
    @SubhutiRule
    fromClause() {
        this.tokenConsumer.FromTok();
        this.moduleSpecifier();
    }

    // Imports List
    @SubhutiRule
    importsList() {
        this.importSpecifier();
        this.MANY(() => {
            this.tokenConsumer.Comma();
            this.importSpecifier();
        });
    }

    // Import Specifier
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

    // Module Specifier
    @SubhutiRule
    moduleSpecifier() {
        this.stringLiteral();
    }

    @SubhutiRule
    importedBinding() {
        this.bindingIdentifier();
    }

    // Imported Binding
    @SubhutiRule
    bindingIdentifier() {
        this.tokenConsumer.IdentifierName();
    }

    @SubhutiRule
    Scripts() {
        this.Script()
        return this.getCurCst()
    }

    @SubhutiRule
    Script() {
        this.AT_LEAST_ONE(() => {
            this.ScriptBody();
        });
        return this.getCurCst()
    }

    @SubhutiRule
    ScriptBody() {
        this.StatementList()
        return this.getCurCst()
    }
}
