/**
 * PathExpander - 路径展开器
 * 
 * 职责：将规则 AST 展开为 token 路径
 * 核心功能：
 * - expandNode(): 展开任意节点
 * - expandSequenceNode(): 展开 Sequence 节点（笛卡尔积）
 * - expandOr(): 展开 Or 节点（合并分支）
 * - expandOption/expandAtLeastOne(): 展开重复节点
 */

import type {
    RuleNode,
    SequenceNode,
    SubruleNode,
    ConsumeNode,
    OrNode,
    ManyNode,
    OptionNode,
    AtLeastOneNode
} from '../types/SubhutiValidationError.ts'
import { EXPANSION_LIMITS } from '../constants/ExpansionLimits.ts'
import { PathUtils } from '../utils/PathUtils.ts'
import { PerformanceAnalyzer } from '../utils/PerformanceAnalyzer.ts'

export class PathExpander {
    private perfAnalyzer: PerformanceAnalyzer

    // 超时检测相关
    private operationStartTime: number = 0
    private currentProcessingRule: string = ''
    private timeoutSeconds: number = 1000

    constructor(
        private ruleASTs: Map<string, SequenceNode>,
        private tokenCache: Map<string, ConsumeNode>,
        perfAnalyzer: PerformanceAnalyzer
    ) {
        this.perfAnalyzer = perfAnalyzer
    }

    /**
     * 超时检测
     */
    checkTimeout(location: string): void {
        if (this.operationStartTime === 0) return

        const elapsed = Date.now() - this.operationStartTime
        if (elapsed > this.timeoutSeconds * 1000) {
            throw new Error(`操作超时 (${this.timeoutSeconds}秒): ${location}, 当前规则: ${this.currentProcessingRule}`)
        }
    }

    /**
     * 展开任意节点
     * 
     * 根据节点类型分发到对应的展开方法
     */
    expandNode(
        node: RuleNode,
        firstK: number,
        curLevel: number,
        maxLevel: number,
        isFirstPosition: boolean = false,
        expandCallback?: (ruleName: string, firstK: number, curLevel: number, maxLevel: number, isFirstPosition: boolean) => string[][]
    ): string[][] {
        const callId = this.perfAnalyzer.startMethod('expandNode')

        let result: string[][]
        switch (node.type) {
            case 'consume':
                // Token 节点：直接返回 token 名
                result = [[node.tokenName]]
                break

            case 'subrule':
                // 子规则引用：需要外部提供展开回调
                if (!expandCallback) {
                    throw new Error('expandCallback is required for subrule expansion')
                }
                result = expandCallback(node.ruleName, firstK, curLevel, maxLevel, isFirstPosition)
                break

            case 'or':
                // Or 节点：遍历所有分支，合并结果
                result = this.expandOr(node.alternatives, firstK, curLevel, maxLevel, isFirstPosition, expandCallback)
                break

            case 'sequence':
                // Sequence 节点：笛卡尔积组合子节点
                result = this.expandSequenceNode(node, firstK, curLevel, maxLevel, isFirstPosition, expandCallback)
                break

            case 'option':
            case 'many':
                // Option/Many 节点：0次或多次，添加空分支
                result = this.expandOption(node.node, firstK, curLevel, maxLevel, isFirstPosition, expandCallback)
                break

            case 'atLeastOne':
                // AtLeastOne 节点：1次或多次
                result = this.expandAtLeastOne(node.node, firstK, curLevel, maxLevel, isFirstPosition, expandCallback)
                break

            default:
                throw new Error(`未知节点类型: ${(node as any).type}`)
        }

        this.perfAnalyzer.endMethod(callId, undefined, result.length)
        return result
    }

