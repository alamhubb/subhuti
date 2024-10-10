import AlienGenerator from "../subhuti/AlienGenerator";
import { AlienRule } from "../subhuti/AlienParser";
import { Es6TokenName } from "../es6/Es6Tokens";
import AlienCst from "../subhuti/AlienCst";
import alienMappingParser from "../mappingParser/AlienMappingParser";
export default class TypescriptGenerator extends AlienGenerator {
    //默认就是遍历生成
    generator(cst: AlienCst, code = '') {
        if (cst && cst.extendObject && cst.extendObject.alt) {
            //具体语法上绑定生成规则
            //执行，constKeywords
            const newCst = cst.extendObject.alt.call(this, cst);
            return super.generator(newCst, code);
        }
        else if (alienMappingParser && alienMappingParser.generatorMode) {
            const newCst = alienMappingParser[cst.name]();
            if (!newCst) {
                throw new Error('语法错误');
            }
            console.log(newCst)
            alienMappingParser.setGeneratorMode(false)
            return super.generator(newCst, code);
        }
        return super.generator(cst, code);
    }
}
export const typescriptGenerator = new TypescriptGenerator();
