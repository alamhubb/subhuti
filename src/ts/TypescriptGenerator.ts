import AlienGenerator, {GeneratorRule} from "../alien/AlienGenerator";
import {AlienRule} from "../alien/AlienParser";
import {Es6TokenName} from "../es6/Es6Tokens";
import AlienCst from "../alien/AlienCst";

export default class TypescriptGenerator extends AlienGenerator {

    @GeneratorRule
    constKeywords(cst: AlienCst) {
        this.append(Es6TokenName.const);
        return this.getCurCst();
    }

}
export const gen = new TypescriptGenerator();

