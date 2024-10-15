import {Es5Parser} from "../es5/Es5Parser";
import {SubhutiRule} from "../subhuti/SubhutiParser";
import SubhutiMatchToken from "../subhuti/struct/SubhutiMatchToken";
import Es6TokenConsumer from "./Es6Tokens";

export default class Es6Parser<T extends Es6TokenConsumer = Es6TokenConsumer> extends Es5Parser<T> {
    constructor(tokens?: SubhutiMatchToken[]) {
        super(tokens);
        this.tokenConsumer = new Es6TokenConsumer(this) as T;
        this.thisClassName = this.constructor.name;
    }

    @SubhutiRule
    IdentifierReference(yield_ = false) {
        this.Or([
            {alt: () => this.Identifier()},
            {
                alt: () => {
                    if (!yield_) {
                        this.tokenConsumer.YieldTok();
                    }
                }
            }
        ]);
    }

    @SubhutiRule
    BindingIdentifier(yield_ = false) {
        this.Or([
            {alt: () => this.Identifier()},
            {
                alt: () => {
                    if (!yield_) {
                        this.tokenConsumer.YieldTok();
                    }
                }
            }
        ]);
    }

    @SubhutiRule
    LabelIdentifier(yield_ = false) {
        this.Or([
            {alt: () => this.Identifier()},
            {
                alt: () => {
                    if (!yield_) {
                        this.tokenConsumer.YieldTok();
                    }
                }
            }
        ]);
    }

    @SubhutiRule
    Identifier() {
        this.tokenConsumer.IdentifierName();
        // TODO: Implement logic to exclude ReservedWord
    }

    @SubhutiRule
    PrimaryExpression(yield_ = false) {
        this.Or([
            {alt: () => this.tokenConsumer.ThisTok()},
            {alt: () => this.IdentifierReference(yield_)},
            {alt: () => this.Literal()},
            {alt: () => this.ArrayLiteral(yield_)},
            {alt: () => this.ObjectLiteral(yield_)},
            {alt: () => this.FunctionExpression()},
            {alt: () => this.ClassExpression(yield_)},
            {alt: () => this.GeneratorExpression()},
            {alt: () => this.tokenConsumer.RegularExpressionLiteral()},
            {alt: () => this.TemplateLiteral(yield_)},
            {alt: () => this.CoverParenthesizedExpressionAndArrowParameterList(yield_)}
        ]);
    }

    @SubhutiRule
    CoverParenthesizedExpressionAndArrowParameterList(yield_ = false) {
        this.Or([
            {
                alt: () => {
                    this.tokenConsumer.LParen();
                    this.Expression(true, yield_);
                    this.tokenConsumer.RParen();
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.LParen();
                    this.tokenConsumer.RParen();
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.LParen();
                    this.tokenConsumer.Ellipsis();
                    this.BindingIdentifier(yield_);
                    this.tokenConsumer.RParen();
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.LParen();
                    this.Expression(true, yield_);
                    this.tokenConsumer.Comma();
                    this.tokenConsumer.Ellipsis();
                    this.BindingIdentifier(yield_);
                    this.tokenConsumer.RParen();
                }
            }
        ]);
    }

    @SubhutiRule
    ParenthesizedExpression(yield_ = false) {
        this.tokenConsumer.LParen();
        this.Expression(true, yield_);
        this.tokenConsumer.RParen();
    }

    @SubhutiRule
    Literal() {
        this.Or([
            {alt: () => this.tokenConsumer.NullLiteral()},
            {alt: () => this.tokenConsumer.BooleanLiteral()},
            {alt: () => this.tokenConsumer.NumericLiteral()},
            {alt: () => this.tokenConsumer.StringLiteral()}
        ]);
    }

    @SubhutiRule
    ArrayLiteral(yield_ = false) {
        this.tokenConsumer.LBracket();
        this.Option(() => this.Elision());
        this.tokenConsumer.RBracket();
        this.Or([
            {
                alt: () => {
                    this.ElementList(yield_);
                    this.tokenConsumer.RBracket();
                }
            },
            {
                alt: () => {
                    this.ElementList(yield_);
                    this.tokenConsumer.Comma();
                    this.Option(() => this.Elision());
                    this.tokenConsumer.RBracket();
                }
            }
        ]);
    }

    @SubhutiRule
    ElementList(yield_ = false) {
        this.Or([
            {
                alt: () => {
                    this.Option(() => this.Elision());
                    this.AssignmentExpression(true, yield_);
                }
            },
            {
                alt: () => {
                    this.Option(() => this.Elision());
                    this.SpreadElement(yield_);
                }
            }
        ]);
        this.Many(() => {
            this.tokenConsumer.Comma();
            this.Or([
                {
                    alt: () => {
                        this.Option(() => this.Elision());
                        this.AssignmentExpression(true, yield_);
                    }
                },
                {
                    alt: () => {
                        this.Option(() => this.Elision());
                        this.SpreadElement(yield_);
                    }
                }
            ]);
        });
    }

    @SubhutiRule
    Elision() {
        this.tokenConsumer.Comma();
        this.Many(() => this.tokenConsumer.Comma());
    }

    @SubhutiRule
    SpreadElement(yield_ = false) {
        this.tokenConsumer.Ellipsis();
        this.AssignmentExpression(true, yield_);
    }

    @SubhutiRule
    ObjectLiteral(yield_ = false) {
        this.tokenConsumer.LBrace();
        this.Or([
            {alt: () => this.tokenConsumer.RBrace()},
            {
                alt: () => {
                    this.PropertyDefinitionList(yield_);
                    this.tokenConsumer.RBrace();
                }
            },
            {
                alt: () => {
                    this.PropertyDefinitionList(yield_);
                    this.tokenConsumer.Comma();
                    this.tokenConsumer.RBrace();
                }
            }
        ]);
    }

    @SubhutiRule
    PropertyDefinitionList(yield_ = false) {
        this.PropertyDefinition(yield_);
        this.Many(() => {
            this.tokenConsumer.Comma();
            this.PropertyDefinition(yield_);
        });
    }

