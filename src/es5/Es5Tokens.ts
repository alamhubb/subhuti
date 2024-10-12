import { createKeywordToken, createToken, SubhutiCreateTokenGroupType } from "../subhuti/struct/SubhutiCreateToken";
import { Es6TokenName } from "../es6/Es6Tokens";
export const Es5TokensName = {
    // Keywords
    VarTok: 'VarTok',
    BreakTok: 'BreakTok',
    DoTok: 'DoTok',
    InstanceOfTok: 'InstanceOfTok',
    TypeOfTok: 'TypeOfTok',
    CaseTok: 'CaseTok',
    ElseTok: 'ElseTok',
    NewTok: 'NewTok',
    CatchTok: 'CatchTok',
    FinallyTok: 'FinallyTok',
    ReturnTok: 'ReturnTok',
    VoidTok: 'VoidTok',
    ContinueTok: 'ContinueTok',
    ForTok: 'ForTok',
    SwitchTok: 'SwitchTok',
    WhileTok: 'WhileTok',
    DebuggerTok: 'DebuggerTok',
    FunctionTok: 'FunctionTok',
    ThisTok: 'ThisTok',
    WithTok: 'WithTok',
    DefaultTok: 'DefaultTok',
    IfTok: 'IfTok',
    ThrowTok: 'ThrowTok',
    DeleteTok: 'DeleteTok',
    InTok: 'InTok',
    TryTok: 'TryTok',
    SuperTok: 'SuperTok',
    NullTok: 'NullTok',
    TrueTok: 'TrueTok',
    FalseTok: 'FalseTok',
    // Identifiers
    Identifier: 'Identifier',
    SetTok: 'SetTok',
    GetTok: 'GetTok',
    // Punctuators
    LCurly: 'LCurly',
    RCurly: 'RCurly',
    LParen: 'LParen',
    RParen: 'RParen',
    LBracket: 'LBracket',
    RBracket: 'RBracket',
    Dot: 'Dot',
    Semicolon: 'Semicolon',
    Comma: 'Comma',
    // Operators
    PlusPlus: 'PlusPlus',
    MinusMinus: 'MinusMinus',
    Ampersand: 'Ampersand',
    VerticalBar: 'VerticalBar',
    Circumflex: 'Circumflex',
    Exclamation: 'Exclamation',
    Tilde: 'Tilde',
    AmpersandAmpersand: 'AmpersandAmpersand',
    VerticalBarVerticalBar: 'VerticalBarVerticalBar',
    Question: 'Question',
    Colon: 'Colon',
    Asterisk: 'Asterisk',
    Slash: 'Slash',
    Percent: 'Percent',
    Plus: 'Plus',
    Minus: 'Minus',
    LessLess: 'LessLess',
    MoreMore: 'MoreMore',
    MoreMoreMore: 'MoreMoreMore',
    Less: 'Less',
    Greater: 'Greater',
    LessEq: 'LessEq',
    GreaterEq: 'GreaterEq',
    EqEq: 'EqEq',
    NotEq: 'NotEq',
    EqEqEq: 'EqEqEq',
    NotEqEq: 'NotEqEq',
    Eq: 'Eq',
    PlusEq: 'PlusEq',
    MinusEq: 'MinusEq',
    AsteriskEq: 'AsteriskEq',
    PercentEq: 'PercentEq',
    LessLessEq: 'LessLessEq',
    MoreMoreEq: 'MoreMoreEq',
    MoreMoreMoreEq: 'MoreMoreMoreEq',
    AmpersandEq: 'AmpersandEq',
    VerticalBarEq: 'VerticalBarEq',
    CircumflexEq: 'CircumflexEq',
    SlashEq: 'SlashEq',
    // Literals
    NumericLiteral: 'NumericLiteral',
    StringLiteral: 'StringLiteral',
    RegularExpressionLiteral: 'RegularExpressionLiteral',
    Whitespace: 'Whitespace'
};
export const es5TokensObj = {
    // Keywords
    VarTok: createKeywordToken({ name: Es5TokensName.VarTok, pattern: /var/ }),
    BreakTok: createKeywordToken({ name: Es5TokensName.BreakTok, pattern: /break/ }),
    DoTok: createKeywordToken({ name: Es5TokensName.DoTok, pattern: /do/ }),
    InstanceOfTok: createKeywordToken({ name: Es5TokensName.InstanceOfTok, pattern: /instanceof/ }),
    TypeOfTok: createKeywordToken({ name: Es5TokensName.TypeOfTok, pattern: /typeof/ }),
    CaseTok: createKeywordToken({ name: Es5TokensName.CaseTok, pattern: /case/ }),
    ElseTok: createKeywordToken({ name: Es5TokensName.ElseTok, pattern: /else/ }),
    NewTok: createKeywordToken({ name: Es5TokensName.NewTok, pattern: /new/ }),
    CatchTok: createKeywordToken({ name: Es5TokensName.CatchTok, pattern: /catch/ }),
    FinallyTok: createKeywordToken({ name: Es5TokensName.FinallyTok, pattern: /finally/ }),
    ReturnTok: createKeywordToken({ name: Es5TokensName.ReturnTok, pattern: /return/ }),
    VoidTok: createKeywordToken({ name: Es5TokensName.VoidTok, pattern: /void/ }),
    ContinueTok: createKeywordToken({ name: Es5TokensName.ContinueTok, pattern: /continue/ }),
    ForTok: createKeywordToken({ name: Es5TokensName.ForTok, pattern: /for/ }),
    SwitchTok: createKeywordToken({ name: Es5TokensName.SwitchTok, pattern: /switch/ }),
    WhileTok: createKeywordToken({ name: Es5TokensName.WhileTok, pattern: /while/ }),
    DebuggerTok: createKeywordToken({ name: Es5TokensName.DebuggerTok, pattern: /debugger/ }),
    FunctionTok: createKeywordToken({ name: Es5TokensName.FunctionTok, pattern: /function/ }),
    ThisTok: createKeywordToken({ name: Es5TokensName.ThisTok, pattern: /this/ }),
    WithTok: createKeywordToken({ name: Es5TokensName.WithTok, pattern: /with/ }),
    DefaultTok: createKeywordToken({ name: Es5TokensName.DefaultTok, pattern: /default/ }),
    IfTok: createKeywordToken({ name: Es5TokensName.IfTok, pattern: /if/ }),
    ThrowTok: createKeywordToken({ name: Es5TokensName.ThrowTok, pattern: /throw/ }),
    DeleteTok: createKeywordToken({ name: Es5TokensName.DeleteTok, pattern: /delete/ }),
    InTok: createKeywordToken({ name: Es5TokensName.InTok, pattern: /in/ }),
    TryTok: createKeywordToken({ name: Es5TokensName.TryTok, pattern: /try/ }),
    SuperTok: createKeywordToken({ name: Es5TokensName.SuperTok, pattern: /super/ }),
    NullTok: createKeywordToken({ name: Es5TokensName.NullTok, pattern: /null/ }),
    TrueTok: createKeywordToken({ name: Es5TokensName.TrueTok, pattern: /true/ }),
    FalseTok: createKeywordToken({ name: Es5TokensName.FalseTok, pattern: /false/ }),
    // Identifiers
    Identifier: createToken({ name: Es5TokensName.Identifier, pattern: /[A-Za-z_$][A-Za-z0-9_$]*/ }),
    SetTok: createKeywordToken({ name: Es5TokensName.SetTok, pattern: /set/ }),
    GetTok: createKeywordToken({ name: Es5TokensName.GetTok, pattern: /get/ }),
    // Punctuators
    LCurly: createToken({ name: Es5TokensName.LCurly, pattern: /\{/ }),
    RCurly: createToken({ name: Es5TokensName.RCurly, pattern: /\}/ }),
    LParen: createToken({ name: Es5TokensName.LParen, pattern: /\(/ }),
    RParen: createToken({ name: Es5TokensName.RParen, pattern: /\)/ }),
    LBracket: createToken({ name: Es5TokensName.LBracket, pattern: /\[/ }),
    RBracket: createToken({ name: Es5TokensName.RBracket, pattern: /\]/ }),
    Dot: createToken({ name: Es5TokensName.Dot, pattern: /\./ }),
    Semicolon: createToken({ name: Es5TokensName.Semicolon, pattern: /;/ }),
    Comma: createToken({ name: Es5TokensName.Comma, pattern: /,/ }),
    // Operators
    PlusPlus: createToken({ name: Es5TokensName.PlusPlus, pattern: /\+\+/ }),
    MinusMinus: createToken({ name: Es5TokensName.MinusMinus, pattern: /--/ }),
    Ampersand: createToken({ name: Es5TokensName.Ampersand, pattern: /&/ }),
    VerticalBar: createToken({ name: Es5TokensName.VerticalBar, pattern: /\|/ }),
    Circumflex: createToken({ name: Es5TokensName.Circumflex, pattern: /\^/ }),
    Exclamation: createToken({ name: Es5TokensName.Exclamation, pattern: /!/ }),
    Tilde: createToken({ name: Es5TokensName.Tilde, pattern: /~/ }),
    AmpersandAmpersand: createToken({ name: Es5TokensName.AmpersandAmpersand, pattern: /&&/ }),
    VerticalBarVerticalBar: createToken({ name: Es5TokensName.VerticalBarVerticalBar, pattern: /\|\|/ }),
    Question: createToken({ name: Es5TokensName.Question, pattern: /\?/ }),
    Colon: createToken({ name: Es5TokensName.Colon, pattern: /:/ }),
    Asterisk: createToken({ name: Es5TokensName.Asterisk, pattern: /\*/ }),
    Slash: createToken({ name: Es5TokensName.Slash, pattern: /\/\// }),
    Percent: createToken({ name: Es5TokensName.Percent, pattern: /%/ }),
    Plus: createToken({ name: Es5TokensName.Plus, pattern: /\+/ }),
    Minus: createToken({ name: Es5TokensName.Minus, pattern: /-/ }),
    LessLess: createToken({ name: Es5TokensName.LessLess, pattern: /<</ }),
    MoreMore: createToken({ name: Es5TokensName.MoreMore, pattern: />>/ }),
    MoreMoreMore: createToken({ name: Es5TokensName.MoreMoreMore, pattern: />>>/ }),
    Less: createToken({ name: Es5TokensName.Less, pattern: /</ }),
    Greater: createToken({ name: Es5TokensName.Greater, pattern: />/ }),
    LessEq: createToken({ name: Es5TokensName.LessEq, pattern: /<=/ }),
    GreaterEq: createToken({ name: Es5TokensName.GreaterEq, pattern: />=/ }),
    EqEq: createToken({ name: Es5TokensName.EqEq, pattern: /==/ }),
    NotEq: createToken({ name: Es5TokensName.NotEq, pattern: /!=/ }),
    EqEqEq: createToken({ name: Es5TokensName.EqEqEq, pattern: /===/ }),
    NotEqEq: createToken({ name: Es5TokensName.NotEqEq, pattern: /!==/ }),
    Eq: createToken({ name: Es5TokensName.Eq, pattern: /=/ }),
    PlusEq: createToken({ name: Es5TokensName.PlusEq, pattern: /\+=/ }),
    MinusEq: createToken({ name: Es5TokensName.MinusEq, pattern: /-=/ }),
    AsteriskEq: createToken({ name: Es5TokensName.AsteriskEq, pattern: /\*=/ }),
    PercentEq: createToken({ name: Es5TokensName.PercentEq, pattern: /%=/ }),
    LessLessEq: createToken({ name: Es5TokensName.LessLessEq, pattern: /<<=/ }),
    MoreMoreEq: createToken({ name: Es5TokensName.MoreMoreEq, pattern: />>=/ }),
    MoreMoreMoreEq: createToken({ name: Es5TokensName.MoreMoreMoreEq, pattern: />>>=/ }),
    AmpersandEq: createToken({ name: Es5TokensName.AmpersandEq, pattern: /&=/ }),
    VerticalBarEq: createToken({ name: Es5TokensName.VerticalBarEq, pattern: /\|=/ }),
    CircumflexEq: createToken({ name: Es5TokensName.CircumflexEq, pattern: /\^=/ }),
    SlashEq: createToken({ name: Es5TokensName.SlashEq, pattern: /\/=/ }),
    // Literals
    NumericLiteral: createToken({ name: Es5TokensName.NumericLiteral, pattern: /-?\d+(\.\d+)?/ }),
    StringLiteral: createToken({ name: Es5TokensName.StringLiteral, pattern: /(['"])(?:\\.|[^\\])*?\1/ }),
    RegularExpressionLiteral: createToken({
        name: Es5TokensName.RegularExpressionLiteral,
        pattern: /\/(?:\\.|[^\\\/])+\/[gimuy]*/
    }),
    Whitespace: createKeywordToken({
        name: Es5TokensName.Whitespace,
        pattern: /\s+/,
        group: SubhutiCreateTokenGroupType.skip
    }),
};
export const es5Tokens = Object.values(es5TokensObj);