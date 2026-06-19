



































export interface RuleStats {
    ruleName: string
    totalCalls: number
    actualExecutions: number
    cacheHits: number
    totalTime: number
    executionTime: number
    avgTime: number
}




























































































































































































































import type SubhutiCst from "./struct/SubhutiCst.ts"
import {
    type RuleStackItem,
    SubhutiDebugRuleTracePrint,
    TreeFormatHelper,
} from "./SubhutiDebugRuleTracePrint"





















export class SubhutiDebugUtils {

















    static collectTokens(node: SubhutiCst): string[] {
        const values: string[] = []

        if (!node) return values

        if (node.value !== undefined && (!node.children || node.children.length === 0)) {
            values.push(node.value)
        }

        if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
                values.push(...SubhutiDebugUtils.collectTokens(child))
            }
        }

        return values
    }


















    static validateTokenCompleteness(
        cst: any,
        inputTokens: string[] | any[]
    ): {
        complete: boolean
        inputCount: number
        cstCount: number
        inputTokens: string[]
        cstTokens: string[]
        missing: string[]
    } {

        const inputValues = inputTokens.map(t =>
            typeof t === 'string' ? t : (t.tokenValue || '')
        ).filter(v => v !== '')

        const cstTokens = SubhutiDebugUtils.collectTokens(cst)


        const missing: string[] = []
        for (let i = 0; i < inputValues.length; i++) {
            if (i >= cstTokens.length || inputValues[i] !== cstTokens[i]) {
                missing.push(inputValues[i])
            }
        }

        return {
            complete: missing.length === 0 && inputValues.length === cstTokens.length,
            inputCount: inputValues.length,
            cstCount: cstTokens.length,
            inputTokens: inputValues,
            cstTokens: cstTokens,
            missing: missing
        }
    }












    static validateStructure(
        node: any,
        path: string = 'root'
    ): Array<{ path: string, issue: string, node?: any }> {
        const errors: Array<{ path: string, issue: string, node?: any }> = []

        if (node === null) {
            errors.push({ path, issue: 'Node is null' })
            return errors
        }

        if (node === undefined) {
            errors.push({ path, issue: 'Node is undefined' })
            return errors
        }

        if (!node.name && node.value === undefined) {
            errors.push({
                path,
                issue: 'Node has neither name nor value',
                node: { ...node, children: node.children ? `[${node.children.length} children]` : undefined }
            })
        }

        if (node.children !== undefined) {
            if (!Array.isArray(node.children)) {
                errors.push({
                    path,
                    issue: `children is not an array (type: ${typeof node.children})`,
                    node: { name: node.name, childrenType: typeof node.children }
                })
                return errors
            }

            node.children.forEach((child: any, index: number) => {
                const childPath = `${path}.children[${index}]`

                if (child === null) {
                    errors.push({ path: childPath, issue: 'Child is null' })
                    return
                }

                if (child === undefined) {
                    errors.push({ path: childPath, issue: 'Child is undefined' })
                    return
                }

                const childErrors = SubhutiDebugUtils.validateStructure(child, childPath)
                errors.push(...childErrors)
            })
        }

        if (node.value !== undefined && node.children && node.children.length > 0) {
            errors.push({
                path,
                issue: `Leaf node has both value and non-empty children`,
                node: { name: node.name, value: node.value, childrenCount: node.children.length }
            })
        }

        return errors
    }







    static getCSTStatistics(node: any): {
        totalNodes: number
        leafNodes: number
        maxDepth: number
        nodeTypes: Map<string, number>
    } {
        const stats = {
            totalNodes: 0,
            leafNodes: 0,
            maxDepth: 0,
            nodeTypes: new Map<string, number>()
        }

        const traverse = (node: any, depth: number) => {
            if (!node) return

            stats.totalNodes++
            stats.maxDepth = Math.max(stats.maxDepth, depth)

            if (node.name) {
                stats.nodeTypes.set(node.name, (stats.nodeTypes.get(node.name) || 0) + 1)
            }

            if (!node.children || node.children.length === 0) {
                stats.leafNodes++
            } else {
                for (const child of node.children) {
                    traverse(child, depth + 1)
                }
            }
        }

        traverse(node, 0)
        return stats
    }









    static formatCst(cst: SubhutiCst, prefix: string = '', isLast: boolean = true): string {
        const lines: string[] = []


        const connector = isLast ? '└─' : '├─'
        const nodeLine = SubhutiDebugUtils.formatNode(cst, prefix, connector)
        lines.push(nodeLine)


        if (cst.children && cst.children.length > 0) {
            const childPrefix = prefix + (isLast ? '   ' : '│  ')

            cst.children.forEach((child: any, index: number) => {
                const isLastChild = index === cst.children!.length - 1
                lines.push(SubhutiDebugUtils.formatCst(child, childPrefix, isLastChild))
            })
        }

        return lines.join('\n')
    }




    private static formatNode(cst: SubhutiCst, prefix: string, connector: string): string {
        const isToken = cst.value !== undefined

        if (isToken) {

            const value = TreeFormatHelper.formatTokenValue(cst.value ?? '')
            const location = cst.loc ? TreeFormatHelper.formatLocation(cst.loc) : null

            return TreeFormatHelper.formatLine(
                [connector, cst.name + ':', '"' + value + '"', location].join(''),
                { prefix }
            )
        } else {

            return TreeFormatHelper.formatLine(
                [connector, cst.name].join(''),
                { prefix }
            )
        }
    }



































    static bisectDebug(
        tokens: any[],
        ParserClass: new (tokens: any[]) => any,
        levels: Array<{
            name: string
            call: (parser: any) => any
        }>,
        options?: {
            enableDebugOnLastLevel?: boolean
            stopOnFirstError?: boolean
            showStackTrace?: boolean
            stackTraceLines?: number
        }
    ): void {

        const opts = {
            enableDebugOnLastLevel: true,
            stopOnFirstError: true,
            showStackTrace: true,
            stackTraceLines: 10,
            ...options
        }

        console.log('\n🔬 二分增量调试模式')
        console.log('='.repeat(80))
        console.log('策略：从最底层规则逐层测试，找出问题层级\n')

        for (let i = 0; i < levels.length; i++) {
            const level = levels[i]

            console.log(`\n[${'▸'.repeat(i + 1)}] 测试层级 ${i + 1}: ${level.name}`)
            console.log('-'.repeat(80))

            try {

                const parser = new ParserClass(tokens)


                if (opts.enableDebugOnLastLevel && i === levels.length - 1) {
                    if (typeof parser.debug === 'function') {
                        parser.debug()
                    }
                }

                const result = level.call(parser)

                if (!result) {
                    console.log(`\n⚠️ ${level.name} 返回 undefined`)
                    continue
                }


                const validation = SubhutiDebugUtils.validateTokenCompleteness(result, tokens)

                if (validation.complete) {
                    console.log(`\n✅ ${level.name} 解析成功（Token完整: ${validation.cstCount}/${validation.inputCount}）`)
                } else {
                    console.log(`\n❌ ${level.name} Token不完整`)
                    console.log(`   输入tokens: ${validation.inputCount} 个`)
                    console.log(`   CST tokens:  ${validation.cstCount} 个`)
                    console.log(`   输入列表: [${validation.inputTokens.join(', ')}]`)
                    console.log(`   CST列表:  [${validation.cstTokens.join(', ')}]`)

                    if (validation.missing.length > 0) {
                        console.log(`   ❌ 缺失或错位: [${validation.missing.join(', ')}]`)
                    }

                    console.log(`\n🔍 问题定位: ${level.name} 未能消费所有token`)

                    if (i > 0) {
                        console.log(`   ⚠️ 前一层级（${levels[i - 1].name}）也可能有问题`)
                        console.log(`   💡 建议: 检查 ${level.name} 和 ${levels[i - 1].name} 的实现`)
                    } else {
                        console.log(`   💡 建议: 检查 ${level.name} 的实现，确保所有token都被正确处理`)
                    }

                    if (opts.stopOnFirstError) {
                        return
                    }
                }
            } catch (error: any) {
                console.log(`\n❌ ${level.name} 解析失败`)
                console.log(`   错误: ${error.message}`)
                console.log(`\n🔍 问题定位: ${level.name} 层级出现错误`)

                if (i > 0) {
                    console.log(`   ✅ 前一层级（${levels[i - 1].name}）可以工作`)
                    console.log(`   ❌ 当前层级（${level.name}）出现问题`)
                    console.log(`\n💡 建议: 检查 ${level.name} 的实现，特别是它如何调用 ${levels[i - 1].name}`)
                } else {
                    console.log(`   ❌ 最底层规则（${level.name}）就已经失败`)
                    console.log(`\n💡 建议: 检查 ${level.name} 的实现和 token 定义`)
                }


                if (opts.showStackTrace && error.stack) {
                    console.log(`\n📋 堆栈跟踪（前${opts.stackTraceLines}行）:`)
                    const stackLines = error.stack.split('\n').slice(0, opts.stackTraceLines)
                    stackLines.forEach((line: string) => console.log(`   ${line}`))
                }

                if (opts.stopOnFirstError) {
                    return
                }
            }
        }

        console.log('\n' + '='.repeat(80))
        console.log('🎉 所有层级测试通过！')
        console.log('='.repeat(80))
    }
}





