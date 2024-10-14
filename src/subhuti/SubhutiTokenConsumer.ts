import SubhutiMatchToken from "./struct/SubhutiMatchToken";
import {SubhutiCreateToken} from "./struct/SubhutiCreateToken";

export default class SubhutiTokenConsumer{
    _tokens: SubhutiMatchToken[];

    setTokens(tokens?: SubhutiMatchToken[]) {
        this._tokens = tokens;
        //这考虑的是什么情况，option、many，都有可能token处理完了，执行option、many，设置token时，需要为可匹配状态
        // this.checkTokens();
    }

    ////校验可执行没问题，因为肯定是可执行
    get tokens() {
        // this.checkTokens();
        return this._tokens;
    }

    constructor(tokens?: SubhutiMatchToken[]) {
        if (tokens) {
            this.setTokens(tokens);
        }
        // this.thisClassName = this.constructor.name;
    }

    consume(tokenName: SubhutiCreateToken) {
        // return this.consumeToken(tokenName.name);

    }

}
