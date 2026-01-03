# SubhutiGrammarAnalyzer 拆分计划

## 目标
将 3269 行的 `SubhutiGrammarAnalyzer.ts` 拆分为多个职责单一的模块。

## 已完成

### 1. 常量配置
- ✅ `constants/ExpansionLimits.ts` - 全局配置常量

### 2. 工具类
- ✅ `utils/PerformanceAnalyzer.ts` - 性能分析器
- ✅ `utils/PathUtils.ts` - 路径工具函数（去重、截取等）

## 待完成

###  3. 核心展开器
- ⏳ `core/PathExpander.ts` - 路径展开器（~800行）
  - expandNode() - 展开任意节点
  - expandSequenceNode() - 展开 Sequence
  - expandOr() - 展开 Or
  - expandOption() - 展开 Option/Many
  - expandAtLeastOne() - 展开 AtLeastOne
  - cartesianProduct() - 笛卡尔积

### 4. 检测器
- ⏳ `detectors/LeftRecursionDetector.ts` - 左递归检测器（~400行）
  - detect() - 检测所有规则的左递归
  - expandPathsByDFSCache() - DFS 展开（带左递归检测）
  - getLeftRecursionSuggestion() - 生成修复建议

- ⏳ `detectors/OrConflictDetector.ts` - Or冲突检测器（~600行）
  - detectAll() - 检测所有 Or 冲突
  - checkOrConflictsInNodeSmart() - 智能检测（First1 → FirstK）
  - detectOrBranchEqualWithFirstK() - First(K) 检测
  - findEqualPath() - 路径比较
  - trieTreeFindPrefixMatch() - 前缀检测

### 5. 门面类
- ⏳ `SubhutiGrammarAnalyzer.ts` - 主门面类（重写，~150行）
  - constructor() - 初始化各个检测器
  - initCacheAndCheckLeftRecursion() - 协调检测流程

## 文件结构

```
validation/
├── constants/
│   └── ExpansionLimits.ts          ✅
├── utils/
│   ├── PerformanceAnalyzer.ts      ✅
│   └── PathUtils.ts                ✅
├── core/
│   └── PathExpander.ts             ⏳
├── detectors/
│   ├── LeftRecursionDetector.ts    ⏳
│   └── OrConflictDetector.ts       ⏳
└── SubhutiGrammarAnalyzer.ts       ⏳ 重写
```

## 预估代码量

| 文件 | 预估行数 |
|------|---------|
| ExpansionLimits.ts | ~40 |
| PerformanceAnalyzer.ts | ~340 |
| PathUtils.ts | ~90 |
| PathExpander.ts | ~800 |
| LeftRecursionDetector.ts | ~400 |
| OrConflictDetector.ts | ~600 |
| SubhutiGrammarAnalyzer.ts | ~150 |
| **总计** | **~2420** |

**精简效果**：3269 → ~2420（减少 ~850 行，去除了日志记录、图分析、深度计算等非核心功能）