    @SubhutiRule
    PropertyDefinition(yield_ = false) {
        this.Or([
            {alt: () => this.IdentifierReference(yield_)},
            {alt: () => this.CoverInitializedName(yield_)},
            {
                alt: () => {
                    this.PropertyName(yield_);
                    this.tokenConsumer.Colon();
                    this.AssignmentExpression(true, yield_);
                }
            },
            {alt: () => this.MethodDefinition(yield_)}
        ]);
    }

    @SubhutiRule
    PropertyName(yield_ = false) {
        this.Or([
            {alt: () => this.LiteralPropertyName()},
            {alt: () => this.ComputedPropertyName(yield_)}
        ]);
    }

    @SubhutiRule
    LiteralPropertyName() {
        this.Or([
            {alt: () => this.tokenConsumer.IdentifierName()},
            {alt: () => this.tokenConsumer.StringLiteral()},
            {alt: () => this.tokenConsumer.NumericLiteral()}
        ]);
    }

    @SubhutiRule
    ComputedPropertyName(yield_ = false) {
        this.tokenConsumer.LBracket();
        this.AssignmentExpression(true, yield_);
        this.tokenConsumer.RBracket();
    }

    @SubhutiRule
    CoverInitializedName(yield_ = false) {
        this.IdentifierReference(yield_);
        this.Initializer(true, yield_);
    }

    @SubhutiRule
    Initializer(in_ = true, yield_ = false) {
        this.tokenConsumer.Eq();
        this.AssignmentExpression(in_, yield_);
    }

    @SubhutiRule
    TemplateLiteral(yield_ = false) {
        this.Or([
            {alt: () => this.tokenConsumer.NoSubstitutionTemplate()},
            {
                alt: () => {
                    this.tokenConsumer.TemplateHead();
                    this.Expression(true, yield_);
                    this.TemplateSpans(yield_);
                }
            }
        ]);
    }

    @SubhutiRule
    TemplateSpans(yield_ = false) {
        this.Or([
            {alt: () => this.tokenConsumer.TemplateTail()},
            {
                alt: () => {
                    this.TemplateMiddleList(yield_);
                    this.tokenConsumer.TemplateTail();
                }
            }
        ]);
    }

    @SubhutiRule
    TemplateMiddleList(yield_ = false) {
        this.tokenConsumer.TemplateMiddle();
        this.Expression(true, yield_);
        this.Many(() => {
            this.tokenConsumer.TemplateMiddle();
            this.Expression(true, yield_);
        });
    }

    @SubhutiRule
    MemberExpression(yield_ = false) {
        this.Or([
            { alt: () => this.PrimaryExpression(yield_) },
            { alt: () => this.SuperProperty(yield_) },
            { alt: () => this.MetaProperty() },
            {
                alt: () => {
                    this.tokenConsumer.NewTok();
                    this.MemberExpression(yield_);
                    this.Arguments(yield_);
                }
            }
        ]);
        // 使用 Many 处理多个后缀操作（. IdentifierName, [ Expression ], TemplateLiteral）
        this.Many(() => {
            this.Or([
                {
                    alt: () => {
                        this.tokenConsumer.Dot();
                        this.tokenConsumer.IdentifierName();
                    }
                },
                {
                    alt: () => {
                        this.tokenConsumer.LBracket();
                        this.Expression(true, yield_);
                        this.tokenConsumer.RBracket();
                    }
                },
                {
                    alt: () => {
                        this.TemplateLiteral(yield_);
                    }
                }
            ]);
        });
    }

    @SubhutiRule
    SuperProperty(yield_ = false) {
        this.Or([
            {
                alt: () => {
                    this.tokenConsumer.SuperTok();
                    this.tokenConsumer.LBracket();
                    this.Expression(true, yield_);
                    this.tokenConsumer.RBracket();
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.SuperTok();
                    this.tokenConsumer.Dot();
                    this.tokenConsumer.IdentifierName();
                }
            }
        ]);
    }

    @SubhutiRule
    MetaProperty() {
        this.NewTarget();
    }

    @SubhutiRule
    NewTarget() {
        this.tokenConsumer.NewTok();
        this.tokenConsumer.Dot();
        this.tokenConsumer.TargetTok();
    }

    @SubhutiRule
    NewExpression(yield_ = false) {
        this.Or([
            {
                alt: () => {
                    this.MemberExpression(yield_)
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.NewTok();
                    this.NewExpression(yield_);
                }
            }
        ]);
    }

    @SubhutiRule
    CallExpression(yield_ = false) {
        this.Or([
            {
                alt: () => {
                    this.MemberExpression(yield_);
                    this.Arguments(yield_);
                }
            },
            {alt: () => this.SuperCall(yield_)}
        ]);
        this.Many(() => {
            this.Or([
                {alt: () => this.Arguments(yield_)},
                {
                    alt: () => {
                        this.tokenConsumer.LBracket();
                        this.Expression(true, yield_);
                        this.tokenConsumer.RBracket();
                    }
                },
                {
                    alt: () => {
                        this.tokenConsumer.Dot();
                        this.tokenConsumer.IdentifierName();
                    }
                },
                {alt: () => this.TemplateLiteral(yield_)}
            ]);
        });
    }

    @SubhutiRule
    SuperCall(yield_ = false) {
        this.tokenConsumer.SuperTok();
        this.Arguments(yield_);
    }

    @SubhutiRule
    Arguments(yield_ = false) {
        this.tokenConsumer.LParen();
        this.Option(() => this.ArgumentList(yield_));
        this.tokenConsumer.RParen();
    }

    @SubhutiRule
    ArgumentList(yield_ = false) {
        this.Or([
            {alt: () => this.AssignmentExpression(true, yield_)},
            {
                alt: () => {
                    this.tokenConsumer.Ellipsis();
                    this.AssignmentExpression(true, yield_);
                }
            }
        ]);
        this.Many(() => {
            this.tokenConsumer.Comma();
            this.Or([
                {alt: () => this.AssignmentExpression(true, yield_)},
                {
                    alt: () => {
                        this.tokenConsumer.Ellipsis();
                        this.AssignmentExpression(true, yield_);
                    }
                }
            ]);
        });
    }