    /**
     * 展开 Sequence 节点（笛卡尔积）
     */
    private expandSequenceNode(
        node: SequenceNode,
        firstK: number,
        curLevel: number,
        maxLevel: number,
        isFirstPosition: boolean = true,
        expandCallback?: (ruleName: string, firstK: number, curLevel: number, maxLevel: number, isFirstPosition: boolean) => string[][]
    ): string[][] {
        const callId = this.perfAnalyzer.startMethod('expandSequenceNode')
        this.checkTimeout('expandSequenceNode-开始')

        // 空序列
        if (node.nodes.length === 0) {
            return [[]]
        }

        // 计算需要展开的节点数量（考虑 option/many 不计入必需元素）
        let requiredCount = 0
        let expandToIndex = node.nodes.length

        for (let i = 0; i < node.nodes.length; i++) {
            const child = node.nodes[i]
            if (child.type !== 'option' && child.type !== 'many') {
                requiredCount++
                if (requiredCount >= firstK) {
                    expandToIndex = i + 1
                    break
                }
            }
        }

        const nodesToExpand = node.nodes.slice(0, expandToIndex)
        const allBranches: string[][][] = []
        let minLengthSum = 0

        for (let i = 0; i < nodesToExpand.length; i++) {
            this.checkTimeout(`expandSequenceNode-子节点${i + 1}`)

            const branches = this.expandNode(
                nodesToExpand[i],
                firstK,
                curLevel,
                maxLevel,
                isFirstPosition && i === 0,
                expandCallback
            )

            if (branches.length === 0) {
                return []
            }

            const truncatedBranches = branches.map(item => item.slice(0, firstK))
            allBranches.push(truncatedBranches)

            // 计算最短分支长度
            let minLength = Infinity
            for (const b of truncatedBranches) {
                const len = b.length
                if (len < minLength) {
                    minLength = len
                    if (minLength === 0) break
                }
            }

            minLengthSum += minLength

            // 如果累加的最短长度 >= firstK，可以停止
            if (minLengthSum >= firstK) {
                break
            }
        }

        if (allBranches.length === 0) {
            return []
        }

        this.checkTimeout('expandSequenceNode-笛卡尔积前')
        const result = this.cartesianProduct(allBranches, firstK)
        this.checkTimeout('expandSequenceNode-笛卡尔积后')

        const finalResult = PathUtils.truncateAndDeduplicate(result, firstK)

        this.perfAnalyzer.endMethod(callId, node.nodes.length, finalResult.length)
        return finalResult
    }

    /**
     * 笛卡尔积计算
     */
    private cartesianProduct(arrays: string[][][], firstK: number): string[][] {
        const callId = this.perfAnalyzer.startMethod('cartesianProduct')

        if (arrays.length === 0) {
            return [[]]
        }

        if (arrays.length === 1) {
            const result = arrays[0]
            this.perfAnalyzer.endMethod(callId, result.length, result.length)
            return result
        }

        const arrayFirst = arrays[0]
        let result = arrayFirst.filter(item => item.length < firstK)
        let finalResult = arrayFirst.filter(item => item.length >= firstK).map(item => item.join(EXPANSION_LIMITS.RuleJoinSymbol))
        const finalResultSet = new Set<string>(finalResult)

        for (let i = 1; i < arrays.length; i++) {
            this.checkTimeout(`cartesianProduct-数组${i}/${arrays.length}`)

            const currentArray = PathUtils.deduplicate(arrays[i])
            const temp: string[][] = []

            for (const seq of result) {
                const availableLength = firstK - seq.length

                if (availableLength === 0) {
                    const seqKey = seq.join(EXPANSION_LIMITS.RuleJoinSymbol)
                    finalResultSet.add(seqKey)
                    continue
                }

                const seqLength = seq.length
                const seqKey = seqLength > 0 ? seq.join(EXPANSION_LIMITS.RuleJoinSymbol) : ''
                const seqDeduplicateSet = new Set<string>()

                for (const branch of currentArray) {
                    const branchLength = branch.length
                    const truncatedBranch = branchLength <= availableLength
                        ? branch
                        : branch.slice(0, availableLength)
                    const truncatedLength = truncatedBranch.length
                    const branchKey = truncatedBranch.join(EXPANSION_LIMITS.RuleJoinSymbol)

                    if (seqDeduplicateSet.has(branchKey)) {
                        continue
                    }

                    seqDeduplicateSet.add(branchKey)
                    const combinedLength = seqLength + truncatedLength

                    if (combinedLength > firstK) {
                        throw new Error('系统错误：笛卡尔积拼接后长度超过限制')
                    }

                    if (combinedLength === firstK) {
                        const combinedKey = seqKey
                            ? (seqKey + EXPANSION_LIMITS.RuleJoinSymbol + branchKey)
                            : branchKey
                        finalResultSet.add(combinedKey)
                    } else {
                        const combined: string[] = new Array(combinedLength)
                        for (let j = 0; j < seqLength; j++) {
                            combined[j] = seq[j]
                        }
                        for (let j = 0; j < truncatedLength; j++) {
                            combined[seqLength + j] = truncatedBranch[j]
                        }
                        temp.push(combined)
                    }
                }
            }

            result = PathUtils.deduplicate(temp)

            if (result.length === 0 && finalResultSet.size > 0) {
                break
            }
        }

        let finalArray: string[][] = []
        for (const seqStr of finalResultSet) {
            if (seqStr === '') {
                finalArray.push([])
            } else {
                finalArray.push(seqStr.split(EXPANSION_LIMITS.RuleJoinSymbol))
            }
        }

        finalArray = finalArray.concat(result)
        const deduplicatedFinalArray = PathUtils.deduplicate(finalArray)

        for (const resultElement of deduplicatedFinalArray) {
            if (resultElement.length > firstK) {
                throw new Error('系统错误：最终结果长度超过限制')
            }
        }

        const inputSize = arrays.reduce((sum, arr) => sum + arr.length, 0)
        this.perfAnalyzer.endMethod(callId, inputSize, deduplicatedFinalArray.length)

        return deduplicatedFinalArray
    }

