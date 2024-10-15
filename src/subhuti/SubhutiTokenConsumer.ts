import SubhutiParser, {SubhutiParserOr} from "./SubhutiParser";
import {SubhutiCreateToken} from "./struct/SubhutiCreateToken";
import {Es5TokensName} from "../es5/Es5Tokens";

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
