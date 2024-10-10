import SubhutiParser, {SubhutiRule} from "../subhuti/SubhutiParser";
import SubhutiMatchToken from "../subhuti/struct/SubhutiMatchToken";
import {Es6TokenName} from "./Es6Tokens";

export default class Es6Parser extends SubhutiParser {
    constructor(tokens?: SubhutiMatchToken[]) {
        super(tokens);
    }
    @SubhutiRule
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
        this.identifierEqual();
        this.assignmentExpression();
        return this.getCurCst();
    }
    @SubhutiRule
    letKeywords() {
        this.consume(Es6TokenName.let);
        return this.getCurCst();
    }
    @SubhutiRule
    constKeywords() {
        this.consume(Es6TokenName.const);
        return this.getCurCst();
    }
    @SubhutiRule
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
    @SubhutiRule
    identifierEqual() {
        this.consume(Es6TokenName.identifier);
        this.consume(Es6TokenName.equal);
        return this.getCurCst();
    }
}
