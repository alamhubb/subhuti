/**
 * Left Recursion Detector - 左递归检测器
 * 
 * 职责：检测规则中的左递归
 * 核心功能：
 * - detect(): 检测所有规则的左递归
 * - expandPathsByDFSCache(): DFS 展开路径（带左递归检测）
 * - getLeftRecursionSuggestion(): 生成修复建议
 */

import type {
    RuleNode,
    SequenceNode,
    ValidationError,
    SubruleNode,
    ConsumeNode
} from '../SubhutiValidationError.ts'
import { EXPANSION_LIMITS } from '../constants/ExpansionLimits.ts'
import { PathUtils } from '../utils/PathUtils.ts'
import { PerformanceAnalyzer } from '../utils/PerformanceAnalyzer.ts'
import { PathExpander } from '../core/PathExpander.ts'

/**
 * 左递归错误类型
 */
export type LeftRecursionError = ValidationError

export class LeftRecursionDetector {
    private recursiveDetectionSet = new Set<string>()
    private detectedLeftRecursionErrors = new Map<string, LeftRecursionError>()
    private dfsFirstKCache = new Map<string, string[][]>()

    private perfAnalyzer: PerformanceAnalyzer
    private pathExpander: PathExpander

    constructor(
        private ruleASTs: Map<string, SequenceNode>,
        private tokenCache: Map<string, ConsumeNode>,
        perfAnalyzer: PerformanceAnalyzer
    ) {
        this.perfAnalyzer = perfAnalyzer
        this.pathExpander = new PathExpander(ruleASTs, tokenCache, perfAnalyzer)
    }

    /**
     * 检测所有规则的左递归
     */
    detect(): { errors: LeftRecursionError[], stats: any } {
        console.log('\n🔍 ===== 左递归检测开始 =====')

        const startTime = Date.now()
        const ruleNames = Array.from(this.ruleASTs.keys())

        // 遍历检查左递归
        for (const ruleName of ruleNames) {
            this.recursiveDetectionSet.clear()
            this.expandPathsByDFSCache(ruleName, EXPANSION_LIMITS.FIRST_K, 0, EXPANSION_LIMITS.INFINITY, true)
        }

        // 为每个错误补充 suggestion
        for (const error of this.detectedLeftRecursionErrors.values()) {
            const ruleAST = this.pathExpander.getRuleNodeByAst(error.ruleName)
            error.suggestion = this.getLeftRecursionSuggestion(
                error.ruleName,
                ruleAST,
                new Set([error.ruleName])
            )
        }

        const errors = Array.from(this.detectedLeftRecursionErrors.values())
        const duration = Date.now() - startTime

        console.log(`✅ 左递归检测完成 (耗时: ${duration}ms, 发现: ${errors.length} 个)`)
        console.log('========================================\n')

        return {
            errors,
            stats: {
                leftRecursionCount: errors.length,
                leftRecursionTime: duration,
                dfsFirstKCacheSize: this.dfsFirstKCache.size
            }
        }
    }