export class SubhutiTraceDebugger {



    public ruleStack: RuleStackItem[] = []




    private stats = new Map<string, RuleStats>()




    private rulePathCache = new Map<string, RuleStackItem>()




    private inputTokens: any[] = []




    private topLevelCst: SubhutiCst | null = null






    constructor(tokens?: any[]) {
        this.inputTokens = this.extractValidTokens(tokens || [])
    }











    resetForNewParse(tokens?: any[]): void {

        this.rulePathCache.clear()


        this.stats.clear()


        if (tokens) {

            this.inputTokens = this.extractValidTokens(tokens)
        }

    }






    private extractValidTokens(tokens: any[]): any[] {
        const excludeNames = ['SingleLineComment', 'MultiLineComment', 'Spacing', 'LineBreak']
        return tokens.filter(t => {
            const name = t.tokenName || ''
            return excludeNames.indexOf(name) === -1
        })
    }




    private deepCloneRuleStackItem(item: RuleStackItem): RuleStackItem {
        if (item.ruleName) {
            if (!item.childs || !item.childs.length) {
                throw new Error('系统错误')
            }
        }
        const clone: RuleStackItem = {
            ruleName: item.ruleName,
            tokenName: item.tokenName,
            tokenValue: item.tokenValue,
            startTime: item.startTime,
            outputted: item.outputted,
            tokenIndex: item.tokenIndex,
            tokenSuccess: item.tokenSuccess,
            tokenExpectName: item.tokenExpectName,
            shouldBreakLine: item.shouldBreakLine,
            displayDepth: item.displayDepth,
            childs: item.childs,


            orBranchInfo: item.orBranchInfo ? {
                orIndex: item.orBranchInfo.orIndex,
                branchIndex: item.orBranchInfo.branchIndex,
                isOrEntry: item.orBranchInfo.isOrEntry,
                isOrBranch: item.orBranchInfo.isOrBranch,
                totalBranches: item.orBranchInfo.totalBranches
            } : undefined
        }
        return clone
    }








