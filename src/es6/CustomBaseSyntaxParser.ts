import AlienParser, { AlienRule } from "../alien/AlienParser";
import { Es6TokenName } from "./Es6Tokens";
import AlienMatchToken from "../alien/AlienMatchToken";
export default class CustomBaseSyntaxParser<T> extends AlienParser<T> {
    constructor(tokens?: AlienMatchToken[]) {
        super(tokens);
    }
    @AlienRule
    program() {
        console.log('zhixingle program')
        this.or([
            {
                alt: () => {
                    this.letKeywords();
                }
            },
            {
                alt: () => {
                    this.constKeywords();
                }
            }
        ]);
        //or执行完了，所以执行的identifierEqual
        this.identifierEqual();
        this.assignmentExpression();
        return this.getCurCst();
    }
    @AlienRule
    letKeywords() {
        this.consume(Es6TokenName.let);
        return this.getCurCst();
    }
    @AlienRule
    constKeywords() {
        this.consume(Es6TokenName.const);
        return this.getCurCst();
    }
    @AlienRule
    assignmentExpression() {
        this.or([
            {
                alt: () => {
                    this.consume(Es6TokenName.integer);
                }
            },
            {
                alt: () => {
                    this.consume(Es6TokenName.string);
                }
            }
        ]);
        return this.getCurCst();
    }
    @AlienRule
    identifierEqual() {
        this.consume(Es6TokenName.identifier);
        this.consume(Es6TokenName.equal);
        return this.getCurCst();
    }
}