    @SubhutiRule
    LeftHandSideExpression(yield_ = false) {
        this.Or([
            {alt: () => this.NewExpression(yield_)},
            {alt: () => this.CallExpression(yield_)}
        ]);
    }

    @SubhutiRule
    PostfixExpression(yield_ = false) {
        this.LeftHandSideExpression(yield_);
        this.Option(() => {
            this.Or([
                {alt: () => this.tokenConsumer.PlusPlus()},
                {alt: () => this.tokenConsumer.MinusMinus()}
            ]);
        });
    }

    @SubhutiRule
    UnaryExpression(yield_ = false) {
        this.Or([
            {alt: () => this.PostfixExpression(yield_)},
            {
                alt: () => {
                    this.Or([
                        {alt: () => this.tokenConsumer.DeleteTok()},
                        {alt: () => this.tokenConsumer.VoidTok()},
                        {alt: () => this.tokenConsumer.TypeofTok()},
                        {alt: () => this.tokenConsumer.PlusPlus()},
                        {alt: () => this.tokenConsumer.MinusMinus()},
                        {alt: () => this.tokenConsumer.Plus()},
                        {alt: () => this.tokenConsumer.Minus()},
                        {alt: () => this.tokenConsumer.Tilde()},
                        {alt: () => this.tokenConsumer.Exclamation()}
                    ]);
                    this.UnaryExpression(yield_);
                }
            }
        ]);
    }

    @SubhutiRule
    MultiplicativeExpression(yield_ = false) {
        this.UnaryExpression(yield_);
        this.Many(() => {
            this.MultiplicativeOperator();
            this.UnaryExpression(yield_);
        });
    }

    @SubhutiRule
    MultiplicativeOperator() {
        this.Or([
            {alt: () => this.tokenConsumer.Asterisk()},
            {alt: () => this.tokenConsumer.Slash()},
            {alt: () => this.tokenConsumer.Percent()}
        ]);
    }

    @SubhutiRule
    AdditiveExpression(yield_ = false) {
        this.MultiplicativeExpression(yield_);
        this.Many(() => {
            this.Or([
                {alt: () => this.tokenConsumer.Plus()},
                {alt: () => this.tokenConsumer.Minus()}
            ]);
            this.MultiplicativeExpression(yield_);
        });
    }

    @SubhutiRule
    ShiftExpression(yield_ = false) {
        this.AdditiveExpression(yield_);
        this.Many(() => {
            this.Or([
                {alt: () => this.tokenConsumer.LessLess()},
                {alt: () => this.tokenConsumer.MoreMore()},
                {alt: () => this.tokenConsumer.MoreMoreMore()}
            ]);
            this.AdditiveExpression(yield_);
        });
    }

    @SubhutiRule
    RelationalExpression(in_ = true, yield_ = false) {
        this.ShiftExpression(yield_);
        this.Many(() => {
            this.Or([
                {alt: () => this.tokenConsumer.Less()},
                {alt: () => this.tokenConsumer.More()},
                {alt: () => this.tokenConsumer.LessEq()},
                {alt: () => this.tokenConsumer.MoreEq()},
                {alt: () => this.tokenConsumer.InstanceOfTok()},
                {
                    alt: () => {
                        if (in_) {
                            this.tokenConsumer.InTok();
                        }
                    }
                }
            ]);
            this.ShiftExpression(yield_);
        });
    }

    @SubhutiRule
    EqualityExpression(in_ = true, yield_ = false) {
        this.RelationalExpression(in_, yield_);
        this.Many(() => {
            this.Or([
                {alt: () => this.tokenConsumer.EqEq()},
                {alt: () => this.tokenConsumer.NotEq()},
                {alt: () => this.tokenConsumer.EqEqEq()},
                {alt: () => this.tokenConsumer.NotEqEq()}
            ]);
            this.RelationalExpression(in_, yield_);
        });
    }

    @SubhutiRule
    BitwiseANDExpression(in_ = true, yield_ = false) {
        this.EqualityExpression(in_, yield_);
        this.Many(() => {
            this.tokenConsumer.Ampersand();
            this.EqualityExpression(in_, yield_);
        });
    }

    @SubhutiRule
    BitwiseXORExpression(in_ = true, yield_ = false) {
        this.BitwiseANDExpression(in_, yield_);
        this.Many(() => {
            this.tokenConsumer.Circumflex();
            this.BitwiseANDExpression(in_, yield_);
        });
    }

    @SubhutiRule
    BitwiseORExpression(in_ = true, yield_ = false) {
        this.BitwiseXORExpression(in_, yield_);
        this.Many(() => {
            this.tokenConsumer.VerticalBar();
            this.BitwiseXORExpression(in_, yield_);
        });
    }

    @SubhutiRule
    LogicalANDExpression(in_ = true, yield_ = false) {
        this.BitwiseORExpression(in_, yield_);
        this.Many(() => {
            this.tokenConsumer.AmpersandAmpersand();
            this.BitwiseORExpression(in_, yield_);
        });
    }

    @SubhutiRule
    LogicalORExpression(in_ = true, yield_ = false) {
        this.LogicalANDExpression(in_, yield_);
        this.Many(() => {
            this.tokenConsumer.VerticalBarVerticalBar();
            this.LogicalANDExpression(in_, yield_);
        });
    }

    @SubhutiRule
    ConditionalExpression(in_ = true, yield_ = false) {
        this.LogicalORExpression(in_, yield_);
        this.Option(() => {
            this.tokenConsumer.Question();
            this.AssignmentExpression(in_, yield_);
            this.tokenConsumer.Colon();
            this.AssignmentExpression(in_, yield_);
        });
    }

    @SubhutiRule
    AssignmentExpression(in_ = true, yield_ = false) {
        this.Or([
            {alt: () => this.ConditionalExpression(in_, yield_)},
            {
                alt: () => {
                    if (yield_) {
                        this.YieldExpression(in_);
                    }
                }
            },
            {alt: () => this.ArrowFunction(in_, yield_)},
            {
                alt: () => {
                    this.LeftHandSideExpression(yield_);
                    this.tokenConsumer.Eq();
                    this.AssignmentExpression(in_, yield_);
                }
            },
            {
                alt: () => {
                    this.LeftHandSideExpression(yield_);
                    this.AssignmentOperator();
                    this.AssignmentExpression(in_, yield_);
                }
            }
        ]);
    }

