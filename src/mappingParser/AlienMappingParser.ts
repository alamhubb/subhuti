import AlienCst from "../alien/AlienCst";
import AlienParser, {AlienParserOr, AlienRule} from "../alien/AlienParser";
import Es6Parser from "../es6/Es6Parser";
import {typescriptGenerator, MappingCst} from "../ts/TypescriptGenerator";
import {Es6TokenName} from "../es6/Es6Tokens";
import CustomBaseSyntaxParser from "../es6/CustomBaseSyntaxParser";
import lodash from "../plugins/Lodash";

export function mappingRule(cst: AlienCst<MappingCst>, fun: Function) {
    if (cst) {
        cst.extendObject = {
            alt: fun
        };
    }
}

export class AlienMappingParser<T> extends CustomBaseSyntaxParser<T> {

    generatorMode = false

    setGeneratorMode(generatorMode: boolean) {
        this.generatorMode = generatorMode
    }

    or(alienParserOrs: AlienParserOr[]) {
        if (this.generatorMode) {
            console.log(this.curCst)
            if (this.curCst.children?.length) {

            }
        } else if (!this.generatorMode) {
            return super.or(alienParserOrs)
        }
    }

    @AlienRule
    letKeywords() {
        console.log('执行了 letKeywords')
        this.consume(Es6TokenName.const);
        console.log(this.getCurCst())
        return this.getCurCst();
    }

    consume(tokenName: string): AlienCst<T> {
        if (this.parserMode && this.continueMatching) {
            if (this.tokens.length) {
                console.log('zhixing xiaohao token :' + tokenName)
                return super.consumeToken(tokenName);
            }
        } else if (this.needLookahead) {
            for (const curTokens of this.curRule.ruleTokens) {
                console.log('zhixingle22222')
                console.log(this.curRuleName)
                curTokens.push(tokenName);
                console.log(curTokens)
            }
        }
        // return super.consume(tokenName);
    }
}

const alienMappingParser = new AlienMappingParser();
export default alienMappingParser;
