import SubhutiGenerator from "../subhuti/SubhutiGenerator";
import SubhutiCst from "../subhuti/struct/SubhutiCst";
import alienMappingParser from "./SubhutiMappingParser";
export default class SubhutiMappingGenerator extends SubhutiGenerator {
    //默认就是遍历生成
    generator(cst: SubhutiCst, code = '') {
        if (alienMappingParser && alienMappingParser.generatorMode) {
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
export const typescriptGenerator = new SubhutiMappingGenerator();
