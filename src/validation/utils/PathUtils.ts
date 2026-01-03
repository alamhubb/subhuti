/**
 * 路径工具函数
 * 
 * 提供路径去重、截取等基础操作
 */

import { EXPANSION_LIMITS } from '../constants/ExpansionLimits.ts'

export class PathUtils {
    /**
     * 去重：移除重复的分支
     *
     * 例如：[[a,b], [c,d], [a,b]] → [[a,b], [c,d]]
     *
     * ⚠️ 重要：空分支处理
     * - 空分支 [] 会被序列化为空字符串 ""
     * - 空分支不会被过滤，会正常参与去重
     * - 例如：[[], [a], []] → [[], [a]]
     */
    static deduplicate(branches: string[][]): string[][] {
        // 用于记录已经见过的分支（序列化为字符串）
        const seen = new Set<string>()
        // 存储去重后的结果
        const result: string[][] = []

        // 遍历所有分支
        for (const branch of branches) {
            // 将分支序列化为字符串（用作 Set 的 key）
            // ⚠️ 空分支 [] 会被序列化为 ""，不会被过滤
            const key = branch.join(EXPANSION_LIMITS.RuleJoinSymbol)
            // 检查是否已经存在
            if (!seen.has(key)) {
                // 未见过，添加到 Set 和结果中
                // ⚠️ 空分支 [] 也会被添加到结果中
                seen.add(key)
                result.push(branch)
            }
            // 已见过，跳过
        }

        // 返回去重后的结果（可能包含空分支 []）
        return result
    }

    /**
     * 截取并去重：先截取到 firstK，再去重
     *
     * 使用场景：笛卡尔积后路径变长，需要截取
     *
     * 例如：[[a,b,c], [d,e,f]], firstK=2 → [[a,b], [d,e]]
     *
     * ⚠️ 重要：空分支处理
     * - 空分支 [] slice(0, firstK) 还是 []
     * - 空分支不会被过滤，会正常参与去重
     * - 例如：[[], [a,b,c]], firstK=2 → [[], [a,b]]
     *
     * 🔧 优化：如果 firstK=INFINITY，不需要截取，只去重
     */
    static truncateAndDeduplicate(branches: string[][], firstK: number): string[][] {
        // 如果 firstK 为 INFINITY，不需要截取，只去重
        if (firstK === EXPANSION_LIMITS.INFINITY) {
            return PathUtils.deduplicate(branches)
        }

        // 截取每个分支到 firstK
        const truncated = branches.map(branch => branch.slice(0, firstK))

        // 去重（截取后可能产生重复分支）
        return PathUtils.deduplicate(truncated)
    }

    /**
     * 判断展开结果是否是规则名本身（未展开）
     *
     * 规则名本身的情况：[[ruleName]] - 只有一个路径，且这个路径只有一个元素，就是这个规则名
     *
     * @param result 展开结果
     * @param ruleName 规则名
     * @returns 如果是规则名本身返回 true，否则返回 false
     */
    static isRuleNameOnly(result: string[][], ruleName: string): boolean {
        // 检查条件：
        // 1. 只有一个路径 [[...]]
        // 2. 这个路径只有一个元素
        // 3. 这个元素就是规则名本身
        return result.length === 1
            && result[0].length === 1
            && result[0][0] === ruleName
    }
}
