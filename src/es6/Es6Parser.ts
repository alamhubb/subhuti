import AlienParser, { AlienRule } from "../subhuti/AlienParser";
import { Es6TokenName } from "./Es6Tokens";
import AlienMatchToken from "../subhuti/AlienMatchToken";
export default class Es6Parser extends AlienParser {
    constructor(tokens?: AlienMatchToken[]) {
        super(tokens);
    }
    @AlienRule
    program() {
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
