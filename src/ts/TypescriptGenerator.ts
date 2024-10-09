import AlienGenerator, {GeneratorRule} from "../alien/AlienGenerator";
import {AlienRule} from "../alien/AlienParser";
import {Es6TokenName} from "../es6/Es6Tokens";
import AlienCst from "../alien/AlienCst";


export class MappingCst {
    alt: Function
    cst?: AlienCst
}


export default class TypescriptGenerator extends AlienGenerator<MappingCst> {

    @GeneratorRule
    constKeywords(cst: AlienCst) {
        this.append(Es6TokenName.const);
        return this.getCurCst();
    }

    //默认就是遍历生成
    generator(cst: AlienCst<MappingCst>, code = '') {
        if (cst.extendObject.alt) {
            const newCst = cst.extendObject.alt.apply(this, cst)
            return this.generator(newCst, code)
        }
        return this.generator(cst, code)
    }
}
export const gen = new TypescriptGenerator();

