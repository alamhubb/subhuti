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
        this.Or([
            {alt: () => this.importDeclaration()},
            {alt: () => this.exportDeclaration()},
            {alt: () => this.StatementListItem()},
        ]);
    }

    @SubhutiRule
    importDeclaration() {
        this.Or([
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
        this.Or([
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
        this.Or([
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
        this.Or([
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
                    this.Declaration();
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.ExportTok();
                    this.tokenConsumer.DefaultTok();
                    this.HoistableDeclaration();
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.ExportTok();
                    this.tokenConsumer.DefaultTok();
                    this.ClassDeclaration();
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
        this.Or([
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

    // ... [保留之前的方法] ...

    @SubhutiRule
    Statement() {
        this.Or([
            {alt: () => this.BlockStatement()},
            {alt: () => this.VariableStatement()},
            {alt: () => this.EmptyStatement()},
            {alt: () => this.ExpressionStatement()},
            {alt: () => this.IfStatement()},
            {alt: () => this.BreakableStatement()},
            {alt: () => this.ContinueStatement()},
            {alt: () => this.BreakStatement()},
            {alt: () => this.ReturnStatement()},
            {alt: () => this.WithStatement()},
            {alt: () => this.LabelledStatement()},
            {alt: () => this.ThrowStatement()},
            {alt: () => this.TryStatement()},
            {alt: () => this.DebuggerStatement()},
        ]);
    }

    @SubhutiRule
    Declaration() {
        this.Or([
            {alt: () => this.HoistableDeclaration()},
            {alt: () => this.ClassDeclaration()},
            {alt: () => this.LexicalDeclaration()},
        ]);
    }

    @SubhutiRule
    HoistableDeclaration() {
        this.Or([
            {alt: () => this.FunctionDeclaration()},
            {alt: () => this.GeneratorDeclaration()},
        ]);
    }

    @SubhutiRule
    BreakableStatement() {
        this.Or([
            {alt: () => this.IterationStatement()},
            {alt: () => this.SwitchStatement()},
        ]);
    }

    @SubhutiRule
    BlockStatement() {
        this.Block();
    }

    @SubhutiRule
    Block() {
        this.tokenConsumer.LBrace();
        this.option(() => this.StatementList());
        this.tokenConsumer.RBrace();
    }

    @SubhutiRule
    StatementList() {
        this.AT_LEAST_ONE(() => {
            this.StatementListItem();
        });
    }

    @SubhutiRule
    StatementListItem() {
        this.Or([
            {alt: () => this.Statement()},
            {alt: () => this.Declaration()},
        ]);
    }

    @SubhutiRule
    LexicalDeclaration() {
        this.LetOrConst();
        this.BindingList();
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    LetOrConst() {
        this.Or([
            {alt: () => this.tokenConsumer.LetTok()},
            {alt: () => this.tokenConsumer.ConstTok()},
        ]);
    }

    @SubhutiRule
    BindingList() {
        this.LexicalBinding();
        this.MANY(() => {
            this.tokenConsumer.Comma();
            this.LexicalBinding();
        });
    }

    @SubhutiRule
    LexicalBinding() {
        this.Or([
            {
                alt: () => {
                    this.BindingIdentifier();
                    this.option(() => this.Initializer());
                }
            },
            {
                alt: () => {
                    this.BindingPattern();
                    this.Initializer();
                }
            },
        ]);
    }

    @SubhutiRule
    VariableStatement() {
        this.tokenConsumer.VarTok();
        this.VariableDeclarationList();
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    VariableDeclarationList() {
        this.VariableDeclaration();
        this.MANY(() => {
            this.tokenConsumer.Comma();
            this.VariableDeclaration();
        });
    }

    @SubhutiRule
    VariableDeclaration() {
        this.Or([
            {
                alt: () => {
                    this.BindingIdentifier();
                    this.option(() => this.Initializer());
                }
            },
            {
                alt: () => {
                    this.BindingPattern();
                    this.Initializer();
                }
            },
        ]);
    }

    @SubhutiRule
    BindingPattern() {
        this.Or([
            {alt: () => this.ObjectBindingPattern()},
            {alt: () => this.ArrayBindingPattern()},
        ]);
    }

    @SubhutiRule
    ObjectBindingPattern() {
        this.tokenConsumer.LBrace();
        this.option(() => {
            this.BindingPropertyList();
            this.option(() => this.tokenConsumer.Comma());
        });
        this.tokenConsumer.RBrace();
    }

    @SubhutiRule
    ArrayBindingPattern() {
        this.tokenConsumer.LBracket();
        this.Or([
            {
                alt: () => {
                    this.option(() => this.Elision());
                    this.option(() => this.BindingRestElement());
                }
            },
            {
                alt: () => {
                    this.BindingElementList();
                    this.option(() => {
                        this.tokenConsumer.Comma();
                        this.option(() => this.Elision());
                        this.option(() => this.BindingRestElement());
                    });
                }
            },
        ]);
        this.tokenConsumer.RBracket();
    }

    // ... [实现其他方法，如 BindingPropertyList, BindingElementList, BindingElisionElement, BindingProperty, BindingElement, SingleNameBinding, BindingRestElement] ...

    @SubhutiRule
    EmptyStatement() {
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    ExpressionStatement() {
        this.Expression();
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    IfStatement() {
        this.tokenConsumer.IfTok();
        this.tokenConsumer.LParen();
        this.Expression();
        this.tokenConsumer.RParen();
        this.Statement();
        this.option(() => {
            this.tokenConsumer.ElseTok();
            this.Statement();
        });
    }

    @SubhutiRule
    IterationStatement() {
        this.Or([
            {alt: () => this.DoWhileStatement()},
            {alt: () => this.WhileStatement()},
            {alt: () => this.ForStatement()},
            {alt: () => this.ForInOfStatement()},
        ]);
    }

    // ... [实现 DoWhileStatement, WhileStatement, ForStatement, ForInOfStatement] ...

    @SubhutiRule
    ContinueStatement() {
        this.tokenConsumer.ContinueTok();
        this.option(() => this.LabelIdentifier());
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    BreakStatement() {
        this.tokenConsumer.BreakTok();
        this.option(() => this.LabelIdentifier());
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    ReturnStatement() {
        this.tokenConsumer.ReturnTok();
        this.option(() => this.Expression());
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    WithStatement() {
        this.tokenConsumer.WithTok();
        this.tokenConsumer.LParen();
        this.Expression();
        this.tokenConsumer.RParen();
        this.Statement();
    }

    @SubhutiRule
    SwitchStatement() {
        this.tokenConsumer.SwitchTok();
        this.tokenConsumer.LParen();
        this.Expression();
        this.tokenConsumer.RParen();
        this.CaseBlock();
    }

    // ... [实现 CaseBlock, CaseClauses, CaseClause, DefaultClause] ...

    @SubhutiRule
    LabelledStatement() {
        this.LabelIdentifier();
        this.tokenConsumer.Colon();
        this.LabelledItem();
    }

    @SubhutiRule
    LabelledItem() {
        this.Or([
            {alt: () => this.Statement()},
            {alt: () => this.FunctionDeclaration()},
        ]);
    }

    @SubhutiRule
    ThrowStatement() {
        this.tokenConsumer.ThrowTok();
        this.Expression();
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    TryStatement() {
        this.tokenConsumer.TryTok();
        this.Block();
        this.Or([
            {
                alt: () => {
                    this.tokenConsumer.CatchTok();
                    this.option(() => this.tokenConsumer.FinallyTok());
                }
            },
            {alt: () => this.tokenConsumer.FinallyTok()},
        ]);
    }

    // ... [实现 Catch, Finally, CatchParameter] ...

    @SubhutiRule
    DebuggerStatement() {
        this.tokenConsumer.DebuggerTok();
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    FunctionDeclaration() {
        this.tokenConsumer.FunctionTok();
        this.option(() => this.BindingIdentifier());
        this.tokenConsumer.LParen();
        this.FormalParameters();
        this.tokenConsumer.RParen();
        this.tokenConsumer.LBrace();
        this.FunctionBody();
        this.tokenConsumer.RBrace();
    }

    // ... [实现 FunctionExpression, StrictFormalParameters, FormalParameters, FormalParameterList, FunctionRestParameter, FormalParameter, FunctionBody, FunctionStatementList] ...

    @SubhutiRule
    ArrowFunction() {
        this.ArrowParameters();
        this.tokenConsumer.Arrow();
        this.ConciseBody();
    }

    // ... [实现 ArrowParameters, ConciseBody, ArrowFormalParameters] ...

    @SubhutiRule
    MethodDefinition() {
        this.Or([
            {
                alt: () => {
                    this.PropertyName();
                    this.tokenConsumer.LParen();
                    this.StrictFormalParameters();
                    this.tokenConsumer.RParen();
                    this.tokenConsumer.LBrace();
                    this.FunctionBody();
                    this.tokenConsumer.RBrace();
                }
            },
            {alt: () => this.GeneratorMethod()},
            {
                alt: () => {
                    this.tokenConsumer.GetTok();
                    this.PropertyName();
                    this.tokenConsumer.LParen();
                    this.tokenConsumer.RParen();
                    this.tokenConsumer.LBrace();
                    this.FunctionBody();
                    this.tokenConsumer.RBrace();
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.SetTok();
                    this.PropertyName();
                    this.tokenConsumer.LParen();
                    this.PropertySetParameterList();
                    this.tokenConsumer.RParen();
                    this.tokenConsumer.LBrace();
                    this.FunctionBody();
                    this.tokenConsumer.RBrace();
                }
            },
        ]);
    }

    // ... [实现 PropertySetParameterList, GeneratorMethod, GeneratorDeclaration, GeneratorExpression, GeneratorBody, YieldExpression] ...

    @SubhutiRule
    ClassDeclaration() {
        this.tokenConsumer.ClassTok();
        this.option(() => this.BindingIdentifier());
        this.ClassTail();
    }

    @SubhutiRule
    ClassExpression() {
        this.tokenConsumer.ClassTok();
        this.option(() => this.BindingIdentifier());
        this.ClassTail();
    }

    @SubhutiRule
    ClassTail() {
        this.option(() => this.ClassHeritage());
        this.tokenConsumer.LBrace();
        this.option(() => this.ClassBody());
        this.tokenConsumer.RBrace();
    }

    @SubhutiRule
    ClassHeritage() {
        this.tokenConsumer.ExtendsTok();
        this.LeftHandSideExpression();
    }

    @SubhutiRule
    ClassBody() {
        this.ClassElementList();
    }

    @SubhutiRule
    ClassElementList() {
        this.MANY(() => this.ClassElement());
    }

    @SubhutiRule
    ClassElement() {
        this.Or([
            {alt: () => this.MethodDefinition()},
            {
                alt: () => {
                    this.tokenConsumer.StaticTok();
                    this.MethodDefinition();
                }
            },
            {alt: () => this.tokenConsumer.Semicolon()},
        ]);
    }

    // ... [实现其他必要的辅助方法] ...
}
