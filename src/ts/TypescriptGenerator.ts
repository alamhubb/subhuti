import AlienGenerator, {GeneratorRule} from "../alien/AlienGenerator";
import {AlienRule} from "../alien/AlienParser";
import {Es6TokenName} from "../es6/Es6Tokens";
import AlienCst from "../alien/AlienCst";
import alienMappingParser from "../mappingParser/AlienMappingParser";


export default class TypescriptGenerator extends AlienGenerator {

    //默认就是遍历生成
    generator(cst: AlienCst, code = '') {
        if (cst.extendObject && cst.extendObject.alt) {
            //具体语法上绑定生成规则
            //执行，constKeywords
            const newCst = cst.extendObject.alt.call(this, cst);
            return super.generator(newCst, code);
        } else if (alienMappingParser) {
            alienMappingParser.setGeneratorMode(true);
            alienMappingParser.setMappingCst(cst);
            alienMappingParser[cst.name]();
        }
        return super.generator(cst, code);
    }
}
export const typescriptGenerator = new TypescriptGenerator();