    private generateCacheKey(item: RuleStackItem): string {

        const ruleName = item.ruleName
        const tokenIndex = item.tokenIndex.toString()

        const isOrEntry = item.orBranchInfo ? (item.orBranchInfo.isOrEntry ? '1' : '0') : '0'
        const isOrBranch = item.orBranchInfo ? (item.orBranchInfo.isOrBranch ? '1' : '0') : '0'
        const orIndex = item.orBranchInfo?.orIndex?.toString() ?? '-1'
        const branchIndex = item.orBranchInfo?.branchIndex?.toString() ?? '-1'

        const tokenValue = item.tokenValue ?? ''
        const tokenName = item.tokenName ?? ''
        const tokenExpectName = item.tokenExpectName ?? ''
        const tokenSuccess = item.tokenSuccess ?? false

        return `${ruleName}:${tokenIndex}:${isOrEntry}:${isOrBranch}:${orIndex}:${branchIndex}:${tokenValue}:${tokenName}:${tokenExpectName}:${tokenSuccess}`
    }

    private createTokenItem(tokenIndex: number, tokenValue: string, tokenName: string, expectName: string, success: boolean): RuleStackItem {

        return {
            ruleName: undefined,
            tokenSuccess: success,
            tokenExpectName: expectName,
            startTime: 0,
            outputted: false,
            tokenIndex: tokenIndex,
            shouldBreakLine: true,

            tokenValue: tokenValue,
            tokenName: tokenName,
        }
    }









