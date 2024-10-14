import Es5TokenConsumer from "../es5/Es5TokenConsume";
import SubhutiParser from "../subhuti/SubhutiParser";

//想让他单例，那他就不能有属性。不能有状态。，有状态对象做不了多例
export default class Es6TokenConsumer extends Es5TokenConsumer {
    constructor(instance: SubhutiParser) {
        super(instance)
        this.instance = instance;
    }
}
