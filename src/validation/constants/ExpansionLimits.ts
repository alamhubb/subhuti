/**
 * 全局统一限制配置
 *
 * 设计理念：
 * - FIRST_K：控制 First 集合的 token 数量
 * - LEVEL_K：控制展开深度，防止无限递归
 * - MAX_BRANCHES：仅用于冲突检测时的路径比较优化
 */
export const EXPANSION_LIMITS = {
    FIRST_K: 3,
    FIRST_Max: 100,

    LEVEL_1: 1,
    LEVEL_K: 1,

    INFINITY: Infinity,
    RuleJoinSymbol: '\x1F',

    /**
     * 冲突检测路径比较限制
     *
     * ⚠️ 注意：此限制仅用于冲突检测阶段的路径比较优化
     * - 不影响规则展开阶段（展开阶段不做任何截断）
     * - 仅在 SubhutiConflictDetector.detectOrConflicts 中使用
     * - 用于限制每个分支的路径数量，防止路径比较爆炸
     *
     * 性能考虑：
     * - 路径比较复杂度：O(n²)
     * - 1000条路径 × 1000条路径 = 100万次比较（可接受）
     * - 超过1000条路径会导致性能问题（如 28260条 = 8亿次比较）
     *
     * 当前设置：已取消限制（Infinity），可能导致性能问题
     */
    MAX_BRANCHES: Infinity,
} as const
