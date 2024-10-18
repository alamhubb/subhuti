import SubhutiParser, {SubhutiParserOr} from "./SubhutiParser.js";
import {SubhutiCreateToken} from "./struct/SubhutiCreateToken.js";

export default class SubhutiTokenConsumer {
    instance: SubhutiParser

    constructor(instance: SubhutiParser) {
        this.instance = instance;
    }

    consume(token: SubhutiCreateToken) {
        this.instance.consume(token)
    }

    or(subhutiParserOrs: SubhutiParserOr[]) {
        this.instance.Or(subhutiParserOrs)
    }
}
