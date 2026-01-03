/**
 * Subhuti Grammar Validation - 统一导出
 * 
 * @version 1.0.0
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
} from './SubhutiValidationError'

// 异常类
export { SubhutiGrammarValidationError } from './SubhutiValidationError'

// 核心类
export { SubhutiRuleCollector } from './SubhutiRuleCollector'
export { SubhutiGrammarAnalyzer, EXPANSION_LIMITS } from './SubhutiGrammarAnalyzer'
export type { GrammarAnalyzerOptions } from './SubhutiGrammarAnalyzer'
export { SubhutiGrammarValidator } from './SubhutiGrammarValidator'

// 新的模块化组件（可选导出）
export { LeftRecursionDetector } from './detectors/LeftRecursionDetector'
export { OrConflictDetector } from './detectors/OrConflictDetector'
export { PathExpander } from './core/PathExpander'
export { BFSPathExpander } from './core/BFSPathExpander'
export { PathUtils } from './utils/PathUtils'
export { PerformanceAnalyzer } from './utils/PerformanceAnalyzer'

// 调试器
export { SubhutiValidationDebugger } from './SubhutiValidationDebugger'
export type {
    DebugEvent,
    RuleDebugInfo,
    ConflictDebugInfo
} from './SubhutiValidationDebugger'

// 日志工具
export { SubhutiValidationLogger, LogLevel } from './SubhutiValidationLogger'
export type { LoggerConfig } from './SubhutiValidationLogger'

