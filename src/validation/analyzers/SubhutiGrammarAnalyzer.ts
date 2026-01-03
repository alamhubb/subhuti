/**
 * Subhuti Grammar Analyzer - 语法分析器（门面类）
 * 
 * 职责：协调各个检测器，提供统一的验证入口
 * 
 * 架构：
 * - LeftRecursionDetector: 左递归检测
 * - OrConflictDetector: Or 分支冲突检测
 * - PathExpander: 路径展开（由检测器内部使用）
 * 
 * @version 3.0.0 - 重构为模块化架构
 */

import type {
    SequenceNode,
    ValidationError,
    ConsumeNode
} from '../types/SubhutiValidationError.ts'
import { EXPANSION_LIMITS } from '../constants/ExpansionLimits.ts'
import { PerformanceAnalyzer } from '../utils/PerformanceAnalyzer.ts'
import { LeftRecursionDetector } from '../detectors/LeftRecursionDetector.ts'
import { OrConflictDetector } from '../detectors/OrConflictDetector.ts'
import { BFSPathExpander } from '../core/BFSPathExpander.ts'

/**
 * 语法分析器配置
 */
export interface GrammarAnalyzerOptions {
    /**
     * 最大展开层级
     * 默认: 5
     */
    maxLevel?: number
}

/**
 * 语法分析器
 */
export class SubhutiGrammarAnalyzer {
    private leftRecursionDetector: LeftRecursionDetector
    private orConflictDetector: OrConflictDetector
    private bfsPathExpander: BFSPathExpander
    private perfAnalyzer: PerformanceAnalyzer

    private options: Required<GrammarAnalyzerOptions>

    /**
     * 构造函数
     *
     * @param ruleASTs 规则名称 → AST 的映射
     * @param tokenCache Token 缓存
     * @param options 配置选项
     */
    constructor(
        private ruleASTs: Map<string, SequenceNode>,
        private tokenCache: Map<string, ConsumeNode>,
        options?: GrammarAnalyzerOptions
    ) {
        this.options = {
            maxLevel: options?.maxLevel ?? EXPANSION_LIMITS.LEVEL_K
        }

        // 初始化性能分析器
        this.perfAnalyzer = new PerformanceAnalyzer()

        // 初始化 BFS 展开器
        this.bfsPathExpander = new BFSPathExpander(
            ruleASTs,
            tokenCache,
            this.perfAnalyzer
        )

        // 初始化检测器
        this.leftRecursionDetector = new LeftRecursionDetector(
            ruleASTs,
            tokenCache,
            this.perfAnalyzer
        )

        // Or 冲突检测器可以复用左递归检测器的缓存
        this.orConflictDetector = new OrConflictDetector(
            ruleASTs,
            tokenCache,
            this.perfAnalyzer,
            (this.leftRecursionDetector as any).dfsFirstKCache  // 共享缓存
        )
    }

    /**
     * 初始化缓存并检查左递归
     * 
     * 这是主要的验证入口
     * 
     * 流程：
     * 1. 左递归检测（FATAL）
     * 2. Or 分支冲突检测（ERROR）
     * 3. 聚合所有错误
     * 
     * @returns { errors: 验证错误列表, stats: 统计信息 }
     */
    initCacheAndCheckLeftRecursion(): { errors: ValidationError[], stats: any } {
        console.log('\n🚀 ===== 语法验证开始 =====\n')

        const totalStartTime = Date.now()

        // 0. BFS 缓存预填充（可选，用于多层级展开）
        console.log('📍 阶段 0/3: BFS 缓存预填充')
        const bfsCacheStartTime = Date.now()
        this.bfsPathExpander.prefillAllRules(this.options.maxLevel)
        const bfsCacheTime = Date.now() - bfsCacheStartTime
        console.log(`✅ BFS 缓存预填充完成 (耗时: ${bfsCacheTime}ms)\n`)

        // 1. 左递归检测（最致命，优先检测）
        console.log('📍 阶段 1/3: 左递归检测')
        const leftRecursionResult = this.leftRecursionDetector.detect()
        const leftRecursionErrors = leftRecursionResult.errors

        // 2. Or 分支冲突检测
        console.log('📍 阶段 2/3: Or 分支冲突检测')
        const orConflictErrors = this.orConflictDetector.detectAll()

        // 3. 聚合所有错误（左递归优先）
        const allErrors: ValidationError[] = []
        allErrors.push(...leftRecursionErrors)
        allErrors.push(...orConflictErrors)

        // 4. 准备统计信息
        const totalTime = Date.now() - totalStartTime

        const stats: any = {
            totalTime,
            leftRecursionCount: leftRecursionErrors.length,
            leftRecursionTime: leftRecursionResult.stats.leftRecursionTime,
            orConflictCount: orConflictErrors.length,
            orDetectionTime: 0,  // OrConflictDetector 内部记录
            firstK: EXPANSION_LIMITS.FIRST_K,
            dfsFirstKCacheSize: leftRecursionResult.stats.dfsFirstKCacheSize,
            cacheUsage: {
                dfsFirstK: {
                    hit: this.perfAnalyzer.cacheStats.dfsFirstKCache.hit,
                    miss: this.perfAnalyzer.cacheStats.dfsFirstKCache.miss,
                    total: this.perfAnalyzer.cacheStats.dfsFirstKCache.total,
                    hitRate: this.perfAnalyzer.cacheStats.dfsFirstKCache.total > 0
                        ? (this.perfAnalyzer.cacheStats.dfsFirstKCache.hit / this.perfAnalyzer.cacheStats.dfsFirstKCache.total * 100)
                        : 0
                }
            }
        }

        // 5. 输出性能分析报告（可选）
        // this.perfAnalyzer.report()

        // 6. 输出汇总
        console.log('🎯 ===== 验证完成 =====')
        console.log(`总耗时: ${totalTime}ms`)
        console.log(`左递归错误: ${leftRecursionErrors.length} 个`)
        console.log(`Or 冲突错误: ${orConflictErrors.length} 个`)
        console.log(`总错误数: ${allErrors.length} 个`)
        console.log('===========================\n')

        return {
            errors: allErrors,
            stats: stats
        }
    }

    /**
     * 获取规则 AST
     */
    getRuleNodeByAst(ruleName: string): SequenceNode {
        const ruleNode = this.ruleASTs.get(ruleName)
        if (!ruleNode) {
            throw new Error(`规则不存在: ${ruleName}`)
        }
        return ruleNode
    }

    /**
     * 清空所有缓存
     */
    clear() {
        this.bfsPathExpander.clear()
        this.leftRecursionDetector.clear()
        this.orConflictDetector.clear()
        this.perfAnalyzer.clear()
    }
}

// 导出配置常量（保持向后兼容）
export { EXPANSION_LIMITS } from '../constants/ExpansionLimits.ts'
