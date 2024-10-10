import SubhutiCst from "../subhuti/struct/SubhutiCst";
import SubhutiParser, {SubhutiParserOr, SubhutiRule} from "../subhuti/SubhutiParser";
import {Es6TokenName} from "../es6/Es6Tokens";
import Es6Parser from "../es6/Es6Parser";
import SubhutiMatchToken from "../subhuti/struct/SubhutiMatchToken";
import lodash from "../plugins/Lodash";

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

export class SubhutiMappingParser extends Es6Parser {
    _generatorMode = false;
    mappingCst: SubhutiCst;
    mappingCstMap: Map<string, SubhutiCst>;

    openMappingMode(mappingCst: SubhutiCst) {
        this.setGeneratorMode(true);
        this.mappingCst = mappingCst;
        this.mappingCstMap = traverse(this.mappingCst);
    }

    get generatorMode() {
        return this._generatorMode
    }

    processCst(ruleName: string, targetFun: Function) {
        const cst = super.processCst(ruleName, targetFun);
        return cst;
    }

    setGeneratorMode(generatorMode: boolean) {
        this._generatorMode = generatorMode;
    }

    or(alienParserOrs: SubhutiParserOr[]) {
        if (this.generatorMode) {
            for (const alienParserOr of alienParserOrs) {
                this.setMatchSuccess(false);
                alienParserOr.alt();
                //如果处理成功则跳出
                if (this.matchSuccess) {
                    break;
                }
            }
        } else if (!this.generatorMode) {
            return super.or(alienParserOrs);
        }
    }

    @SubhutiRule
    letKeywords() {
        this.consume(Es6TokenName.const);
        return this.getCurCst();
    }

        //const
    generateToken(tokenName: string) {
        //let
        const genTokenName = tokenName
        let childTokenName = mappingTokenMap[tokenName];
        if (childTokenName) {
            tokenName = childTokenName;
        }
        const mappingCst = this.mappingCstMap.get(this.curCst.name);
        if (!mappingCst) {
            return;
        }
        //在子节点中找到并删除
        const mappingChildren = mappingCst.children;
        if (!mappingCst.children.length) {
            return;
        }
        const findChildIndex = mappingChildren.findIndex(item => item.name === tokenName);
        if (findChildIndex < 0) {
            return;
        }
        //在父元素中删除
        const childCst = mappingChildren.splice(findChildIndex, 1)[0];
        if (!childCst) {
            throw new Error('语法错误')
        }
        //需要有一个标识，标志这个节点已经处理完毕了
        const cst = new SubhutiCst();
        if (childTokenName) {
            cst.name = genTokenName;
            cst.value = genTokenName;
        } else {
            cst.name = childCst.name;
            cst.value = childCst.value;
        }
        const token = new SubhutiMatchToken({
            tokenName: cst.name,
            tokenValue: cst.value
        });
        this.curCst.children.push(cst);
        this.curCst.tokens.push(token);
        this.setMatchSuccess(true);
        return this.generateCst(cst);
    }

    consume(tokenName: string): SubhutiCst {
        if (this.generatorMode) {
            return this.generateToken(tokenName);
        } else {
            return super.consumeToken(tokenName);
        }
    }
}

const subhutiMappingParser = new SubhutiMappingParser();
export default subhutiMappingParser;
