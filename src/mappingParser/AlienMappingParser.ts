import AlienCst from "../alien/AlienCst";
import AlienParser, {AlienParserOr, AlienRule} from "../alien/AlienParser";
import {Es6TokenName} from "../es6/Es6Tokens";
import CustomBaseSyntaxParser from "../es6/CustomBaseSyntaxParser";
import AlienMatchToken from "../alien/AlienMatchToken";

const mappingTokenMap = {
    const: 'let'
};


function traverse(currentNode: AlienCst, map = new Map<string, AlienCst>) {
    if (!currentNode || !currentNode.name) return;

    // 将当前节点添加到 Map 中
    map.set(currentNode.name, currentNode);

    // 递归遍历子节点
    if (currentNode.children && currentNode.children.length > 0) {
        currentNode.children.forEach(child => traverse(child, map));
    }
    return map
}


export class AlienMappingParser<T> extends CustomBaseSyntaxParser<T> {
    generatorMode = false;
    mappingCst: AlienCst;
    mappingCstMap: Map<string, AlienCst>

    openMappingMode(mappingCst: AlienCst) {
        this.setGeneratorMode(true);
        this.mappingCst = mappingCst
        this.mappingCstMap = traverse(this.mappingCst)

        // this.initFlag = false;
        // this.initParserMode();
    }

    count = 0;

    processCst(ruleName: string, targetFun: Function) {
        this.count++;
        console.log(11111111111)
        console.log(this.count)
        console.log(this.curCst?.name)
        console.log(this.cstStack.map(item => item.name))
        console.trace(ruleName)
        console.log(2222222)
        const cst = super.processCst(ruleName, targetFun);
        return cst;
    }

    setGeneratorMode(generatorMode: boolean) {
        this.generatorMode = generatorMode;
    }

    or(alienParserOrs: AlienParserOr[]) {
        if (this.generatorMode) {
            //你这里要做什么？
            // console.log(this.generatorMode)
            if (!this._tokens) {
                // throw new Error('ceshi')
                //问题是我这里什么也没执行，为什么继续执行了呢
            }
            for (const alienParserOr of alienParserOrs) {
                alienParserOr.alt();
                // console.log(alienParserOr.alt.name)
            }
        } else if (!this.generatorMode) {
            return super.or(alienParserOrs);
        }
    }

    @AlienRule
    letKeywords() {
        console.log('zhixingle letKeywords')
        this.consume(Es6TokenName.const);
        return this.getCurCst();
    }

    generateToken(tokenName: string) {
        //消耗token，从children里面找，找到就更改继续匹配为false
        //获取token对应的映射
        console.log(22222)
        console.log(tokenName)
        let mappingTokenName = mappingTokenMap[tokenName];
        if (mappingTokenName) {
            mappingTokenName = tokenName
        }
        console.log(3333333)
        console.log(this.curCst.name)
        const mappingCst = this.mappingCstMap.get(this.curCst.name)
        if (!mappingCst) {
            return
        }
        //在子节点中找到并删除
        const mappingChildren = mappingCst.children
        if (!mappingCst.children.length) {
            return
        }
        const findChildIndex = mappingChildren.findIndex(item => item.name === mappingTokenName)
        if (findChildIndex < 0) {
            return
        }
        //在父元素中删除
        const childCst = mappingChildren.splice(findChildIndex, 1)[0]


        console.log(44444)
        console.log(mappingChildren.map(item => item.name))
        console.log(mappingTokenName)
        console.log(childCst)

        //需要有一个标识，标志这个节点已经处理完毕了


        const cst = new AlienCst();

        cst.name = childCst.name;
        cst.value = childCst.value;

        const token = new AlienMatchToken({
            tokenName: cst.name,
            tokenValue: cst.value
        })

        this.curCst.children.push(cst);
        this.curCst.tokens.push(token);
        console.log('pipeichenggong')
        this.setMatchSuccess(true)
        return this.generateCst(cst);
    }

    consume(tokenName: string): AlienCst<T> {
        if (this.generatorMode) {
            return this.generateToken(tokenName);
        } else {
            return super.consumeToken(tokenName);
        }
        // return super.consume(tokenName);
    }
}

const alienMappingParser = new AlienMappingParser();
export default alienMappingParser;
