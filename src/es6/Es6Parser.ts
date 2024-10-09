import AlienParser, { alienParser, AlienRule } from "../alien/AlienParser";
import AlienCst from "../alien/AlienCst";
import { Es6TokenName } from "./Es6Tokens";
import AlienMatchToken from "../alien/AlienMatchToken";
import RuleObj from "../alien/RuleObj";
export enum Es6SyntaxName {
    assignmentExpression = 'assignmentExpression',
    identifierEqual = 'identifierEqual',
    program = 'program'
}
class MappingObj extends RuleObj {
    mappingFun: Function;
    constructor(ruleObj: RuleObj) {
        super(ruleObj);
    }
}
export default class Es6Parser extends AlienParser {
    constructor(tokens: AlienMatchToken[]) {
        super(tokens);
    }
    mappingRule(ruleName: string, fun: Function): RuleObj<MappingObj> {
        const ruleObj = super.rule(ruleName, fun);
        const mappingRule = new MappingObj(ruleObj);
        // , mappingFun: Function
        // mappingRule.mappingFun = mappingFun
        return mappingRule;
    }
    generateCst(cst: AlienCst<any>): AlienCst {
        return cst;
    }
    @AlienRule
    program() {
        this.or([
            {
                alt: () => {
                    this.consume(Es6TokenName.let);
                }
            },
            {
                alt: () => {
                    this.consume(Es6TokenName.const);
                }
            }
        ]);
        this.identifierEqual();
        this.assignmentExpression();
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
    }
    @AlienRule
    identifierEqual() {
        this.consume(Es6TokenName.identifier);
        this.consume(Es6TokenName.equal);
    }
}
