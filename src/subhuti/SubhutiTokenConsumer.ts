import SubhutiParser, {SubhutiParserOr} from "./SubhutiParser";
import {SubhutiCreateToken} from "./struct/SubhutiCreateToken";
import {Es5TokensName} from "../es5/Es5Tokens";

export default class SubhutiTokenConsumer {
    instance: SubhutiParser

    constructor(instance: SubhutiParser) {
        this.instance = instance;
    }

    consume(token: SubhutiCreateToken) {
        if (token.name === Es5TokensName.Comma){
            console.log('zhixing commale1111')
            console.log('this.continueMatch：' + this.instance.continueMatch)
            console.log('this.orBreakFlag：' + this.instance.orBreakFlag)
        }
        console.log('zhixing:' + token.name)
        this.instance.consume(token)
        console.log('end:' + token.name)
        console.log('this.continueMatch：' + this.instance.continueMatch)
        console.log('this.orBreakFlag：' + this.instance.orBreakFlag)
    }
    or(subhutiParserOrs: SubhutiParserOr[]) {
        this.instance.Or(subhutiParserOrs)
    }
}
