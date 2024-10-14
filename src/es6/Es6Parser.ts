import {Es5Parser} from "../es5/Es5Parser";
import {es6TokensObj} from "./Es6Tokens";
import {SubhutiRule} from "../subhuti/SubhutiParser";

export default class Es6Parser extends Es5Parser {
    // Import Declaration
    @SubhutiRule
    importDeclaration() {
        this.or([
            { alt: () => {
                    this.consume(es6TokensObj.ImportTok);
                    this.importClause();
                    this.fromClause();
                    this.consume(es6TokensObj.Semicolon);
                }},
            { alt: () => {
                    this.consume(es6TokensObj.ImportTok);
                    this.moduleSpecifier();
                    this.consume(es6TokensObj.Semicolon);
                }},
        ]);
    }

// Import Clause
    @SubhutiRule
    importClause() {
        this.or([
            { alt: () => this.importedDefaultBinding() },
            { alt: () => this.namespaceImport() },
            { alt: () => this.namedImports() },
            { alt: () => {
                    this.importedDefaultBinding();
                    this.consume(es6TokensObj.Comma);
                    this.namespaceImport();
                }},
            { alt: () => {
                    this.importedDefaultBinding();
                    this.consume(es6TokensObj.Comma);
                    this.namedImports();
                }},
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
        this.consume(es6TokensObj.Asterisk);
        this.consume(es6TokensObj.AsTok);
        this.importedBinding();
    }

// Named Imports
    @SubhutiRule
    namedImports() {
        this.consume(es6TokensObj.LBrace);
        this.option(() => this.importsList());
        this.option(() => this.consume(es6TokensObj.Comma));
        this.consume(es6TokensObj.RBrace);
    }

// From Clause
    @SubhutiRule
    fromClause() {
        this.consume(es6TokensObj.FromTok);
        this.moduleSpecifier();
    }

// Imports List
    @SubhutiRule
    importsList() {
        this.importSpecifier();
        this.MANY(() => {
            this.consume(es6TokensObj.Comma);
            this.importSpecifier();
        });
    }

// Import Specifier
    @SubhutiRule
    importSpecifier() {
        this.or([
            { alt: () => this.importedBinding() },
            { alt: () => {
                    this.identifierName();
                    this.consume(es6TokensObj.AsTok);
                    this.importedBinding();
                }},
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
        this.identifierName()
    }
}