    @SubhutiRule
    AssignmentOperator() {
        this.Or([
            {alt: () => this.tokenConsumer.AsteriskEq()},
            {alt: () => this.tokenConsumer.SlashEq()},
            {alt: () => this.tokenConsumer.PercentEq()},
            {alt: () => this.tokenConsumer.PlusEq()},
            {alt: () => this.tokenConsumer.MinusEq()},
            {alt: () => this.tokenConsumer.LessLessEq()},
            {alt: () => this.tokenConsumer.MoreMoreEq()},
            {alt: () => this.tokenConsumer.MoreMoreMoreEq()},
            {alt: () => this.tokenConsumer.AmpersandEq()},
            {alt: () => this.tokenConsumer.CircumflexEq()},
            {alt: () => this.tokenConsumer.VerticalBarEq()}
        ]);
    }

    @SubhutiRule
    Expression(in_ = true, yield_ = false) {
        this.AssignmentExpression(in_, yield_);
        this.Many(() => {
            this.tokenConsumer.Comma();
            this.AssignmentExpression(in_, yield_);
        });
    }

    @SubhutiRule
    Statement(yield_ = false, return_ = false) {
        this.Or([
            {alt: () => this.BlockStatement(yield_, return_)},
            {alt: () => this.VariableStatement(yield_)},
            {alt: () => this.EmptyStatement()},
            {alt: () => this.ExpressionStatement(yield_)},
            {alt: () => this.IfStatement(yield_, return_)},
            {alt: () => this.BreakableStatement(yield_, return_)},
            {alt: () => this.ContinueStatement(yield_)},
            {alt: () => this.BreakStatement(yield_)},
            {
                alt: () => {
                    if (return_) {
                        this.ReturnStatement(yield_);
                    }
                }
            },
            {alt: () => this.WithStatement(yield_, return_)},
            {alt: () => this.LabelledStatement(yield_, return_)},
            {alt: () => this.ThrowStatement(yield_)},
            {alt: () => this.TryStatement(yield_, return_)},
            {alt: () => this.DebuggerStatement()}
        ]);
    }

    @SubhutiRule
    Declaration(yield_ = false) {
        this.Or([
            {alt: () => this.HoistableDeclaration(yield_, false)},
            {alt: () => this.ClassDeclaration(yield_, false)},
            {alt: () => this.LexicalDeclaration(true, yield_)}
        ]);
    }

    @SubhutiRule
    HoistableDeclaration(yield_ = false, default_ = false) {
        this.Or([
            {alt: () => this.FunctionDeclaration(yield_, default_)},
            {alt: () => this.GeneratorDeclaration(yield_, default_)}
        ]);
    }

    @SubhutiRule
    BreakableStatement(yield_ = false, return_ = false) {
        this.Or([
            {alt: () => this.IterationStatement(yield_, return_)},
            {alt: () => this.SwitchStatement(yield_, return_)}
        ]);
    }

    @SubhutiRule
    BlockStatement(yield_ = false, return_ = false) {
        this.Block(yield_, return_);
    }

    @SubhutiRule
    Block(yield_ = false, return_ = false) {
        this.tokenConsumer.LBrace();
        this.Option(() => this.StatementList(yield_, return_));
        this.tokenConsumer.RBrace();
    }

    @SubhutiRule
    StatementList(yield_ = false, return_ = false) {
        this.StatementListItem(yield_, return_);
        // this.Many(() => this.StatementListItem(yield_, return_));
    }

    @SubhutiRule
    StatementListItem(yield_ = false, return_ = false) {
        this.Or([
            {alt: () => this.Statement(yield_, return_)},
            {alt: () => this.Declaration(yield_)}
        ]);
    }

