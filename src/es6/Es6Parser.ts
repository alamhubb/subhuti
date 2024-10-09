import AlienParser, { AlienRule } from "../alien/AlienParser";
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
export function MappingRule(targetFun: any, context) {
    return function () {
        const res = targetFun.apply(this);
        return res;
    };
}
export default class Es6Parser<T> extends AlienParser<T> {
    constructor(tokens?: AlienMatchToken[]) {
        super(tokens);
    }
    mappingRule(ruleName: string, fun: Function): RuleObj<MappingObj> {
        // const ruleObj = super.rule(ruleName, fun);
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
