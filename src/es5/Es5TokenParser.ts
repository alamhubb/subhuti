import SubhutiParser, {SubhutiRule} from "../subhuti/SubhutiParser";
import {es5TokensObj} from "./Es5Tokens";

export class Es5TokenParser extends SubhutiParser {
    IdentifierName() {
        this.consume(es5TokensObj.IdentifierName)
    }

    StringLiteral() {
        this.consume(es5TokensObj.StringLiteral)
    }
}
