import AlienGenerator, { GeneratorRule } from "../alien/AlienGenerator";
import { AlienRule } from "../alien/AlienParser";
import { Es6TokenName } from "../es6/Es6Tokens";
import AlienCst from "../alien/AlienCst";
export class MappingCst {
    alt: Function;
    cst?: AlienCst;
}
export default class TypescriptGenerator extends AlienGenerator<MappingCst> {
    //怎么执行constKeywords 由 GeneratorRule决定
    @GeneratorRule
    constKeywords(cst: AlienCst) {
        this.append(Es6TokenName.const);
        return this.getCurCst();
    }
    //默认就是遍历生成
    generator(cst: AlienCst<MappingCst>, code = '') {
        if (cst.extendObject && cst.extendObject.alt) {
            //执行，constKeywords
            const newCst = cst.extendObject.alt.call(this, cst);
            return super.generator(newCst, code);
        }
        return super.generator(cst, code);
    }
}
export const gen = new TypescriptGenerator();
