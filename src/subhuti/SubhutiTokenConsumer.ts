import SubhutiParser from "./SubhutiParser";
import {SubhutiCreateToken} from "./struct/SubhutiCreateToken";

export default class SubhutiTokenConsumer {
    instance: SubhutiParser

    constructor(instance: SubhutiParser) {
        this.instance = instance;
    }

    consume(tokenName: SubhutiCreateToken) {
        this.instance.consume(tokenName)
    }
}
