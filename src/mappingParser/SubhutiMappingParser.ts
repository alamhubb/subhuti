import SubhutiCst from "../subhuti/struct/SubhutiCst";
import SubhutiParser, { SubhutiParserOr, SubhutiRule } from "../subhuti/SubhutiParser";
import { Es6TokenName } from "../es6/Es6Tokens";
import Es6CstParser from "../es6/Es6CstParser";
import SubhutiMatchToken from "../subhuti/struct/SubhutiMatchToken";
const mappingTokenMap = {
    const: 'let'
};
function traverse(currentNode: SubhutiCst, map = new Map<string, SubhutiCst>) {
    if (!currentNode || !currentNode.name)
        return;
    // 将当前节点添加到 Map 中
    map.set(currentNode.name, currentNode);
    // 递归遍历子节点
    if (currentNode.children && currentNode.children.length > 0) {
        currentNode.children.forEach(child => traverse(child, map));
    }
    return map;
}
export class SubhutiMappingParser extends Es6CstParser {
    _generatorMode = false;
    mappingCst: SubhutiCst;
    mappingCstMap: Map<string, SubhutiCst>;
    openMappingMode(mappingCst: SubhutiCst) {
        this.mappingCst = mappingCst;
        this.mappingCstMap = traverse(this.mappingCst);
    }
    get generatorMode() {
        return this._generatorMode;
    }
    processCst(ruleName: string, targetFun: Function) {
        const cst = super.processCst(ruleName, targetFun);
        return cst;
    }
    setGeneratorMode(generatorMode: boolean) {
        this._generatorMode = generatorMode;
    }
    Or(alienParserOrs: SubhutiParserOr[]) {
        if (this.generatorMode) {
            for (const alienParserOr of alienParserOrs) {
                this.setContinueMatch(false);
                alienParserOr.alt();
                //如果处理成功则跳出
                if (this.continueMatch) {
                    break;
                }
            }
        }
        else if (!this.generatorMode) {
            return super.Or(alienParserOrs);
        }
    }
    @SubhutiRule
    letKeywords() {
        this.consume(Es6TokenName.const);
        return this.getCurCst();
    }
    generateToken(tokenName: string) {
        // let
        const genTokenName = tokenName; // 保存原始token名称
        let childTokenName = mappingTokenMap[tokenName]; // 从映射表中获取子token名称
        if (childTokenName) { // 如果存在子token名称
            tokenName = childTokenName; // 更新token名称为子token名称
        }
        const mappingCst = this.mappingCstMap.get(this.curCst.name); // 获取当前CST的映射CST
        if (!mappingCst) { // 如果没有映射CST
            return; // 直接返回
        }
        // 在子节点中找到并删除
        const mappingChildren = mappingCst.children; // 获取映射CST的子节点
        if (!mappingCst.children.length) { // 如果没有子节点
            return; // 直接返回
        }
        const findChildIndex = mappingChildren.findIndex(item => item.name === tokenName); // 查找子节点中匹配的token名称的索引
        if (findChildIndex < 0) { // 如果没有找到匹配的子节点
            return; // 直接返回
        }
        // 在父元素中删除
        const childCst = mappingChildren.splice(findChildIndex, 1)[0]; // 从子节点中删除匹配的节点并获取
        if (!childCst) { // 如果删除的节点不存在
            throw new Error('语法错误'); // 抛出语法错误
        }
        // 需要有一个标识，标志这个节点已经处理完毕了
        const cst = new SubhutiCst(); // 创建一个新的CST节点
        if (childTokenName) { // 如果存在子token名称
            cst.name = genTokenName; // 设置CST节点名称为原始token名称
            cst.value = genTokenName; // 设置CST节点值为原始token名称
        }
        else {
            cst.name = childCst.name; // 设置CST节点名称为子节点名称
            cst.value = childCst.value; // 设置CST节点值为子节点值
        }
        const token = new SubhutiMatchToken({
            tokenName: cst.name, // 设置token名称为CST节点名称
            tokenValue: cst.value // 设置token值为CST节点值
        });
        this.curCst.children.push(cst); // 将CST节点添加到当前CST的子节点中
        this.curCst.tokens.push(token); // 将token添加到当前CST的tokens中
        this.setContinueMatch(true); // 设置匹配成功标志为true
        return this.generateCst(cst); // 生成并返回CST
    }
    consume(tokenName: string): SubhutiCst {
        if (this.generatorMode) {
            return this.generateToken(tokenName);
        }
        else {
            return super.consumeToken(tokenName);
        }
    }
}
const subhutiMappingParser = new SubhutiMappingParser();
export default subhutiMappingParser;
