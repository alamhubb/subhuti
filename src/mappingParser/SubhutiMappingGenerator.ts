import SubhutiGenerator from "../subhuti/SubhutiGenerator";
import SubhutiCst from "../subhuti/struct/SubhutiCst";
import alienMappingParser from "./SubhutiMappingParser";
export default class SubhutiMappingGenerator extends SubhutiGenerator {
    generator(cst: SubhutiCst, code = '') {
        if (alienMappingParser && alienMappingParser.generatorMode) {
            const newCst = alienMappingParser[cst.name]();
            if (!newCst) {
                throw new Error('语法错误');
            }
            alienMappingParser.setGeneratorMode(false);
            return super.generator(newCst, code);
        }
        return super.generator(cst, code);
    }
}
export const subhutiMappingGenerator = new SubhutiMappingGenerator();