    private restoreFromCacheAndPushAndPrint(cacheKey: string, displayDepth: number, OrBranchNeedNewLine: boolean, isRoot: boolean = true): RuleStackItem {

        const cached = this.cacheGet(cacheKey)
        if (!cached) {
            throw new Error('系统错误')
        }


        const restoredItem = this.deepCloneRuleStackItem(cached)

        restoredItem.outputted = false
        restoredItem.isManuallyAdded = true
        restoredItem.shouldBreakLine = false

        OrBranchNeedNewLine = false

        const lastRowShouldBreakLine = this.ruleStack[this.ruleStack.length - 1].shouldBreakLine

        let tempBreakLine = false
        if (isRoot) {
            displayDepth++
            restoredItem.shouldBreakLine = true
        } else if (OrBranchNeedNewLine) {
            displayDepth++
            restoredItem.shouldBreakLine = true
        } else if (restoredItem.tokenExpectName) {
            displayDepth++
            restoredItem.shouldBreakLine = true
        } else if (restoredItem.orBranchInfo && restoredItem.orBranchInfo.isOrEntry && restoredItem.childs && restoredItem.childs.length > 1) {
            displayDepth++
            restoredItem.shouldBreakLine = true
            OrBranchNeedNewLine = true
        } else if (['UpdateExpression'].indexOf(restoredItem.ruleName ?? '') > -1) {
            displayDepth++
            restoredItem.shouldBreakLine = true
        } else if (lastRowShouldBreakLine) {

            displayDepth++
            tempBreakLine = true
        }

        restoredItem.displayDepth = displayDepth


        if (OrBranchNeedNewLine && restoredItem.orBranchInfo) {
            OrBranchNeedNewLine = restoredItem.orBranchInfo.isOrBranch || false
        }


        let childBeginIndex = this.ruleStack.push(restoredItem)



        if (cached.childs) {
            let i = 0
            for (const childKey of cached.childs) {
                const nextItem = this.restoreFromCacheAndPushAndPrint(childKey, displayDepth, OrBranchNeedNewLine, false)

                if (!isRoot && i === 0 && lastRowShouldBreakLine && !restoredItem.shouldBreakLine && nextItem.shouldBreakLine) {
                    this.ruleStack.splice(childBeginIndex)

                    if (!tempBreakLine) {
                        displayDepth++
                    }
                    restoredItem.shouldBreakLine = true
                    restoredItem.displayDepth = displayDepth
                    this.restoreFromCacheAndPushAndPrint(childKey, displayDepth, OrBranchNeedNewLine, false)
                }
                i++
            }
        }



        if (isRoot) {
            SubhutiDebugRuleTracePrint.flushPendingOutputs_Cache_Impl(this.ruleStack)
            this.ruleStack.splice(childBeginIndex)
        }

        return restoredItem
    }







    openDebugLogCache = true














    onRuleEnter(ruleName: string, tokenIndex: number): number {

        const startTime = performance.now()




        let stat = this.stats.get(ruleName)
        if (!stat) {

            stat = {
                ruleName,
                totalCalls: 0,
                actualExecutions: 0,
                cacheHits: 0,
                totalTime: 0,
                executionTime: 0,
                avgTime: 0
            }
            this.stats.set(ruleName, stat)
        }

        stat.totalCalls++


        const ruleItem: RuleStackItem = {
            ruleName,

            tokenIndex,
            startTime,
            outputted: false,
            childs: []
        }

        if (this.openDebugLogCache) {

            const cacheKey = this.generateCacheKey(ruleItem)


            const RuleStackItem = this.cacheGet(cacheKey)


            if (RuleStackItem) {
                let depth = SubhutiDebugRuleTracePrint.flushPendingOutputs_NonCache_Impl(this.ruleStack)

                this.restoreFromCacheAndPushAndPrint(cacheKey, depth, false)

                return startTime
            }
        }







        this.ruleStack.push(ruleItem)



        return startTime
    }












    onRuleExitWithTopLevel(
        ruleName: string,
        cst: SubhutiCst | undefined,
        isTopLevel: boolean,
        cacheHit: boolean,
        startTime?: number
    ): void {

        if (cst && !cst.children?.length) {
            cst.children = undefined
        }

        if (!isTopLevel) {

            this.onRuleExit(ruleName, cacheHit, startTime)
        } else {

            this.setCst(cst)
            this.autoOutput()
        }
    }

