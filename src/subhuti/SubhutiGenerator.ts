import SubhutiCst from "./struct/SubhutiCst";
export default class SubhutiGenerator {
    //默认就是遍历生成
    generator(cst: SubhutiCst, code = '') {
        cst.children.forEach(item => {
            if (item.value) {
                code += ' ' + item.value;
            }
            else {
                code = this.generator(item, code);
            }
        });
        return code.trim();
    }
}
