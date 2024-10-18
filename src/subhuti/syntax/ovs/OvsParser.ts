import Es6Parser from "../es6/Es6Parser.ts";
import {SubhutiRule} from "../../SubhutiParser.ts";
import {es6TokensObj} from "../es6/Es6Tokens.ts";

export default class OvsParser extends Es6Parser {
    @SubhutiRule
    OvsRenderDom() {
        this.consume(es6TokensObj.IdentifierName)
        this.Option(() => {
            this.Arguments()
        })
        this.consume(es6TokensObj.LBrace)
        this.Option(() => {
            this.ElementList()
        })
        this.consume(es6TokensObj.RBrace)
    }


    @SubhutiRule
    AssignmentExpression() {
        this.Or([
            {alt: () => this.OvsRenderDom()},
            {
                alt: () => {
                    this.ConditionalExpression()
                }
            },
            {
                alt: () => {
                    this.YieldExpression();
                }
            },
            {alt: () => this.ArrowFunction()},
            {
                alt: () => {
                    this.LeftHandSideExpression();
                    this.tokenConsumer.Eq();
                    this.AssignmentExpression();
                }
            },
            {
                alt: () => {
                    this.LeftHandSideExpression();
                    this.AssignmentOperator();
                    this.AssignmentExpression();
                }
            }
        ]);
    }
}