    onRuleExit(
        ruleName: string,
        cacheHit: boolean,
        startTime?: number
    ): void {
        let duration = 0
        if (startTime !== undefined && typeof startTime === 'number') {
            duration = performance.now() - startTime
        }


        if (this.ruleStack.length === 0) {
            throw new Error(`❌ Rule exit error: ruleStack is empty when exiting ${ruleName}`)
        }
        const curRule = this.ruleStack.pop()


        if (!curRule || curRule.ruleName !== ruleName) {
            throw new Error(
                `❌ Rule exit mismatch: expected ${ruleName} at top, got ${curRule?.ruleName || 'undefined'}`
            )
        }




        const stat = this.stats.get(ruleName)
        if (stat) {
            stat.totalTime += duration

            if (cacheHit) {
                stat.cacheHits++
            } else {
                stat.actualExecutions++
                stat.executionTime += duration

                if (stat.actualExecutions > 0) {
                    stat.avgTime = stat.executionTime / stat.actualExecutions
                }
            }
        }


        if (!curRule.outputted) {
            return
        }


        const cacheKey = this.generateCacheKey(curRule)



        const parentItem = this.ruleStack[this.ruleStack.length - 1]


        if (parentItem) {

            if (!parentItem.childs) {
                throw new Error(
                    `❌ Parent rule ${parentItem.ruleName} does not have childs array when exiting rule ${ruleName}`
                )
            }



            if (parentItem.childs.some(key => key === cacheKey)) {
                console.log(`  ❌ 重复检测：规则 ${ruleName} 已存在于父节点的 childs 中`)
                console.log(`  父节点的所有子节点键:`)
                parentItem.childs.forEach((key, idx) => {
                    console.log(`    [${idx}] ${key}`)
                })
                throw new Error(
                    `❌ Rule ${ruleName} already exists in parent rule ${parentItem.ruleName}'s childs`
                )
            }


            this.parentPushChild(parentItem, cacheKey)
        }

        const cacheCurRule = this.cacheGet(cacheKey)


        if (!cacheCurRule) {
            const cloned = this.deepCloneRuleStackItem(curRule)
            this.cacheSet(cacheKey, cloned)
        }
    }

    cacheSet(key: string, value: RuleStackItem) {
        if (!value.tokenExpectName) {
            if (!value.childs || value.childs?.length === 0) {
                throw new Error('bugai wei 0')
            }
        }
        this.rulePathCache.set(key, value)
    }

    cacheGet(key: string) {
        const res = this.rulePathCache.get(key)
        return res
    }

    onTokenConsume(
        tokenIndex: number,
        tokenValue: string,
        tokenName: string,
        expectName: string,
        success: boolean
    ): void {

        if (this.ruleStack.length === 0) {
            throw new Error(`❌ Token consume error: ruleStack is empty when consuming token ${tokenName}`)
        }

        const parentRule = this.ruleStack[this.ruleStack.length - 1]

        if (!success) {

            if (tokenIndex <= parentRule.tokenIndex) {
                return
            }
        }


        const tokenItem = this.createTokenItem(tokenIndex, tokenValue, tokenName, expectName, success)
        const tokenKey = this.generateCacheKey(tokenItem)


        if (!this.rulePathCache.has(tokenKey)) {
            this.cacheSet(tokenKey, this.deepCloneRuleStackItem(tokenItem))
        }


        if (!parentRule.childs) {
            throw new Error(
                `❌ Parent rule ${parentRule.ruleName} does not have childs array when consuming token ${tokenName}`
            )
        }


        if (parentRule.childs.some(key => key === tokenKey)) {
            throw new Error(
                `❌ Token ${tokenName} already exists in parent rule ${parentRule.ruleName}'s childs`
            )
        }


        this.parentPushChild(parentRule, tokenKey)



        const depth = SubhutiDebugRuleTracePrint.flushPendingOutputs_NonCache_Impl(this.ruleStack)


        const token = this.inputTokens[tokenIndex]

        let location: string | null = null

        if (success) {
            if (token) {
                if (token.loc) {

                    location = TreeFormatHelper.formatLocation(token.loc)
                } else if (token.rowNum !== undefined && token.columnStartNum !== undefined) {

                    const row = token.rowNum
                    const start = token.columnStartNum
                    const end = token.columnEndNum ?? start + tokenValue.length - 1
                    location = `[${row}:${start}-${end}]`
                }
            }
        }

        const tokenStr = SubhutiDebugRuleTracePrint.getPrintToken(tokenItem, location ?? undefined)
        const line = SubhutiDebugRuleTracePrint.formatLine(tokenStr, depth)
        SubhutiDebugRuleTracePrint.consoleLog(line)
    }

