import SubhutiTokenConsumer from "../subhuti/SubhutiTokenConsumer";
import {es5TokensObj} from "./Es5Tokens";
import SubhutiMatchToken from "../subhuti/struct/SubhutiMatchToken";
import {Es5Parser} from "./Es5Parser";

class Es5TokenConsumer extends SubhutiTokenConsumer {

    init(instance: Es5Parser, tokens?: SubhutiMatchToken[]) {
        super.setTokens(tokens)
    }

    IdentifierName() {
        this.consume(es5TokensObj.IdentifierName)
    }

    StringLiteral() {
        this.consume(es5TokensObj.StringLiteral)
    }
}

export const es5TokenConsumer = new Es5TokenConsumer()
