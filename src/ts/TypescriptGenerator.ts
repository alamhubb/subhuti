import AlienGenerator, {GeneratorRule} from "../alien/AlienGenerator";
import {AlienRule} from "../alien/AlienParser";
import {Es6TokenName} from "../es6/Es6Tokens";
import AlienCst from "../alien/AlienCst";


export class MappingCst {
    alt: Function
    cst?: AlienCst
}


export default class TypescriptGenerator extends AlienGenerator<MappingCst> {

    //怎么执行constKeywords 由 GeneratorRule决定
    @GeneratorRule
    constKeywords(cst: AlienCst) {
        console.log(444444)
        console.log(cst)
        this.append(Es6TokenName.const);
        return this.getCurCst();
    }

    //默认就是遍历生成
    generator(cst: AlienCst<MappingCst>, code = '') {
        console.log(cst.name)
        console.log('zhixingle 11111')
        if (cst.extendObject && cst.extendObject.alt) {
            console.log('zhixingl 2222')
            console.log(cst)
            //执行，constKeywords
            const newCst = cst.extendObject.alt.call(this, cst)
            console.log(newCst)
            return super.generator(newCst, code)
        }
        return super.generator(cst, code)
    }
}
export const gen = new TypescriptGenerator();