    onOrEnter(
        parentRuleName: string,
        tokenIndex: number
    ): void {



        let orIndex = 0
        if (this.ruleStack.length > 0) {
            const parentRule = this.ruleStack[this.ruleStack.length - 1]
            if (parentRule.childs) {

                for (const childKey of parentRule.childs) {
                    const childItem = this.cacheGet(childKey)
                    if (childItem && childItem.orBranchInfo?.isOrEntry) {
                        orIndex++
                    }
                }
            }
        }



        this.ruleStack.push({
            ruleName: parentRuleName,
            startTime: performance.now(),
            outputted: false,

            shouldBreakLine: true,
            tokenIndex,
            childs: [],
            orBranchInfo: {
                orIndex,
                isOrEntry: true,
                isOrBranch: false,
                startTokenIndex: tokenIndex,
                branchAttempts: []
            }
        })
    }

    onOrExit(
        parentRuleName: string
    ): void {

        if (this.ruleStack.length === 0) {
            throw new Error(`❌ Or exit error: ruleStack is empty when exiting Or for ${parentRuleName}`)
        }

        const curOrNode = this.ruleStack.pop()!


        if (!(curOrNode.ruleName === parentRuleName
            && curOrNode.orBranchInfo
            && curOrNode.orBranchInfo.isOrEntry
            && !curOrNode.orBranchInfo.isOrBranch
        )) {
            const orInfo = curOrNode.orBranchInfo
                ? `(entry=${curOrNode.orBranchInfo.isOrEntry}, branch=${curOrNode.orBranchInfo.isOrBranch})`
                : '(no orBranchInfo)'
            throw new Error(`❌ Or exit mismatch: expected ${parentRuleName}(OrEntry) at top, got ${curOrNode.ruleName}${orInfo}`)
        }


        if (!curOrNode.outputted) {
            return
        }


        const cacheKey = this.generateCacheKey(curOrNode)


        const parentItem = this.ruleStack[this.ruleStack.length - 1]


        if (parentItem) {

            if (!parentItem.childs) {
                throw new Error(
                    `❌ Parent rule ${parentItem.ruleName} does not have childs array when exiting Or ${parentRuleName}`
                )
            }


            if (parentItem.childs.some(key => key === cacheKey)) {
                throw new Error(
                    `❌ ${cacheKey} Or ${parentRuleName} already exists in parent rule ${parentItem.ruleName}'s childs`
                )
            }


            this.parentPushChild(parentItem, cacheKey)
        }


        const cachedOrNode = this.cacheGet(cacheKey)
        if (!cachedOrNode) {
            const cloned = this.deepCloneRuleStackItem(curOrNode)
            this.cacheSet(cacheKey, cloned)
        }
    }

    onOrBranch(
        branchIndex: number,
        totalBranches: number,
        parentRuleName: string
    ): void {



        const tokenIndex = this.ruleStack.length > 0
            ? (this.ruleStack[this.ruleStack.length - 1]?.tokenIndex ?? 0)
            : 0


        let orIndex: number | undefined = undefined
        if (this.ruleStack.length > 0) {
            const parentOrEntry = this.ruleStack[this.ruleStack.length - 1]
            if (parentOrEntry.orBranchInfo?.isOrEntry) {
                orIndex = parentOrEntry.orBranchInfo.orIndex
            }
        }



        this.ruleStack.push({
            ruleName: parentRuleName,
            startTime: performance.now(),
            outputted: false,
            tokenIndex,
            childs: [],
            orBranchInfo: {
                orIndex,
                isOrEntry: false,
                isOrBranch: true,
                branchIndex,
                totalBranches
            }
        })
    }