    @SubhutiRule
    LexicalDeclaration(in_ = true, yield_ = false) {
        this.LetOrConst();
        this.BindingList(in_, yield_);
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    LetOrConst() {
        this.Or([
            {alt: () => this.tokenConsumer.LetTok()},
            {alt: () => this.tokenConsumer.ConstTok()}
        ]);
    }

    @SubhutiRule
    BindingList(in_ = true, yield_ = false) {
        this.LexicalBinding(in_, yield_);
        this.Many(() => {
            this.tokenConsumer.Comma();
            this.LexicalBinding(in_, yield_);
        });
    }

    @SubhutiRule
    LexicalBinding(in_ = true, yield_ = false) {
        this.Or([
            {
                alt: () => {
                    this.BindingIdentifier(yield_);
                    this.Option(() => this.Initializer(in_, yield_));
                }
            },
            {
                alt: () => {
                    this.BindingPattern(yield_);
                    this.Initializer(in_, yield_);
                }
            }
        ]);
    }

    @SubhutiRule
    VariableStatement(yield_ = false) {
        this.tokenConsumer.VarTok();
        this.VariableDeclarationList(true, yield_);
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    VariableDeclarationList(in_ = true, yield_ = false) {
        this.VariableDeclaration(in_, yield_);
        this.Many(() => {
            this.tokenConsumer.Comma();
            this.VariableDeclaration(in_, yield_);
        });
    }

    @SubhutiRule
    VariableDeclaration(in_ = true, yield_ = false) {
        this.Or([
            {
                alt: () => {
                    this.BindingIdentifier(yield_);
                    this.Option(() => this.Initializer(in_, yield_));
                }
            },
            {
                alt: () => {
                    this.BindingPattern(yield_);
                    this.Initializer(in_, yield_);
                }
            }
        ]);
    }

    @SubhutiRule
    BindingPattern(yield_ = false) {
        this.Or([
            {alt: () => this.ObjectBindingPattern(yield_)},
            {alt: () => this.ArrayBindingPattern(yield_)}
        ]);
    }

    @SubhutiRule
    ObjectBindingPattern(yield_ = false) {
        this.tokenConsumer.LBrace();
        this.Or([
            {alt: () => this.tokenConsumer.RBrace()},
            {
                alt: () => {
                    this.BindingPropertyList(yield_);
                    this.tokenConsumer.RBrace();
                }
            },
            {
                alt: () => {
                    this.BindingPropertyList(yield_);
                    this.tokenConsumer.Comma();
                    this.tokenConsumer.RBrace();
                }
            }
        ]);
    }

    @SubhutiRule
    ArrayBindingPattern(yield_ = false) {
        this.tokenConsumer.LBracket();
        this.Or([
            {
                alt: () => {
                    this.Option(() => this.Elision());
                    this.Option(() => this.BindingRestElement(yield_));
                    this.tokenConsumer.RBracket();
                }
            },
            {
                alt: () => {
                    this.BindingElementList(yield_);
                    this.tokenConsumer.RBracket();
                }
            },
            {
                alt: () => {
                    this.BindingElementList(yield_);
                    this.tokenConsumer.Comma();
                    this.Option(() => this.Elision());
                    this.Option(() => this.BindingRestElement(yield_));
                    this.tokenConsumer.RBracket();
                }
            }
        ]);
    }

    @SubhutiRule
    BindingPropertyList(yield_ = false) {
        this.BindingProperty(yield_);
        this.Many(() => {
            this.tokenConsumer.Comma();
            this.BindingProperty(yield_);
        });
    }

    @SubhutiRule
    BindingElementList(yield_ = false) {
        this.BindingElisionElement(yield_);
        this.Many(() => {
            this.tokenConsumer.Comma();
            this.BindingElisionElement(yield_);
        });
    }

    @SubhutiRule
    BindingElisionElement(yield_ = false) {
        this.Option(() => this.Elision());
        this.BindingElement(yield_);
    }

    @SubhutiRule
    BindingProperty(yield_ = false) {
        this.Or([
            {alt: () => this.SingleNameBinding(yield_)},
            {
                alt: () => {
                    this.PropertyName(yield_);
                    this.tokenConsumer.Colon();
                    this.BindingElement(yield_);
                }
            }
        ]);
    }

    @SubhutiRule
    BindingElement(yield_ = false) {
        this.Or([
            {alt: () => this.SingleNameBinding(yield_)},
            {
                alt: () => {
                    this.BindingPattern(yield_);
                    this.Option(() => this.Initializer(true, yield_));
                }
            }
        ]);
    }

    @SubhutiRule
    SingleNameBinding(yield_ = false) {
        this.BindingIdentifier(yield_);
        this.Option(() => this.Initializer(true, yield_));
    }

    @SubhutiRule
    BindingRestElement(yield_ = false) {
        this.tokenConsumer.Ellipsis();
        this.BindingIdentifier(yield_);
    }

    @SubhutiRule
    EmptyStatement() {
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    ExpressionStatement(yield_ = false) {
        // TODO: Implement lookahead check
        this.Expression(true, yield_);
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    IfStatement(yield_ = false, return_ = false) {
        this.tokenConsumer.IfTok();
        this.tokenConsumer.LParen();
        this.Expression(true, yield_);
        this.tokenConsumer.RParen();
        this.Statement(yield_, return_);
        this.Option(() => {
            this.tokenConsumer.ElseTok();
            this.Statement(yield_, return_);
        });
    }

    @SubhutiRule
    IterationStatement(yield_ = false, return_ = false) {
        this.Or([
            {alt: () => this.DoWhileStatement(yield_, return_)},
            {alt: () => this.WhileStatement(yield_, return_)},
            {alt: () => this.ForStatement(yield_, return_)},
            {alt: () => this.ForInOfStatement(yield_, return_)}
        ]);
    }

    @SubhutiRule
    DoWhileStatement(yield_ = false, return_ = false) {
        this.tokenConsumer.DoTok();
        this.Statement(yield_, return_);
        this.tokenConsumer.WhileTok();
        this.tokenConsumer.LParen();
        this.Expression(true, yield_);
        this.tokenConsumer.RParen();
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    WhileStatement(yield_ = false, return_ = false) {
        this.tokenConsumer.WhileTok();
        this.tokenConsumer.LParen();
        this.Expression(true, yield_);
        this.tokenConsumer.RParen();
        this.Statement(yield_, return_);
    }

    @SubhutiRule
    ForStatement(yield_ = false, return_ = false) {
        this.tokenConsumer.ForTok();
        this.tokenConsumer.LParen();
        // TODO: Implement lookahead check for 'let ['
        this.Or([
            {
                alt: () => {
                    this.Option(() => this.Expression(false, yield_));
                    this.tokenConsumer.Semicolon();
                    this.Option(() => this.Expression(true, yield_));
                    this.tokenConsumer.Semicolon();
                    this.Option(() => this.Expression(true, yield_));
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.VarTok();
                    this.VariableDeclarationList(yield_);
                    this.tokenConsumer.Semicolon();
                    this.Option(() => this.Expression(true, yield_));
                    this.tokenConsumer.Semicolon();
                    this.Option(() => this.Expression(true, yield_));
                }
            },
            {
                alt: () => {
                    this.LexicalDeclaration(yield_);
                    this.Option(() => this.Expression(true, yield_));
                    this.tokenConsumer.Semicolon();
                    this.Option(() => this.Expression(true, yield_));
                }
            }
        ]);
        this.tokenConsumer.RParen();
        this.Statement(yield_, return_);
    }

    @SubhutiRule
    ForInOfStatement(yield_ = false, return_ = false) {
        this.tokenConsumer.ForTok();
        this.tokenConsumer.LParen();
        this.Or([
            {
                alt: () => {
                    // TODO: Implement lookahead check for 'let ['
                    this.LeftHandSideExpression(yield_);
                    this.Or([
                        {
                            alt: () => {
                                this.tokenConsumer.InTok();
                                this.Expression(true, yield_);
                            }
                        },
                        {
                            alt: () => {
                                this.tokenConsumer.OfTok();
                                this.AssignmentExpression(true, yield_);
                            }
                        }
                    ]);
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.VarTok();
                    this.ForBinding(yield_);
                    this.Or([
                        {
                            alt: () => {
                                this.tokenConsumer.InTok();
                                this.Expression(true, yield_);
                            }
                        },
                        {
                            alt: () => {
                                this.tokenConsumer.OfTok();
                                this.AssignmentExpression(true, yield_);
                            }
                        }
                    ]);
                }
            },
            {
                alt: () => {
                    this.ForDeclaration(yield_);
                    this.Or([
                        {
                            alt: () => {
                                this.tokenConsumer.InTok();
                                this.Expression(true, yield_);
                            }
                        },
                        {
                            alt: () => {
                                this.tokenConsumer.OfTok();
                                this.AssignmentExpression(true, yield_);
                            }
                        }
                    ]);
                }
            }
        ]);
        this.tokenConsumer.RParen();
        this.Statement(yield_, return_);
    }

    @SubhutiRule
    ForDeclaration(yield_ = false) {
        this.LetOrConst();
        this.ForBinding(yield_);
    }

    @SubhutiRule
    ForBinding(yield_ = false) {
        this.Or([
            {alt: () => this.BindingIdentifier(yield_)},
            {alt: () => this.BindingPattern(yield_)}
        ]);
    }

    @SubhutiRule
    ContinueStatement(yield_ = false) {
        this.tokenConsumer.ContinueTok();
        this.Option(() => {
            // TODO: Implement [no LineTerminator here] check
            this.LabelIdentifier(yield_);
        });
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    BreakStatement(yield_ = false) {
        this.tokenConsumer.BreakTok();
        this.Option(() => {
            // TODO: Implement [no LineTerminator here] check
            this.LabelIdentifier(yield_);
        });
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    ReturnStatement(yield_ = false) {
        this.tokenConsumer.ReturnTok();
        this.Option(() => {
            // TODO: Implement [no LineTerminator here] check
            this.Expression(true, yield_);
        });
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    WithStatement(yield_ = false, return_ = false) {
        this.tokenConsumer.WithTok();
        this.tokenConsumer.LParen();
        this.Expression(true, yield_);
        this.tokenConsumer.RParen();
        this.Statement(yield_, return_);
    }

    @SubhutiRule
    SwitchStatement(yield_ = false, return_ = false) {
        this.tokenConsumer.SwitchTok();
        this.tokenConsumer.LParen();
        this.Expression(true, yield_);
        this.tokenConsumer.RParen();
        this.CaseBlock(yield_, return_);
    }

    @SubhutiRule
    CaseBlock(yield_ = false, return_ = false) {
        this.tokenConsumer.LBrace();
        this.Option(() => this.CaseClauses(yield_, return_));
        this.Option(() => {
            this.DefaultClause(yield_, return_);
            this.Option(() => this.CaseClauses(yield_, return_));
        });
        this.tokenConsumer.RBrace();
    }

    @SubhutiRule
    CaseClauses(yield_ = false, return_ = false) {
        this.Many(() => this.CaseClause(yield_, return_));
    }

    @SubhutiRule
    CaseClause(yield_ = false, return_ = false) {
        this.tokenConsumer.CaseTok();
        this.Expression(true, yield_);
        this.tokenConsumer.Colon();
        this.Option(() => this.StatementList(yield_, return_));
    }

    @SubhutiRule
    DefaultClause(yield_ = false, return_ = false) {
        this.tokenConsumer.DefaultTok();
        this.tokenConsumer.Colon();
        this.Option(() => this.StatementList(yield_, return_));
    }

    @SubhutiRule
    LabelledStatement(yield_ = false, return_ = false) {
        this.LabelIdentifier(yield_);
        this.tokenConsumer.Colon();
        this.LabelledItem(yield_, return_);
    }

    @SubhutiRule
    LabelledItem(yield_ = false, return_ = false) {
        this.Or([
            {alt: () => this.Statement(yield_, return_)},
            {alt: () => this.FunctionDeclaration(yield_)}
        ]);
    }

    @SubhutiRule
    ThrowStatement(yield_ = false) {
        this.tokenConsumer.ThrowTok();
        // TODO: Implement [no LineTerminator here] check
        this.Expression(true, yield_);
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    TryStatement(yield_ = false, return_ = false) {
        this.tokenConsumer.TryTok();
        this.Block(yield_, return_);
        this.Or([
            {
                alt: () => {
                    this.Catch(yield_, return_);
                    this.Option(() => this.Finally(yield_, return_));
                }
            },
            {alt: () => this.Finally(yield_, return_)}
        ]);
    }

    @SubhutiRule
    Catch(yield_ = false, return_ = false) {
        this.tokenConsumer.CatchTok();
        this.tokenConsumer.LParen();
        this.CatchParameter(yield_);
        this.tokenConsumer.RParen();
        this.Block(yield_, return_);
    }

    @SubhutiRule
    Finally(yield_ = false, return_ = false) {
        this.tokenConsumer.FinallyTok();
        this.Block(yield_, return_);
    }

    @SubhutiRule
    CatchParameter(yield_ = false) {
        this.Or([
            {alt: () => this.BindingIdentifier(yield_)},
            {alt: () => this.BindingPattern(yield_)}
        ]);
    }

    @SubhutiRule
    DebuggerStatement() {
        this.tokenConsumer.DebuggerTok();
        this.tokenConsumer.Semicolon();
    }

    @SubhutiRule
    FunctionDeclaration(yield_ = false, default_ = false) {
        this.tokenConsumer.FunctionTok();
        if (!default_) {
            this.BindingIdentifier(yield_);
        }
        this.tokenConsumer.LParen();
        this.FormalParameters(yield_);
        this.tokenConsumer.RParen();
        this.tokenConsumer.LBrace();
        this.FunctionBody(yield_);
        this.tokenConsumer.RBrace();
    }

    @SubhutiRule
    FunctionExpression() {
        this.tokenConsumer.FunctionTok();
        this.Option(() => this.BindingIdentifier());
        this.tokenConsumer.LParen();
        this.FormalParameters();
        this.tokenConsumer.RParen();
        this.tokenConsumer.LBrace();
        this.FunctionBody();
        this.tokenConsumer.RBrace();
    }

    @SubhutiRule
    StrictFormalParameters(yield_ = false) {
        this.FormalParameters(yield_);
    }

    @SubhutiRule
    FormalParameters(yield_ = false) {
        this.Or([
            {
                alt: () => {
                }
            }, // empty
            {alt: () => this.FormalParameterList(yield_)}
        ]);
    }

    @SubhutiRule
    FormalParameterList(yield_ = false) {
        this.Or([
            {alt: () => this.FunctionRestParameter(yield_)},
            {
                alt: () => {
                    this.FormalsList(yield_);
                    this.Option(() => {
                        this.tokenConsumer.Comma();
                        this.FunctionRestParameter(yield_);
                    });
                }
            }
        ]);
    }

    @SubhutiRule
    FormalsList(yield_ = false) {
        this.FormalParameter(yield_);
        this.Many(() => {
            this.tokenConsumer.Comma();
            this.FormalParameter(yield_);
        });
    }

    @SubhutiRule
    FunctionRestParameter(yield_ = false) {
        this.BindingRestElement(yield_);
    }

    @SubhutiRule
    FormalParameter(yield_ = false) {
        this.BindingElement(yield_);
    }

    @SubhutiRule
    FunctionBody(yield_ = false) {
        this.FunctionStatementList(yield_);
    }

    @SubhutiRule
    FunctionStatementList(yield_ = false) {
        this.Option(() => this.StatementList(yield_, true));
    }

    @SubhutiRule
    ArrowFunction(in_ = false, yield_ = false) {
        this.ArrowParameters(yield_);
        // TODO: Implement [no LineTerminator here] check
        this.tokenConsumer.Arrow();
        this.ConciseBody(in_);
    }

    @SubhutiRule
    ArrowParameters(yield_ = false) {
        this.Or([
            {alt: () => this.BindingIdentifier(yield_)},
            {alt: () => this.CoverParenthesizedExpressionAndArrowParameterList(yield_)}
        ]);
    }

    @SubhutiRule
    ConciseBody(in_ = false) {
        this.Or([
            {
                alt: () => {
                    // TODO: Implement lookahead check
                    this.AssignmentExpression(in_);
                }
            },
            {
                alt: () => {
                    this.tokenConsumer.LBrace();
                    this.FunctionBody();
                    this.tokenConsumer.RBrace();
                }
            }
        ]);
    }

    @SubhutiRule
    ArrowFormalParameters(yield_ = false) {
        this.tokenConsumer.LParen();
        this.StrictFormalParameters(yield_);
        this.tokenConsumer.RParen();
    }

    @SubhutiRule
    MethodDefinition(yield_ = false) {
        this.Or([
            {
                alt: () => {
                    this.PropertyName(yield_);
                    this.tokenConsumer.LParen();
                    this.StrictFormalParameters();
                    this.tokenConsumer.RParen();
                    this.tokenConsumer.LBrace();
                    this.FunctionBody();
                    this.tokenConsumer.RBrace();
                }
            },
            {alt: () => this.GeneratorMethod(yield_)},
            {
                alt: () => {
                    this.tokenConsumer.GetTok();
                    this.PropertyName(yield_);
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
                    this.PropertyName(yield_);
                    this.tokenConsumer.LParen();
                    this.PropertySetParameterList();
                    this.tokenConsumer.RParen();
                    this.tokenConsumer.LBrace();
                    this.FunctionBody();
                    this.tokenConsumer.RBrace();
                }
            }
        ]);
    }

    @SubhutiRule
    PropertySetParameterList() {
        this.FormalParameter();
    }

    @SubhutiRule
    GeneratorMethod(yield_ = false) {
        this.tokenConsumer.Asterisk();
        this.PropertyName(yield_);
        this.tokenConsumer.LParen();
        this.StrictFormalParameters(true);
        this.tokenConsumer.RParen();
        this.tokenConsumer.LBrace();
        this.GeneratorBody();
        this.tokenConsumer.RBrace();
    }

    @SubhutiRule
    GeneratorDeclaration(yield_ = false, default_ = false) {
        this.tokenConsumer.FunctionTok();
        this.tokenConsumer.Asterisk();
        if (!default_) {
            this.BindingIdentifier(yield_);
        }
        this.tokenConsumer.LParen();
        this.FormalParameters(true);
        this.tokenConsumer.RParen();
        this.tokenConsumer.LBrace();
        this.GeneratorBody();
        this.tokenConsumer.RBrace();
    }

    @SubhutiRule
    GeneratorExpression() {
        this.tokenConsumer.FunctionTok();
        this.tokenConsumer.Asterisk();
        this.Option(() => this.BindingIdentifier(true));
        this.tokenConsumer.LParen();
        this.FormalParameters(true);
        this.tokenConsumer.RParen();
        this.tokenConsumer.LBrace();
        this.GeneratorBody();
        this.tokenConsumer.RBrace();
    }

    @SubhutiRule
    GeneratorBody() {
        this.FunctionBody(true);
    }

    @SubhutiRule
    YieldExpression(in_ = false) {
        this.tokenConsumer.YieldTok();
        this.Option(() => {
            // TODO: Implement [no LineTerminator here] check
            this.Or([
                {alt: () => this.AssignmentExpression(in_, true)},
                {
                    alt: () => {
                        this.tokenConsumer.Asterisk();
                        this.AssignmentExpression(in_, true);
                    }
                }
            ]);
        });
    }

    @SubhutiRule
    ClassDeclaration(yield_ = false, default_ = false) {
        this.tokenConsumer.ClassTok();
        if (!default_) {
            this.BindingIdentifier(yield_);
        }
        this.ClassTail(yield_);
    }

    @SubhutiRule
    ClassExpression(yield_ = false) {
        this.tokenConsumer.ClassTok();
        this.Option(() => this.BindingIdentifier(yield_));
        this.ClassTail(yield_);
    }

    @SubhutiRule
    ClassTail(yield_ = false) {
        this.Option(() => this.ClassHeritage(yield_));
        this.tokenConsumer.LBrace();
        this.Option(() => this.ClassBody(yield_));
        this.tokenConsumer.RBrace();
    }

    @SubhutiRule
    ClassHeritage(yield_ = false) {
        this.tokenConsumer.ExtendsTok();
        this.LeftHandSideExpression(yield_);
    }

    @SubhutiRule
    ClassBody(yield_ = false) {
        this.ClassElementList(yield_);
    }

    @SubhutiRule
    ClassElementList(yield_ = false) {
        this.Many(() => this.ClassElement(yield_));
    }

    @SubhutiRule
    ClassElement(yield_ = false) {
        this.Or([
            {alt: () => this.MethodDefinition(yield_)},
            {
                alt: () => {
                    this.tokenConsumer.StaticTok();
                    this.MethodDefinition(yield_);
                }
            },
            {alt: () => this.tokenConsumer.Semicolon()}
        ]);
    }

    @SubhutiRule
    Script() {
        // this.Option(() => this.ScriptBody());
        this.ScriptBody()
        return this.getCurCst()
    }

    @SubhutiRule
    ScriptBody() {
        this.StatementList();
    }

    @SubhutiRule
    Module() {
        this.Option(() => this.ModuleBody());
    }

    @SubhutiRule
    ModuleBody() {
        this.ModuleItemList();
    }

    @SubhutiRule
    ModuleItemList() {
        this.Many(() => this.ModuleItem());
    }

    @SubhutiRule
    ModuleItem() {
        this.Or([
            {alt: () => this.ImportDeclaration()},
            {alt: () => this.ExportDeclaration()},
            {alt: () => this.StatementListItem()}
        ]);
    }

    @SubhutiRule
    ImportDeclaration() {
        this.tokenConsumer.ImportTok();
        this.Or([
            {
                alt: () => {
                    this.ImportClause();
                    this.FromClause();
                    this.tokenConsumer.Semicolon();
                }
            },
            {
                alt: () => {
                    this.ModuleSpecifier();
                    this.tokenConsumer.Semicolon();
                }
            }
        ]);
    }

    @SubhutiRule
    ImportClause() {
        this.Or([
            {alt: () => this.ImportedDefaultBinding()},
            {alt: () => this.NameSpaceImport()},
            {alt: () => this.NamedImports()},
            {
                alt: () => {
                    this.ImportedDefaultBinding();
                    this.tokenConsumer.Comma();
                    this.NameSpaceImport();
                }
            },
            {
                alt: () => {
                    this.ImportedDefaultBinding();
                    this.tokenConsumer.Comma();
                    this.NamedImports();
                }
            }
        ]);
    }

    @SubhutiRule
    ImportedDefaultBinding() {
        this.ImportedBinding();
    }

    @SubhutiRule
    NameSpaceImport() {
        this.tokenConsumer.Asterisk();
        this.tokenConsumer.AsTok();
        this.ImportedBinding();
    }

    @SubhutiRule
    NamedImports() {
        this.tokenConsumer.LBrace();
        this.Or([
            {alt: () => this.tokenConsumer.RBrace()},
            {
                alt: () => {
                    this.ImportsList();
                    this.tokenConsumer.RBrace();
                }
            },
            {
                alt: () => {
                    this.ImportsList();
                    this.tokenConsumer.Comma();
                    this.tokenConsumer.RBrace();
                }
            }
        ]);
    }

    @SubhutiRule
    FromClause() {
        this.tokenConsumer.FromTok();
        this.ModuleSpecifier();
    }

    @SubhutiRule
    ImportsList() {
        this.ImportSpecifier();
        this.Many(() => {
            this.tokenConsumer.Comma();
            this.ImportSpecifier();
        });
    }

    @SubhutiRule
    ImportSpecifier() {
        this.Or([
            {alt: () => this.ImportedBinding()},
            {
                alt: () => {
                    this.tokenConsumer.IdentifierName();
                    this.tokenConsumer.AsTok();
                    this.ImportedBinding();
                }
            }
        ]);
    }

    @SubhutiRule
    ModuleSpecifier() {
        this.tokenConsumer.StringLiteral();
    }

    @SubhutiRule
    ImportedBinding() {
        this.BindingIdentifier();
    }

    @SubhutiRule
    ExportDeclaration() {
        this.tokenConsumer.ExportTok();
        this.Or([
            {
                alt: () => {
                    this.tokenConsumer.Asterisk();
                    this.FromClause();
                    this.tokenConsumer.Semicolon();
                }
            },
            {
                alt: () => {
                    this.ExportClause();
                    this.FromClause();
                    this.tokenConsumer.Semicolon();
                }
            },
            {
                alt: () => {
                    this.ExportClause();
                    this.tokenConsumer.Semicolon();
                }
            },
            {alt: () => this.VariableStatement()},
            {alt: () => this.Declaration()},
            {
                alt: () => {
                    this.tokenConsumer.DefaultTok();
                    this.Or([
                        {alt: () => this.HoistableDeclaration(false, true)},
                        {alt: () => this.ClassDeclaration(false, true)},
                        {
                            alt: () => {
                                // TODO: Implement lookahead check
                                this.AssignmentExpression(true);
                                this.tokenConsumer.Semicolon();
                            }
                        }
                    ]);
                }
            }
        ]);
    }

    @SubhutiRule
    ExportClause() {
        this.tokenConsumer.LBrace();
        this.Or([
            {alt: () => this.tokenConsumer.RBrace()},
            {
                alt: () => {
                    this.ExportsList();
                    this.tokenConsumer.RBrace();
                }
            },
            {
                alt: () => {
                    this.ExportsList();
                    this.tokenConsumer.Comma();
                    this.tokenConsumer.RBrace();
                }
            }
        ]);
    }

    @SubhutiRule
    ExportsList() {
        this.ExportSpecifier();
        this.Many(() => {
            this.tokenConsumer.Comma();
            this.ExportSpecifier();
        });
    }

    @SubhutiRule
    ExportSpecifier() {
        this.tokenConsumer.IdentifierName();
        this.Option(() => {
            this.tokenConsumer.AsTok();
            this.tokenConsumer.IdentifierName();
        });
    }
}

