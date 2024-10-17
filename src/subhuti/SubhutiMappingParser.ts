import SubhutiCst from "./struct/SubhutiCst"
import SubhutiParser, {SubhutiBackData, SubhutiRule} from "./SubhutiParser"
import {SubhutiCreateToken} from "./struct/SubhutiCreateToken"
import {es6TokensObj} from "../syntax/es6/Es6Tokens"
import SubhutiMatchToken from "./struct/SubhutiMatchToken"
import SubhutiTokenConsumer from "./SubhutiTokenConsumer";
import QqqqUtil from "../utils/qqqqUtil";

export class MappingBackData extends SubhutiBackData {
    mappingCst: SubhutiCst
}


function traverse(currentNode: SubhutiCst, map = new Map<string, SubhutiCst>) {
    if (!currentNode || !currentNode.name)
        return
    // 将当前节点添加到 Map 中
    map.set(currentNode.name, currentNode)
    // 递归遍历子节点
    if (currentNode.children && currentNode.children.length > 0) {
        currentNode.children.forEach(child => traverse(child, map))
    }
    return map
}

export default class SubhutiMappingParser<T extends SubhutiTokenConsumer = SubhutiTokenConsumer> extends SubhutiParser<T> {
    _generatorMode = false
    mappingCst: SubhutiCst
    // mappingCstMap: Map<string, SubhutiCst>;

    mappingCstStack: SubhutiCst[] = []

    setMappingCst(mappingCst: SubhutiCst) {
        if (!mappingCst) {
            throw new Error('fasdf')
        }
        this.mappingCst = mappingCst
    }


    openMappingMode(mappingCst: SubhutiCst) {
        this.setMappingCst({
            name: 'openMappingMode',
            children: [mappingCst]
        })
        this.mappingCstStack = []
        /*// this.mappingCstMap = traverse(this.mappingCst);
        for (const key of this.mappingCstMap.keys()) {
        }*/
        this.setGeneratorMode(true)
    }

    get generatorMode() {
        return this._generatorMode
    }

    get isParserMode() {
        return !this.generatorMode
    }

    get backData() {
        if (this.isParserMode) {
            return super.backData
        }
        const backData: MappingBackData = {
            ...super.backData,
            mappingCst: this.mappingCst
        }
        return backData
    }

    setBackData(backData: MappingBackData) {
        super.setBackData(backData)
        if (this.generatorMode) {
            this.setMappingCst(backData.mappingCst)
        }
    }

    appendToken(popToken: SubhutiMatchToken) {
        if (!this.checkMethodCanExec) {
            return
        }
        return this.generateCstByToken(popToken)
    }

    appendStringToken(value: string) {
        const popToken = {
            tokenName: es6TokensObj.StringLiteral.name,
            tokenValue: '"' + value + '"',
        }
        return this.appendToken(popToken)
    }

    processCst(ruleName: string, targetFun: Function) {
        if (this.isParserMode) {
            return super.processCst(ruleName, targetFun)
        }
        // this.printTokens()
        if (!this.mappingCst) {
            throw new Error('aflsdfdsa')
        }
        if (!this.mappingCst || !this.mappingCst.children || !this.mappingCst.children?.length) {
            this.setContinueMatchAndNoBreak(false)
            return
        }
        const findIndex = this.mappingCst.children?.findIndex(item => item.name === ruleName)
        if (findIndex < 0) {
            this.setContinueMatchAndNoBreak(false)
            return
        }
        //删除子元素内容
        let mappingCst = this.mappingCst.children[findIndex]
        this.mappingCstStack.push(this.mappingCst)
        this.setMappingCst(mappingCst)
        // this.setOrBreakFlag(lastBreakFlag)
        // this.setContinueMatch(true)
        const cst = super.processCst(ruleName, targetFun)
        const parentCst = this.mappingCstStack.pop()
        //没元素了，则在父节点中删除此元素
        if (!this.mappingCst.children?.length) {
            parentCst.children?.splice(findIndex, 1)
        }
        this.setMappingCst(parentCst)
        return cst
    }

    setGeneratorMode(generatorMode: boolean) {
        this._generatorMode = generatorMode
    }