    onOrBranchExit(
        parentRuleName: string,
        branchIndex: number
    ): void {

        if (this.ruleStack.length === 0) {
            throw new Error(`❌ OrBranch exit error: ruleStack is empty when exiting branch ${branchIndex} for ${parentRuleName}`)
        }


        const curBranchNode = this.ruleStack.pop()!


        if (!(curBranchNode.ruleName === parentRuleName
            && curBranchNode.orBranchInfo
            && curBranchNode.orBranchInfo.isOrBranch
            && !curBranchNode.orBranchInfo.isOrEntry
            && curBranchNode.orBranchInfo.branchIndex === branchIndex
        )) {
            const info = curBranchNode.orBranchInfo
            const infoStr = info
                ? `(entry=${info.isOrEntry}, branch=${info.isOrBranch}, idx=${info.branchIndex})`
                : '(no orInfo)'
            throw new Error(`❌ OrBranch exit mismatch: expected ${parentRuleName}(branchIdx=${branchIndex}) at top, got ${curBranchNode.ruleName}${infoStr}`)
        }


        if (!curBranchNode.outputted) {
            return
        }


        const cacheKey = this.generateCacheKey(curBranchNode)


        const parentOrNode = this.ruleStack[this.ruleStack.length - 1]


        if (parentOrNode) {

            if (!parentOrNode.childs) {
                throw new Error(
                    `❌ Parent Or node ${parentOrNode.ruleName} does not have childs array when exiting branch ${branchIndex}`
                )
            }


            if (parentOrNode.childs.some(key => key === cacheKey)) {
                throw new Error(
                    `❌ OrBranch ${branchIndex} already exists in parent Or node ${parentOrNode.ruleName}'s childs`
                )
            }


            this.parentPushChild(parentOrNode, cacheKey)
        }


        const cachedBranchNode = this.cacheGet(cacheKey)
        if (!cachedBranchNode) {
            const cloned = this.deepCloneRuleStackItem(curBranchNode)
            this.cacheSet(cacheKey, cloned)
        }
    }















    private collectTokenValues(node: SubhutiCst): string[] {
        return SubhutiDebugUtils.collectTokens(node)
    }




    private checkTokenCompleteness(cst: SubhutiCst): {
        input: string[]
        cst: string[]
        missing: string[]
    } {
        const result = SubhutiDebugUtils.validateTokenCompleteness(cst, this.inputTokens)
        return {
            input: result.inputTokens,
            cst: result.cstTokens,
            missing: result.missing
        }
    }




    private validateStructure(node: any, path: string = 'root'): Array<{ path: string, issue: string, node?: any }> {
        return SubhutiDebugUtils.validateStructure(node, path)
    }




    private getCSTStatistics(node: any): {
        totalNodes: number
        leafNodes: number
        maxDepth: number
        nodeTypes: Map<string, number>
    } {
        return SubhutiDebugUtils.getCSTStatistics(node)
    }








    static collectTokens = SubhutiDebugUtils.collectTokens




    static validateTokenCompleteness = SubhutiDebugUtils.validateTokenCompleteness








    private getSummary(): string {
        const allStats = Array.from(this.stats.values())

        if (allStats.length === 0) {
            return '📊 性能摘要：无数据'
        }


        const totalCalls = allStats.reduce((sum, s) => sum + s.totalCalls, 0)
        const totalExecutions = allStats.reduce((sum, s) => sum + s.actualExecutions, 0)
        const totalCacheHits = allStats.reduce((sum, s) => sum + s.cacheHits, 0)
        const totalTime = allStats.reduce((sum, s) => sum + s.totalTime, 0)
        const cacheHitRate = totalCalls > 0 ? (totalCacheHits / totalCalls * 100).toFixed(1) : '0.0'

        const lines: string[] = []
        lines.push('⏱️  性能摘要')
        lines.push('─'.repeat(40))
        lines.push(`总耗时: ${totalTime.toFixed(2)}ms`)
        lines.push(`总调用: ${totalCalls.toLocaleString()} 次`)
        lines.push(`实际执行: ${totalExecutions.toLocaleString()} 次`)
        lines.push(`缓存命中: ${totalCacheHits.toLocaleString()} 次 (${cacheHitRate}%)`)
        lines.push('')


        const top5 = allStats
            .filter(s => s.actualExecutions > 0)
            .sort((a, b) => b.executionTime - a.executionTime)
            .slice(0, 5)

        if (top5.length > 0) {
            lines.push('Top 5 慢规则:')
            top5.forEach((stat, i) => {
                const avgUs = (stat.avgTime * 1000).toFixed(1)
                lines.push(
                    `  ${i + 1}. ${stat.ruleName}: ${stat.executionTime.toFixed(2)}ms ` +
                    `(${stat.totalCalls}次, 平均${avgUs}μs)`
                )
            })
        }

        return lines.join('\n')
    }








