/**
 * Or Conflict Detector - Or 分支冲突检测器
 * 
 * 职责：检测 Or 节点中分支的 First(K) 冲突
 * 核心功能：
 * - detectAll(): 检测所有规则的 Or 冲突
 * - findEqualPath(): 检测两个分支是否有相同路径
 * - getPrefixConflictSuggestion(): 生成修复建议
 */

import type {
    RuleNode,
    SequenceNode,
    ValidationError,
    OrNode,
    ConsumeNode
} from '../SubhutiValidationError.ts'
import { EXPANSION_LIMITS } from '../constants/ExpansionLimits.ts'
import { PerformanceAnalyzer } from '../utils/PerformanceAnalyzer.ts'
import { PathExpander } from '../core/PathExpander.ts'

export class OrConflictDetector {
    private perfAnalyzer: PerformanceAnalyzer
    private pathExpander: PathExpander
    private dfsFirstKCache = new Map<string, string[][]>()

    constructor(
        private ruleASTs: Map<string, SequenceNode>,
        private tokenCache: Map<string, ConsumeNode>,
        perfAnalyzer: PerformanceAnalyzer,
        // 接收外部的 DFS 缓存（来自左递归检测器）
        externalDfsCache?: Map<string, string[][]>
    ) {
        this.perfAnalyzer = perfAnalyzer
        this.pathExpander = new PathExpander(ruleASTs, tokenCache, perfAnalyzer)
        if (externalDfsCache) {
            this.dfsFirstKCache = externalDfsCache
        }
    }

    /**
     * 检测所有规则的 Or 冲突
     */
    detectAll(): ValidationError[] {
        console.log('\n🔍 ===== Or 冲突检测开始 =====')

        const startTime = Date.now()
        const orConflictErrors: ValidationError[] = []

        // 遍历所有规则
        for (const [ruleName, ruleAST] of this.ruleASTs.entries()) {
            const error = this.checkOrConflictsInNode(ruleName, ruleAST)
            if (error) {
                orConflictErrors.push(error)
            }
        }

        const duration = Date.now() - startTime

        console.log(`✅ Or 冲突检测完成 (耗时: ${duration}ms, 发现: ${orConflictErrors.length} 个)`)
        console.log('========================================\n')

        return orConflictErrors
    }

    /**
     * 递归检查节点中的 Or 冲突
     */
    private checkOrConflictsInNode(
        ruleName: string,
        node: RuleNode
    ): ValidationError | null {
        switch (node.type) {
            case 'or':
                // 检测 Or 节点冲突
                const error = this.detectOrBranchEqualWithFirstK(ruleName, node)
                if (error) {
                    return error
                }

                // 递归检查每个分支
                for (const alt of node.alternatives) {
                    const altError = this.checkOrConflictsInNode(ruleName, alt)
                    if (altError) {
                        return altError
                    }
                }
                break

            case 'sequence':
                // 递归检查每个子节点
                for (const child of node.nodes) {
                    const childError = this.checkOrConflictsInNode(ruleName, child)
                    if (childError) {
                        return childError
                    }
                }
                break

            case 'option':
            case 'many':
            case 'atLeastOne':
                // 递归检查内部节点
                return this.checkOrConflictsInNode(ruleName, node.node)

            case 'consume':
            case 'subrule':
                // 叶子节点，无需检查
                break
        }

        return null
    }

    /**
     * 使用 First(K) 检测 Or 分支冲突
     */
    private detectOrBranchEqualWithFirstK(
        ruleName: string,
        orNode: OrNode
    ): ValidationError | null {
        // 至少需要2个分支
        if (orNode.alternatives.length < 2) {
            return null
        }

        // 获取每个分支的 First(K) 路径
        const branchPathSets: string[][][] = []
        for (const alt of orNode.alternatives) {
            const paths = this.expandBranch(alt, EXPANSION_LIMITS.FIRST_K)
            branchPathSets.push(paths)
        }

        // 两两比较分支
        for (let i = 0; i < branchPathSets.length - 1; i++) {
            for (let j = i + 1; j < branchPathSets.length; j++) {
                const pathsFront = branchPathSets[i]
                const pathsBehind = branchPathSets[j]

                // 检测是否有相同路径
                const equalPath = this.findEqualPath(pathsFront, pathsBehind)

                if (equalPath) {
                    // 找到冲突
                    return {
                        level: 'ERROR',
                        type: 'or-conflict',
                        ruleName,
                        branchIndices: [i, j],
                        conflictPaths: {
                            pathA: equalPath.join(' → '),
                            pathB: equalPath.join(' → ')
                        },
                        message: `规则 "${ruleName}" 的 Or 分支 ${i + 1} 和 ${j + 1} 存在冲突`,
                        suggestion: this.getEqualBranchSuggestion(
                            ruleName,
                            i,
                            j,
                            equalPath.join(' → ')
                        )
                    }
                }
            }
        }

        return null
    }

    /**
     * 展开单个分支
     */
    private expandBranch(node: RuleNode, firstK: number): string[][] {
        // 递归展开回调：检查缓存或继续展开
        const expandCallback = (ruleName: string, fk: number, cl: number, ml: number, ifp: boolean) => {
            // 先检查缓存
            if (this.dfsFirstKCache.has(ruleName)) {
                return this.dfsFirstKCache.get(ruleName)!
            }

            // 缓存不存在，展开并缓存
            const ruleNode = this.pathExpander.getRuleNodeByAst(ruleName)
            const result = this.pathExpander.expandNode(ruleNode, fk, cl, ml, ifp, expandCallback)
            this.dfsFirstKCache.set(ruleName, result)
            return result
        }

        return this.pathExpander.expandNode(node, firstK, 0, EXPANSION_LIMITS.INFINITY, false, expandCallback)
    }

    /**
     * 检测两个路径集合中是否存在完全相同的路径
     */
    private findEqualPath(
        pathsFront: string[][],
        pathsBehind: string[][]
    ): string[] | null {
        const behindSet = new Set<string>()
        for (const path of pathsBehind) {
            behindSet.add(path.join(EXPANSION_LIMITS.RuleJoinSymbol))
        }

        for (const pathFront of pathsFront) {
            const key = pathFront.join(EXPANSION_LIMITS.RuleJoinSymbol)
            if (behindSet.has(key)) {
                return pathFront
            }
        }

        return null
    }

    /**
     * 生成相同分支的修复建议
     */
    private getEqualBranchSuggestion(
        ruleName: string,
        branchA: number,
        branchB: number,
        equalPath: string
    ): string {
        return `
建议修复方案：

分支 ${branchA + 1} 和分支 ${branchB + 1} 的路径完全相同：
${equalPath}

这意味着：
- 两个分支会匹配相同的输入
- 分支 ${branchB + 1} 永远不会被执行（因为分支 ${branchA + 1} 在前面）

解决方法：
1. 删除重复的分支 ${branchB + 1}
2. 或者合并两个分支的逻辑
3. 或者重构规则，确保分支有不同的 First 集合

示例：
or([A, A, B]) → or([A, B])  // 删除重复的 A
        `.trim()
    }

    /**
     * 清空缓存
     */
    clear() {
        this.dfsFirstKCache.clear()
    }
}
