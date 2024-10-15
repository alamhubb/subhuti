/*
import SubhutiParser from "./SubhutiParser";
import SubhutiMatchToken from "./struct/SubhutiMatchToken";

export default class SubhutiAstMapping extends SubhutiParser {
    //消耗token，将token加入父语法
    consumeToken(tokenName: string) {
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
        let childCst = findChildIndex[findChildIndex]
        //容错代码
        if (!childCst || childCst.tokenName !== tokenName) {
            //因为CheckMethodCanExec 中组织了空token，所以这里不会触发
            this.setContinueExec(false);
            if (this.allowError) {
                return;
            }
            throw new Error('syntax error');
        }
        let popToken
        if (childTokenName) { // 如果存在子token名称
            popToken= new SubhutiMatchToken({ // 创建一个新的匹配token
                tokenName: genTokenName, // 设置token名称为CST节点名称
                tokenValue: genTokenName // 设置token值为CST节点值
            });
        } else {
            popToken= new SubhutiMatchToken({ // 创建一个新的匹配token
                tokenName: childCst.name, // 设置token名称为CST节点名称
                tokenValue: childCst.value // 设置token值为CST节点值
            });
        }
        return this.generateCstByToken(popToken);
    }


}
*/