    setCst(cst: SubhutiCst | undefined): void {
        this.topLevelCst = cst || null
    }

    parentPushChild(parent: RuleStackItem, child: string) {
        parent.childs!.push(child)
    }







    autoOutput(): void {
        console.log('\n' + '='.repeat(60))
        console.log('🔍 Subhuti Debug 输出')
        console.log('='.repeat(60))




        console.log('\n【第一部分：性能摘要】')
        console.log('─'.repeat(60))
        console.log('\n' + this.getSummary())


        console.log('\n📋 所有规则详细统计:')
        const allStats = Array.from(this.stats.values())
            .sort((a, b) => b.executionTime - a.executionTime)

        allStats.forEach((stat) => {
            const cacheRate = stat.totalCalls > 0
                ? (stat.cacheHits / stat.totalCalls * 100).toFixed(1)
                : '0.0'
            console.log(
                `  ${stat.ruleName}: ${stat.totalCalls}次 | ` +
                `执行${stat.actualExecutions}次 | ` +
                `耗时${stat.executionTime.toFixed(2)}ms | ` +
                `缓存${cacheRate}%`
            )
        })

        console.log('\n' + '='.repeat(60))




        if (this.topLevelCst) {
            console.log('\n【第二部分：CST 验证报告】')
            console.log('─'.repeat(60))
            console.log('\n🔍 CST 验证报告')
            console.log('─'.repeat(60))


            const structureErrors = this.validateStructure(this.topLevelCst)
            console.log(`\n📌 结构完整性: ${structureErrors.length === 0 ? '✅' : '❌'}`)

            if (structureErrors.length > 0) {
                console.log(`   发现 ${structureErrors.length} 个错误:`)
                structureErrors.forEach((err, i) => {
                    console.log(`\n   [${i + 1}] ${err.path}`)
                    console.log(`       问题: ${err.issue}`)
                    if (err.node) {
                        const nodeStr = JSON.stringify(err.node, null, 2)
                            .split('\n')
                            .map(line => `       ${line}`)
                            .join('\n')
                        console.log(nodeStr)
                    }
                })
            } else {
                console.log('   无结构错误')
            }


            const tokenResult = this.checkTokenCompleteness(this.topLevelCst)
            console.log(`\n📌 Token 完整性: ${tokenResult.missing.length === 0 ? '✅' : '❌'}`)
            console.log(`   输入 tokens: ${tokenResult.input.length} 个`)
            console.log(`   CST tokens:  ${tokenResult.cst.length} 个`)
            console.log(`   输入列表: [${tokenResult.input.join(', ')}]`)
            console.log(`   CST列表:  [${tokenResult.cst.join(', ')}]`)

            if (tokenResult.missing.length > 0) {
                console.log(`   ❌ 缺失: [${tokenResult.missing.join(', ')}]`)
            } else {
                console.log(`   ✅ 完整保留`)
            }


            const stats = this.getCSTStatistics(this.topLevelCst)
            console.log(`\n📌 CST 统计:`)
            console.log(`   总节点数: ${stats.totalNodes}`)
            console.log(`   叶子节点: ${stats.leafNodes}`)
            console.log(`   最大深度: ${stats.maxDepth}`)
            console.log(`   节点类型: ${stats.nodeTypes.size} 种`)


            console.log(`\n   节点类型分布:`)
            const sortedTypes = Array.from(stats.nodeTypes.entries())
                .sort((a, b) => b[1] - a[1])
            sortedTypes.forEach(([name, count]) => {
                console.log(`     ${name}: ${count}`)
            })

            console.log('─'.repeat(60))




            console.log('\n【第三部分：CST 可视化】')
            console.log('─'.repeat(60))
            console.log('\n📊 CST 结构')
            console.log('─'.repeat(60))
            console.log(SubhutiDebugUtils.formatCst(this.topLevelCst))
            console.log('─'.repeat(60))
        }

        console.log('\n' + '='.repeat(60))
        console.log('🎉 Debug 输出完成')
        console.log('='.repeat(60))
    }
}
