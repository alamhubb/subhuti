import AlienGenerator, {GeneratorRule} from "../alien/AlienGenerator";
import {AlienRule} from "../alien/AlienParser";
import {Es6TokenName} from "../es6/Es6Tokens";
import AlienCst from "../alien/AlienCst";
import alienMappingParser from "../mappingParser/AlienMappingParser";

export class MappingCst {
    alt: Function;
    cst?: AlienCst;
}

export default class TypescriptGenerator extends AlienGenerator<MappingCst> {


    //默认就是遍历生成
    generator(cst: AlienCst, code = '') {
        if (cst.extendObject && cst.extendObject.alt) {
            //具体语法上绑定生成规则
            //执行，constKeywords
            const newCst = cst.extendObject.alt.call(this, cst);
            return super.generator(newCst, code);
        } else if (alienMappingParser) {
            console.log(11111)
            console.log(cst.name)
            console.log(alienMappingParser[cst.name])
            console.log('shetzhi tokens ')
            console.log(cst)
            console.log(cst.tokens)
            alienMappingParser.setTokens(cst.tokens)
            alienMappingParser[cst.name]()
        }
        return super.generator(cst, code);
    }
}
export const typescriptGenerator = new TypescriptGenerator();
