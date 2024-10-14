import {es5TokensObj} from "./Es5Tokens";
import {Es5Parser} from "./Es5Parser";
import {SubhutiCreateToken} from "../subhuti/struct/SubhutiCreateToken";

//想让他单例，那他就不能有属性。不能有状态。，有状态对象做不了多例
export default class Es5TokenConsumer {

    instance: Es5Parser

    constructor(instance: Es5Parser) {
        this.instance = instance;
    }

    consume(tokenName: SubhutiCreateToken) {
        this.instance.consume(tokenName)
    }

    ThisTok() { return this.consume(es5TokensObj.ThisTok); }
    IdentifierName() { return this.consume(es5TokensObj.IdentifierName); }
    NullTok() { return this.consume(es5TokensObj.NullTok); }
    TrueTok() { return this.consume(es5TokensObj.TrueTok); }
    FalseTok() { return this.consume(es5TokensObj.FalseTok); }
    NumericLiteral() { return this.consume(es5TokensObj.NumericLiteral); }
    StringLiteral() { return this.consume(es5TokensObj.StringLiteral); }
    RegularExpressionLiteral() { return this.consume(es5TokensObj.RegularExpressionLiteral); }
    LParen() { return this.consume(es5TokensObj.LParen); }
    RParen() { return this.consume(es5TokensObj.RParen); }
    LBracket() { return this.consume(es5TokensObj.LBracket); }
    RBracket() { return this.consume(es5TokensObj.RBracket); }
    Comma() { return this.consume(es5TokensObj.Comma); }
    LBrace() { return this.consume(es5TokensObj.LBrace); }
    RBrace() { return this.consume(es5TokensObj.RBrace); }
    Colon() { return this.consume(es5TokensObj.Colon); }
    GetTok() { return this.consume(es5TokensObj.GetTok); }
    SetTok() { return this.consume(es5TokensObj.SetTok); }
    NewTok() { return this.consume(es5TokensObj.NewTok); }
    Dot() { return this.consume(es5TokensObj.Dot); }
    PlusPlus() { return this.consume(es5TokensObj.PlusPlus); }
    MinusMinus() { return this.consume(es5TokensObj.MinusMinus); }
    DeleteTok() { return this.consume(es5TokensObj.DeleteTok); }
    VoidTok() { return this.consume(es5TokensObj.VoidTok); }
    TypeOfTok() { return this.consume(es5TokensObj.TypeOfTok); }
    Plus() { return this.consume(es5TokensObj.Plus); }
    Minus() { return this.consume(es5TokensObj.Minus); }
    Tilde() { return this.consume(es5TokensObj.Tilde); }
    Exclamation() { return this.consume(es5TokensObj.Exclamation); }
    VerticalBarVerticalBar() { return this.consume(es5TokensObj.VerticalBarVerticalBar); }
    AmpersandAmpersand() { return this.consume(es5TokensObj.AmpersandAmpersand); }
    VerticalBar() { return this.consume(es5TokensObj.VerticalBar); }
    Circumflex() { return this.consume(es5TokensObj.Circumflex); }
    Ampersand() { return this.consume(es5TokensObj.Ampersand); }
    InstanceOfTok() { return this.consume(es5TokensObj.InstanceOfTok); }
    InTok() { return this.consume(es5TokensObj.InTok); }
    Eq() { return this.consume(es5TokensObj.Eq); }
    PlusEq() { return this.consume(es5TokensObj.PlusEq); }
    EqEq() { return this.consume(es5TokensObj.EqEq); }
    NotEq() { return this.consume(es5TokensObj.NotEq); }
    NotEqEq() { return this.consume(es5TokensObj.NotEqEq); }
    Less() { return this.consume(es5TokensObj.Less); }
    Greater() { return this.consume(es5TokensObj.Greater); }
    LessEq() { return this.consume(es5TokensObj.LessEq); }
    GreaterEq() { return this.consume(es5TokensObj.GreaterEq); }
    LessLess() { return this.consume(es5TokensObj.LessLess); }
    MoreMore() { return this.consume(es5TokensObj.MoreMore); }
    MoreMoreMore() { return this.consume(es5TokensObj.MoreMoreMore); }
    Asterisk() { return this.consume(es5TokensObj.Asterisk); }
    Slash() { return this.consume(es5TokensObj.Slash); }
    Percent() { return this.consume(es5TokensObj.Percent); }
    Question() { return this.consume(es5TokensObj.Question); }
    Semicolon() { return this.consume(es5TokensObj.Semicolon); }
    VarTok() { return this.consume(es5TokensObj.VarTok); }
    IfTok() { return this.consume(es5TokensObj.IfTok); }
    ElseTok() { return this.consume(es5TokensObj.ElseTok); }
    DoTok() { return this.consume(es5TokensObj.DoTok); }
    WhileTok() { return this.consume(es5TokensObj.WhileTok); }
    ForTok() { return this.consume(es5TokensObj.ForTok); }
    ContinueTok() { return this.consume(es5TokensObj.ContinueTok); }
    BreakTok() { return this.consume(es5TokensObj.BreakTok); }
    ReturnTok() { return this.consume(es5TokensObj.ReturnTok); }
    WithTok() { return this.consume(es5TokensObj.WithTok); }
    SwitchTok() { return this.consume(es5TokensObj.SwitchTok); }
    CaseTok() { return this.consume(es5TokensObj.CaseTok); }
    DefaultTok() { return this.consume(es5TokensObj.DefaultTok); }
    ThrowTok() { return this.consume(es5TokensObj.ThrowTok); }
    TryTok() { return this.consume(es5TokensObj.TryTok); }
    CatchTok() { return this.consume(es5TokensObj.CatchTok); }
    FinallyTok() { return this.consume(es5TokensObj.FinallyTok); }
    DebuggerTok() { return this.consume(es5TokensObj.DebuggerTok); }
    FunctionTok() { return this.consume(es5TokensObj.FunctionTok); }
}
