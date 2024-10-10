import AlienCst from "../alien/AlienCst";
import AlienParser, { AlienParserOr, AlienRule } from "../alien/AlienParser";
import { Es6TokenName } from "../es6/Es6Tokens";
import CustomBaseSyntaxParser from "../es6/CustomBaseSyntaxParser";
const mappingTokenMap = {
    const: 'let'
};
export class AlienMappingParser<T> extends CustomBaseSyntaxParser<T> {
    generatorMode = false;
    mappingCst: AlienCst;
    openMappingMode() {
        this.setGeneratorMode(true);
        // this.initFlag = false;
        // this.initParserMode();
    }
    count = 0;
    processCst(ruleName: string, targetFun: Function) {
        this.count++;
        const cst = super.processCst(ruleName, targetFun);
        return cst;
    }
    setGeneratorMode(generatorMode: boolean) {
        this.generatorMode = generatorMode;
    }
    or(alienParserOrs: AlienParserOr[]) {
        if (this.generatorMode) {
            //你这里要做什么？
            // console.log(this.generatorMode)
            if (!this._tokens) {
                // throw new Error('ceshi')
                //问题是我这里什么也没执行，为什么继续执行了呢
            }
            for (const alienParserOr of alienParserOrs) {
                alienParserOr.alt();
                // console.log(alienParserOr.alt.name)
            }
        }
        else if (!this.generatorMode) {
            return super.or(alienParserOrs);
        }
    }
    @AlienRule
    letKeywords() {
        this.consume(Es6TokenName.const);
        return this.getCurCst();
    }
    generateToken(tokenName: string) {
        //消耗token，从children里面找，找到就更改继续匹配为false
        //获取token对应的映射
        const mappingTokenName = mappingTokenMap[tokenName];
        if (mappingTokenName) {
        }
        /*let popToken = this._tokens[0];
        if (popToken.tokenName !== tokenName) {
            this.setContinueMatching(false);
            return;
        }
        popToken = this._tokens.shift();
        const cst = new AlienCst();
        cst.name = popToken.tokenName;
        cst.value = popToken.tokenValue;
        this.curCst.children.push(cst);
        this.curCst.tokens.push(popToken);
        return this.generateCst(cst);*/
    }
    consume(tokenName: string): AlienCst<T> {
        if (this.generatorMode) {
            this.generateToken(tokenName);
        }
        else if (this.parserMode && this.continueMatching) {
            if (this.tokens.length) {
                return super.consumeToken(tokenName);
            }
        }
        else if (this.needLookahead) {
            for (const curTokens of this.curRule.ruleTokens) {
                curTokens.push(tokenName);
            }
        }
        // return super.consume(tokenName);
    }
}
const alienMappingParser = new AlienMappingParser();
export default alienMappingParser;
