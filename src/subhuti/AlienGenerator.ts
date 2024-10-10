import AlienCst from "./AlienCst";

export default class AlienGenerator {
    //默认就是遍历生成
    generator(cst: AlienCst, code = '') {
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
