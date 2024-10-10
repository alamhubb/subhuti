import SubhutiGenerator from "../subhuti/SubhutiGenerator";
import { SubhutiRule } from "../subhuti/SubhutiParser";
import { Es6TokenName } from "../es6/Es6Tokens";
import SubhutiCst from "../subhuti/struct/SubhutiCst";
import alienMappingParser from "../mappingParser/SubhutiMappingParser";
export default class TypescriptGenerator extends SubhutiGenerator {
    //默认就是遍历生成
    generator(cst: SubhutiCst, code = '') {
        if (cst && cst.extendObject && cst.extendObject.alt) {
            //具体语法上绑定生成规则
            //执行，constKeywords
            const newCst = cst.extendObject.alt.call(this, cst);
            return super.generator(newCst, code);
        }
        else if (alienMappingParser && alienMappingParser.generatorMode) {
            const newCst = alienMappingParser[cst.name]();
            // console.log(newCst)
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
