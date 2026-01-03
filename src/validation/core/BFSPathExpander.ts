/**
 * BFS Path Expander - BFS 路径展开器
 * 
 * 职责：按层级展开规则（Breadth-First Search）
 * 核心功能：
 * - expandPathsByBFSCache(): 递归展开到指定层级
 * - getDirectChildren(): 获取规则的 level 1 展开
 * - 智能缓存复用：level N = level N-1 + 展开 1 层
 */

import type {
    RuleNode,
    SequenceNode,
    ConsumeNode
} from '../types/SubhutiValidationError.ts'
import { EXPANSION_LIMITS } from '../constants/ExpansionLimits.ts'
import { PathUtils } from '../utils/PathUtils.ts'
import { PerformanceAnalyzer } from '../utils/PerformanceAnalyzer.ts'
import { PathExpander } from './PathExpander.ts'

export class BFSPathExpander {
    private bfsLevelCache = new Map<string, string[][]>()  // "ruleName:level" => paths
    private perfAnalyzer: PerformanceAnalyzer
    private pathExpander: PathExpander

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
        this.pathExpander = new PathExpander(ruleASTs, tokenCache, perfAnalyzer)
    }

    /**
     * BFS 展开到指定层级（递归实现，智能缓存复用）
     * 
     * 核心逻辑：
     * 1. 查找最近的缓存层级（targetLevel-1, targetLevel-2, ..., 1）
     * 2. 对缓存的每个路径中的规则名，递归调用自己
     * 3. 缓存并返回结果
     * 
     * @param ruleName 规则名
     * @param targetLevel 目标层级
     * @returns 展开结果
     */
    expandPathsByBFSCache(ruleName: string, targetLevel: number): string[][] {
        // 防御检查
        if (targetLevel === 0) {
            throw new Error('系统错误：targetLevel 不能为 0')
        }

        // Token 检查
        const tokenNode = this.tokenCache?.get(ruleName)
        if (tokenNode && tokenNode.type === 'consume') {
            return [[ruleName]]
        }

        // 基础情况：level 1
        if (targetLevel === EXPANSION_LIMITS.LEVEL_1) {
            return this.getDirectChildren(ruleName)
        }

        const key = `${ruleName}:${targetLevel}`

        // 更新当前处理规则（用于超时日志）
        this.currentProcessingRule = `${ruleName}:Level${targetLevel}`

        // 超时检测
        this.checkTimeout(`expandPathsByBFSCache-${ruleName}-Level${targetLevel}`)

        // 检查缓存
        if (this.bfsLevelCache.has(key)) {
            const cached = this.getCacheValue('bfsLevelCache', key)!
            return cached
        }

        // 查找最近的缓存层级
        let cachedLevel = 1
        let cachedBranches: string[][] = this.getDirectChildren(ruleName)

        // 从 targetLevel-1 往下查找
        for (let level = targetLevel - 1; level >= 2; level--) {
            const cacheKey = `${ruleName}:${level}`
            if (this.bfsLevelCache.has(cacheKey)) {
                cachedLevel = level
                cachedBranches = this.getCacheValue('bfsLevelCache', cacheKey)!

                // 找到目标层级，直接返回
                if (level === targetLevel) {
                    return cachedBranches
                }
                break
            }
        }

        // 计算剩余层数
        const remainingLevels = targetLevel - cachedLevel

        if (remainingLevels <= 0) {
            throw new Error('系统错误：剩余层数必须大于0')
        }

        // 对每个路径递归展开
        let expandedPaths: string[][] = []

        for (const branchSeqRules of cachedBranches) {
            // 超时检测
            this.checkTimeout(`expandPathsByBFSCache-${ruleName}-处理路径`)

            const branchAllRuleBranchSeqs: string[][][] = []

            // 遍历路径中的每个符号
            for (let ruleIndex = 0; ruleIndex < branchSeqRules.length; ruleIndex++) {
                const subRuleName = branchSeqRules[ruleIndex]

                // 超时检测
                this.checkTimeout(`expandPathsByBFSCache-${ruleName}-展开符号:${subRuleName}`)

                // 递归检测：防止右递归导致的路径爆炸
                if (branchSeqRules.includes(subRuleName) && branchSeqRules.indexOf(subRuleName) < ruleIndex) {
                    branchAllRuleBranchSeqs.push([[subRuleName]])
                    continue
                }

                // 展开子规则（会自动使用 bfsLevelCache 缓存）
                const result = this.expandPathsByBFSCache(subRuleName, remainingLevels)
                branchAllRuleBranchSeqs.push(result)
            }

            // 笛卡尔积
            const pathResult = this.pathExpander['cartesianProduct'](branchAllRuleBranchSeqs, EXPANSION_LIMITS.INFINITY)
            expandedPaths = expandedPaths.concat(pathResult)
        }

        const finalResult = PathUtils.deduplicate(expandedPaths)

        // 存入缓存
        const shouldCache = !PathUtils.isRuleNameOnly(finalResult, ruleName)
        if (shouldCache) {
            this.bfsLevelCache.set(key, finalResult)
        }

        return finalResult
    }

    /**
     * 获取规则的直接子节点（展开 1 层）
     * 
     * @param ruleName 规则名
     * @returns 直接子节点的所有路径
     */
    private getDirectChildren(ruleName: string): string[][] {
        const maxLevel = EXPANSION_LIMITS.LEVEL_1
        const key = `${ruleName}:${maxLevel}`

        // 检查缓存
        if (this.bfsLevelCache.has(key)) {
            this.perfAnalyzer.recordCacheHit('getDirectChildren')
            return this.getCacheValue('bfsLevelCache', key)!
        }

        this.perfAnalyzer.recordCacheMiss('getDirectChildren')

        // Token 检查
        const tokenNode = this.tokenCache?.get(ruleName)
        if (tokenNode && tokenNode.type === 'consume') {
            return [[ruleName]]
        }

        // 获取规则 AST
        const subNode = this.pathExpander.getRuleNodeByAst(ruleName)

        // 展开 1 层（使用 DFS 展开器）
        const result = this.pathExpander.expandNode(
            subNode,
            EXPANSION_LIMITS.INFINITY,
            0,
            maxLevel,
            false,
            // 展开回调：递归调用自己的 BFS 展开
            (subRuleName, fk, cl, ml, ifp) => {
                // 如果达到最大深度，返回规则名
                if (cl >= ml) {
                    return [[subRuleName]]
                }
                // 否则继续展开
                return this.getDirectChildren(subRuleName)
            }
        )

        // 缓存结果
        const shouldCache = !PathUtils.isRuleNameOnly(result, ruleName)
        if (shouldCache) {
            this.bfsLevelCache.set(key, result)
        }

        return result
    }

    /**
     * 获取缓存值（带统计）
     */
    private getCacheValue(
        cacheType: 'bfsLevelCache',
        key: string
    ): string[][] | undefined {
        const result = this.bfsLevelCache.get(key)

        if (result !== undefined) {
            this.perfAnalyzer.recordCacheHit(cacheType)
        } else {
            this.perfAnalyzer.recordCacheMiss(cacheType)
        }

        return result
    }

    /**
     * 超时检测
     */
    private checkTimeout(location: string): void {
        if (this.operationStartTime === 0) return

        const elapsed = Date.now() - this.operationStartTime
        if (elapsed > this.timeoutSeconds * 1000) {
            throw new Error(`操作超时 (${this.timeoutSeconds}秒): ${location}, 当前规则: ${this.currentProcessingRule}`)
        }
    }

    /**
     * 预填充缓存（按顺序填充 level 1 → 2 → ... → K）
     * 
     * @param ruleName 规则名
     * @param maxLevel 最大层级
     */
    prefillCache(ruleName: string, maxLevel: number): void {
        for (let level = 1; level <= maxLevel; level++) {
            this.expandPathsByBFSCache(ruleName, level)
        }
    }

    /**
     * 预填充所有规则的缓存
     */
    prefillAllRules(maxLevel: number): void {
        const ruleNames = Array.from(this.ruleASTs.keys())

        for (let level = 1; level <= maxLevel; level++) {
            console.log(`📊 正在生成 Level ${level} 的缓存...`)

            for (const ruleName of ruleNames) {
                const key = `${ruleName}:${level}`

                // 如果已经存在缓存，跳过
                if (this.bfsLevelCache.has(key)) {
                    continue
                }

                // 生成缓存
                this.expandPathsByBFSCache(ruleName, level)
            }

            console.log(`✅ Level ${level} 缓存生成完成`)
        }
    }

    /**
     * 清空缓存
     */
    clear() {
        this.bfsLevelCache.clear()
    }

    /**
     * 获取 BFS 缓存（供外部共享）
     */
    getBFSCache(): Map<string, string[][]> {
        return this.bfsLevelCache
    }
}