    /**
     * 展开 Or 节点（合并所有分支）
     */
    private expandOr(
        alternatives: RuleNode[],
        firstK: number,
        curLevel: number,
        maxLevel: number,
        isFirstPosition: boolean = true,
        expandCallback?: (ruleName: string, firstK: number, curLevel: number, maxLevel: number, isFirstPosition: boolean) => string[][]
    ): string[][] {
        const callId = this.perfAnalyzer.startMethod('expandOr')

        if (alternatives.length === 0) {
            throw new Error('系统错误：Or 节点没有分支')
        }

        let result: string[][] = []

        for (const alt of alternatives) {
            const branches = this.expandNode(alt, firstK, curLevel, maxLevel, isFirstPosition, expandCallback)
            result = result.concat(branches)
        }

        if (result.length === 0) {
            throw new Error('系统错误：Or 节点所有分支都没有结果')
        }

        const finalResult = PathUtils.deduplicate(result)

        this.perfAnalyzer.endMethod(callId, alternatives.length, finalResult.length)
        return finalResult
    }

    /**
     * 展开 Option/Many 节点（添加空分支）
     */
    private expandOption(
        node: SequenceNode,
        firstK: number,
        curLevel: number,
        maxLevel: number,
        isFirstPosition: boolean = true,
        expandCallback?: (ruleName: string, firstK: number, curLevel: number, maxLevel: number, isFirstPosition: boolean) => string[][]
    ): string[][] {
        const callId = this.perfAnalyzer.startMethod('expandOption')

        const innerBranches = this.expandNode(node, firstK, curLevel, maxLevel, isFirstPosition, expandCallback)

        // 添加空分支表示可以跳过（0次）
        const result = [[], ...innerBranches]
        const finalResult = PathUtils.deduplicate(result)

        this.perfAnalyzer.endMethod(callId, undefined, finalResult.length)
        return finalResult
    }

    /**
     * 展开 AtLeastOne 节点（至少1次）
     */
    private expandAtLeastOne(
        node: SequenceNode,
        firstK: number,
        curLevel: number,
        maxLevel: number,
        isFirstPosition: boolean = true,
        expandCallback?: (ruleName: string, firstK: number, curLevel: number, maxLevel: number, isFirstPosition: boolean) => string[][]
    ): string[][] {
        const callId = this.perfAnalyzer.startMethod('expandAtLeastOne')

        const innerBranches = this.expandNode(node, firstK, curLevel, maxLevel, isFirstPosition, expandCallback)

        // 生成2次的情况
        const doubleBranches = innerBranches.map(branch => {
            const doubled = [...branch, ...branch]
            return doubled.slice(0, firstK)
        })

        const result = [...innerBranches, ...doubleBranches]
        const finalResult = PathUtils.deduplicate(result)

        this.perfAnalyzer.endMethod(callId, undefined, finalResult.length)
        return finalResult
    }

    getRuleNodeByAst(ruleName: string): SequenceNode {
        const ruleNode = this.ruleASTs.get(ruleName)
        if (!ruleNode) {
            throw new Error(`规则不存在: ${ruleName}`)
        }
        return ruleNode
    }
}
