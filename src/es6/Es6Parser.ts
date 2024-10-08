import AlienParser, {alienParser} from "../alien/AlienParser";
import AlienCst from "../alien/AlienCst";
import {Es6TokenName} from "./Es6Tokens";
import AlienMatchToken from "../alien/AlienMatchToken";
import RuleObj from "../alien/RuleObj";

export enum Es6SyntaxName {
    assignmentExpression = 'assignmentExpression',
    identifierEqual = 'identifierEqual',
    program = 'program',
}

class MappingObj extends RuleObj {
    mappingFun: Function

    constructor(ruleObj: RuleObj) {
        super(ruleObj)
    }
}

export default class Es6Parser extends AlienParser {

    constructor(tokens: AlienMatchToken[]) {
        super(tokens);
        this.initRule()
    }


    mappingRule(ruleName: string, fun: Function): RuleObj<MappingObj> {
        const ruleObj = super.rule(ruleName, fun);
        const mappingRule = new MappingObj(ruleObj)
            // , mappingFun: Function
        // mappingRule.mappingFun = mappingFun
        return mappingRule
    }

    generateCst(cst: AlienCst<any>): AlienCst {
        console.log(78787878)
        console.log(cst)
        console.log(cst.tokens)
        return cst
    }

    initRule() {
        this.mappingRule(Es6SyntaxName.program, () => {
            this.or([
                {
                    alt: () => {
                        this.consume(Es6TokenName.let)
                    }
                },
                {
                    alt: () => {
                        this.consume(Es6TokenName.const)
                    }
                }
            ])
            this.subRule(Es6SyntaxName.identifierEqual)
            this.subRule(Es6SyntaxName.assignmentExpression)
        })


        this.mappingRule(Es6SyntaxName.identifierEqual, () => {
            this.consume(Es6TokenName.identifier)
            this.consume(Es6TokenName.equal)
        })

        this.mappingRule(Es6SyntaxName.assignmentExpression, () => {
            this.or([
                {
                    alt: () => {
                        this.consume(Es6TokenName.integer)
                    }
                },
                {
                    alt: () => {
                        this.consume(Es6TokenName.string)
                    }
                }
            ])
        })
    }

    /*program(): AlienCst {
        // this.syntaxStack.push()
        if (!this.cst) {
            this.cst = new AlienCst()
        }
        this.parentCstState = this.cst

        // this.parentCstState.children.push(this.cstState)

        //如何生成mappingCst，肯定不是消耗一个 生成一个。
        //问题是两个语法不一致，导致token顺序不一致
        //你要做的是调整token顺序，调整成符合mapping的顺序
        //应该是从子往父级

        //parser是从上到下的
        //是可以做到最底层的映射的，因为program执行顺序，问题是执行完子级和父级如何组合的问题
        //执行完了，发现他存在 ，mapping，则执行mapping，

        return this.cst
    }*/
}
