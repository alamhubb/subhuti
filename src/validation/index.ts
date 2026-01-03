/**
 * Subhuti Grammar Validation - 统一导出
 * 
 * @version 2.0.0 - 重构后的模块化架构
 */

// 类型定义
export type {
    ValidationError,
    ValidationStats,
    RuleNode,
    ConsumeNode,
    SequenceNode,
    OrNode,
    OptionNode,
    ManyNode,
    AtLeastOneNode,
    SubruleNode,
    Path
} from './types/SubhutiValidationError'

// 异常类
export { SubhutiGrammarValidationError } from './types/SubhutiValidationError'

// 核心分析器
export { SubhutiRuleCollector } from './analyzers/SubhutiRuleCollector'
export { SubhutiGrammarAnalyzer, EXPANSION_LIMITS } from './analyzers/SubhutiGrammarAnalyzer'
export type { GrammarAnalyzerOptions } from './analyzers/SubhutiGrammarAnalyzer'
export { SubhutiGrammarValidator } from './analyzers/SubhutiGrammarValidator'

// 检测器
export { LeftRecursionDetector } from './detectors/LeftRecursionDetector'
export { OrConflictDetector } from './detectors/OrConflictDetector'

// 路径展开器
export { PathExpander } from './core/PathExpander'
export { BFSPathExpander } from './core/BFSPathExpander'

// 工具类
export { PathUtils } from './utils/PathUtils'
export { PerformanceAnalyzer } from './utils/PerformanceAnalyzer'

// 调试器
export { SubhutiValidationDebugger } from './debug/SubhutiValidationDebugger'
export type {
    DebugEvent,
    RuleDebugInfo,
    ConflictDebugInfo
} from './debug/SubhutiValidationDebugger'