    /**
     * DFS 展开路径（带左递归检测）
     */
    private expandPathsByDFSCache(
        ruleName: string,
        firstK: number,
        curLevel: number,
        maxLevel: number,
        isFirstPosition: boolean
    ): string[][] {
        const t0 = Date.now()
        this.perfAnalyzer.cacheStats.subRuleHandlerTotal++

        // 防御：规则名不能为空
        if (!ruleName) {
            throw new Error('系统错误：规则名为空')
        }

        // 层级限制检查
        if (curLevel === maxLevel) {
            this.perfAnalyzer.cacheStats.levelLimitReturn++
            return [[ruleName]]
        } else if (curLevel > maxLevel) {
            throw new Error('系统错误：层级超限')
        }

        curLevel++

        // ========================================
        // 阶段1：DFS 缓存查找（在递归检测之前！）
        // ========================================
        if (firstK === EXPANSION_LIMITS.FIRST_K) {
            const cached = this.getCacheValue('dfsFirstKCache', ruleName)
            if (cached !== undefined) {
                const duration = Date.now() - t0
                this.perfAnalyzer.record('subRuleHandler', duration)
                return cached
            }
        } else if (firstK === EXPANSION_LIMITS.INFINITY) {
            if (maxLevel !== EXPANSION_LIMITS.LEVEL_1) {
                throw new Error(`系统错误：不支持的参数组合 firstK=${firstK}, maxLevel=${maxLevel}`)
            }
        }

        // ========================================
        // 阶段2：递归检测（DFS 专属）
        // ========================================
        if (this.recursiveDetectionSet.has(ruleName)) {
            // 区分左递归和普通递归
            if (isFirstPosition) {
                // 在第一个位置递归 → 左递归！
                if (!this.detectedLeftRecursionErrors.has(ruleName)) {
                    const error: LeftRecursionError = {
                        level: 'FATAL',
                        type: 'left-recursion',
                        ruleName,
                        branchIndices: [],
                        conflictPaths: { pathA: '', pathB: '' },
                        message: `规则 "${ruleName}" 存在左递归`,
                        suggestion: ''
                    }
                    this.detectedLeftRecursionErrors.set(ruleName, error)
                }

                this.perfAnalyzer.cacheStats.recursiveReturn++
                return [[ruleName]]
            } else {
                // 不在第一个位置递归 → 普通递归
                this.perfAnalyzer.cacheStats.recursiveReturn++
                return [[ruleName]]
            }
        }

        // 标记当前规则正在计算
        this.recursiveDetectionSet.add(ruleName)

        try {
            // ========================================
            // 阶段3：DFS 实际计算（缓存未命中）
            // ========================================
            this.perfAnalyzer.recordActualCompute()

            const expandCallId = this.perfAnalyzer.startMethod('expandPathsByDFSCache')
            const subNode = this.pathExpander.getRuleNodeByAst(ruleName)

            // 使用 PathExpander 展开节点，传入展开回调
            const finalResult = this.pathExpander.expandNode(
                subNode,
                firstK,
                curLevel,
                maxLevel,
                isFirstPosition,
                // 展开回调：递归调用 expandPathsByDFSCache
                (subRuleName, fk, cl, ml, ifp) => this.expandPathsByDFSCache(subRuleName, fk, cl, ml, ifp)
            )

            this.perfAnalyzer.endMethod(expandCallId, undefined, finalResult.length)

            // ========================================
            // 阶段4：DFS 缓存设置
            // ========================================
            const shouldCache = !PathUtils.isRuleNameOnly(finalResult, ruleName)

            if (firstK === EXPANSION_LIMITS.FIRST_K) {
                if (shouldCache && !this.dfsFirstKCache.has(ruleName)) {
                    this.dfsFirstKCache.set(ruleName, finalResult)
                }
            }

            return finalResult
        } finally {
            // 清除递归标记
            this.recursiveDetectionSet.delete(ruleName)
        }
    }

    /**
     * 获取缓存值（带统计）
     */
    private getCacheValue(
        cacheType: 'dfsFirstKCache',
        key: string
    ): string[][] | undefined {
        const result = this.dfsFirstKCache.get(key)

        if (result !== undefined) {
            this.perfAnalyzer.recordCacheHit(cacheType)
        } else {
            this.perfAnalyzer.recordCacheMiss(cacheType)
        }

        return result
    }

    /**
     * 生成左递归修复建议
     */
    private getLeftRecursionSuggestion(
        ruleName: string,
        node: RuleNode,
        firstSet: Set<string>
    ): string {
        // 简化版建议生成
        return `
建议修复方案：

1. 使用右递归替代：
   ${ruleName} → X ${ruleName}' 
   ${ruleName}' → Y ${ruleName}' | ε

2. 提取左公因子：
   如果规则形如 A → A α | β
   改写为 A → β A'
           A' → α A' | ε

3. 检查是否可以使用 Option/Many：
   ${ruleName} → Many(X) Y
   ${ruleName} → Option(X) Y

详细分析：
- 规则名：${ruleName}
- First集合：${Array.from(firstSet).join(', ')}
        `.trim()
    }

    /**
     * 获取检测到的错误
     */
    getErrors(): LeftRecursionError[] {
        return Array.from(this.detectedLeftRecursionErrors.values())
    }

    /**
     * 清空缓存
     */
    clear() {
        this.recursiveDetectionSet.clear()
        this.detectedLeftRecursionErrors.clear()
        this.dfsFirstKCache.clear()
    }
}
