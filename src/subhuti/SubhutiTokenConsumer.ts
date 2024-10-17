import SubhutiParser, {SubhutiParserOr} from "./SubhutiParser";
import {SubhutiCreateToken} from "./struct/SubhutiCreateToken";

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