    get tokenIsEmpty() {
        if (this.isParserMode) {
            return super.tokenIsEmpty
        }
        //子类重写了
        if (this.mappingCst) {
            if (this.mappingCst.tokens && this.mappingCst.tokens.length) {
                return false
            }
            if (this.mappingCst.children && this.mappingCst.children.length) {
                return false
            }
        }
        return true
    }

    printTokens() {
        QqqqUtil.log('tokens:' + this.tokens.map(item => item.tokenName).join(','))
    }

    get tokens() {
        if (this.isParserMode) return super.tokens
        if (this.tokenIsEmpty) return []
        let tokens = []
        if (this.mappingCst.tokens && this.mappingCst.tokens.length) {
            tokens = this.mappingCst.tokens
        }
        let children = []
        if (this.mappingCst.children && this.mappingCst.children.length) {
            children = this.mappingCst.children.map(item => new SubhutiMatchToken({
                tokenName: item.name,
                tokenValue: item.value
            }))
        }
        const allTokens = [...tokens, ...children]
        return allTokens
    }

    //语法token
    generateToken(tokenName: string): SubhutiMatchToken {
        //内部consume,也需要把标识设为false，有可能深层子设为了true，但是后来又改为了false，如果不同步改就会没同步
        this.setContinueMatchAndNoBreak(false)
        if (!this.mappingCst) {
            throw new Error('aflsdfdsa')
        }
        if (!this.mappingCst.tokens || !this.mappingCst.tokens.length) {
            return
        }
        // let
        // 在子节点中找到并删除
        const mappingTokens = this.mappingCst.tokens // 获取映射CST的子节点
        if (!mappingTokens || !mappingTokens.length) { // 如果没有子节点
            return // 直接返回
        }
        const mappingChildren = this.mappingCst.children // 获取映射CST的子节点
        if (!mappingChildren || !mappingChildren.length) { // 如果没有子节点
            return // 直接返回
        }

        const findChildTokenIndex = mappingTokens.findIndex(item => item.tokenName === tokenName) // 查找子节点中匹配的token名称的索引
        if (findChildTokenIndex < 0) { // 如果没有找到匹配的子节点
            return // 直接返回
        }

        const findChildIndex = mappingChildren.findIndex(item => item.name === tokenName) // 查找子节点中匹配的token名称的索引
        if (findChildIndex < 0) { // 如果没有找到匹配的子节点
            return // 直接返回
        }

        // 在父元素中删除
        const childToken = mappingTokens.splice(findChildTokenIndex, 1)[0] // 从子节点中删除匹配的节点并获取
        const child = mappingChildren.splice(findChildIndex, 1)[0] // 从子节点中删除匹配的节点并获取

        //子token中删除，子child中也删除，没问题，即使token中不是全量，也是当前节点的全量
        if (!childToken || !child) { // 如果删除的节点不存在
            //因为CheckMethodCanExec 中组织了空token，所以这里不会触发
            //内部consume,也需要把标识设为false，有可能深层子设为了true，但是后来又改为了false，如果不同步改就会没同步
            // this.setContinueFor(false);
            if (this.allowError) {
                return
            }
            throw new Error('syntax error')
        }

        this.setContinueMatchAndNoBreak(true)

        let popToken = new SubhutiMatchToken({ // 创建一个新的匹配token
            tokenName: childToken.tokenName, // 设置token名称为CST节点名称
            tokenValue: childToken.tokenValue // 设置token值为CST节点值
        })
        return popToken
    }

    consumeToken(tokenName: string): SubhutiCst {
        if (this.isParserMode) {
            return super.consumeToken(tokenName)
        }
        let popToken = this.generateToken(tokenName)
        if (popToken) {
            return this.generateCstByToken(popToken)
        }
        return
    }

    onlyConsume(tokenName: SubhutiCreateToken) {
        let popToken = this.generateToken(tokenName.name)
        return popToken
    }

    exec(cst: SubhutiCst = this.getCurCst(), code = '') {
        if (this.isParserMode) {
            return super.exec(cst, code)
        }
        const newCst = this[cst.name]()
        if (!newCst) {
            throw new Error('语法错误')
        }
        this.setGeneratorMode(false)
        return super.exec(newCst, code)
    }
}
