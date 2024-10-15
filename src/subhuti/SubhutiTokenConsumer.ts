import SubhutiParser, {SubhutiParserOr} from "./SubhutiParser";
import {SubhutiCreateToken} from "./struct/SubhutiCreateToken";

export default class SubhutiTokenConsumer {
    instance: SubhutiParser

    constructor(instance: SubhutiParser) {
        this.instance = instance;
    }

    consume(token: SubhutiCreateToken) {
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
