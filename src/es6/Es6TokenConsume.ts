import Es5TokenConsumer from "../es5/Es5TokenConsume";
import {es5TokensObj} from "../es5/Es5Tokens";
import {es6TokensObj} from "./Es6Tokens";

//想让他单例，那他就不能有属性。不能有状态。，有状态对象做不了多例
export default class Es6TokenConsumer extends Es5TokenConsumer {
    ImportTok() {
        return this.consume(es6TokensObj.ImportTok);
    }

    AsTok() {
        return this.consume(es6TokensObj.AsTok);
    }

    FromTok() {
        return this.consume(es6TokensObj.FromTok);
    }
}
