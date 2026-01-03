/**
 * 性能分析器
 * 
 * 用于统计方法调用耗时和缓存命中率
 */
export class PerformanceAnalyzer {
    private stats = new Map<string, {
        count: number
        totalTime: number      // 总耗时（包含子方法）
        netTime: number         // 净耗时（排除子方法）
        maxTime: number
        minTime: number
        inputSizes: number[]
        outputSizes: number[]
    }>()

    // 调用栈跟踪（用于计算净耗时）
    private callStack: Array<{ methodName: string, startTime: number, childTime: number }> = []

    // 缓存统计
    public cacheStats = {
        subRuleHandlerTotal: 0,  // subRuleHandler 总调用次数
        recursiveReturn: 0,  // 递归检测返回次数
        levelLimitReturn: 0,  // 层级限制返回次数
        // 独立的缓存统计（每个缓存都有自己的 hit/miss/total）
        dfsFirstKCache: { hit: 0, miss: 0, total: 0 },  // DFS First(K) 缓存
        bfsAllCache: { hit: 0, miss: 0, total: 0 },  // BFS 所有层级聚合缓存
        bfsLevelCache: { hit: 0, miss: 0, total: 0 },  // BFS 按层级缓存
        getDirectChildren: { hit: 0, miss: 0, total: 0 },  // getDirectChildren 懒加载缓存
        // 废弃的统计（保留用于兼容性）
        dfsFirst1: { hit: 0, miss: 0, total: 0 },
        dfsFirstK: { hit: 0, miss: 0, total: 0 },
        bfsLevel: { hit: 0, miss: 0, total: 0 },
        expandOneLevel: { hit: 0, miss: 0, total: 0 },
        expandOneLevelTruncated: { hit: 0, miss: 0, total: 0 },
        actualCompute: 0,  // 实际计算次数（getDirectChildren）
        bfsOptimization: {
            totalCalls: 0,           // BFS 总调用次数
            skippedLevels: 0,        // 跳过的层级数（增量优化效果）
            fromLevel1: 0,           // 从 level 1 开始的次数
            fromCachedLevel: 0       // 从缓存层级开始的次数
        }
    }

    // 开始方法调用（返回调用ID，用于结束调用）
    startMethod(methodName: string): number {
        const callId = this.callStack.length
        this.callStack.push({
            methodName,
            startTime: Date.now(),
            childTime: 0
        })
        return callId
    }

    // 结束方法调用并记录（返回净耗时）
    endMethod(callId: number, inputSize?: number, outputSize?: number): number {
        const call = this.callStack[callId]
        if (!call) {
            throw new Error(`调用栈错误: callId ${callId} 不存在`)
        }

        const totalDuration = Date.now() - call.startTime
        const netDuration = totalDuration - call.childTime

        // 更新父方法的子方法耗时
        if (callId > 0) {
            const parentCall = this.callStack[callId - 1]
            parentCall.childTime += totalDuration
        }

        // 记录统计
        if (!this.stats.has(call.methodName)) {
            this.stats.set(call.methodName, {
                count: 0,
                totalTime: 0,
                netTime: 0,
                maxTime: 0,
                minTime: Infinity,
                inputSizes: [],
                outputSizes: []
            })
        }

        const stat = this.stats.get(call.methodName)!
        stat.count++
        stat.totalTime += totalDuration
        stat.netTime += netDuration
        stat.maxTime = Math.max(stat.maxTime, netDuration)
        stat.minTime = Math.min(stat.minTime, netDuration)

        if (inputSize !== undefined) {
            stat.inputSizes.push(inputSize)
        }
        if (outputSize !== undefined) {
            stat.outputSizes.push(outputSize)
        }

        // 从调用栈移除
        this.callStack.pop()

        return netDuration
    }

    // 记录方法调用（兼容旧接口，但使用净耗时）
    record(methodName: string, duration: number, inputSize?: number, outputSize?: number) {
        // 这个接口用于直接记录耗时（不通过调用栈）
        // 假设这是净耗时（已经排除了子方法）
        if (!this.stats.has(methodName)) {
            this.stats.set(methodName, {
                count: 0,
                totalTime: 0,
                netTime: 0,
                maxTime: 0,
                minTime: Infinity,
                inputSizes: [],
                outputSizes: []
            })
        }

        const stat = this.stats.get(methodName)!
        stat.count++
        stat.totalTime += duration
        stat.netTime += duration  // 假设传入的已经是净耗时
        stat.maxTime = Math.max(stat.maxTime, duration)
        stat.minTime = Math.min(stat.minTime, duration)

        if (inputSize !== undefined) {
            stat.inputSizes.push(inputSize)
        }
        if (outputSize !== undefined) {
            stat.outputSizes.push(outputSize)
        }
    }

    // 记录缓存命中/未命中
    recordCacheHit(cacheType: 'dfsFirstKCache' | 'bfsAllCache' | 'bfsLevelCache' | 'getDirectChildren' |
        'dfsFirst1' | 'dfsFirstK' | 'bfsLevel' | 'expandOneLevel' | 'expandOneLevelTruncated') {
        this.cacheStats[cacheType].hit++
        this.cacheStats[cacheType].total++
    }

    recordCacheMiss(cacheType: 'dfsFirstKCache' | 'bfsAllCache' | 'bfsLevelCache' | 'getDirectChildren' |
        'dfsFirst1' | 'dfsFirstK' | 'bfsLevel' | 'expandOneLevel' | 'expandOneLevelTruncated') {
        this.cacheStats[cacheType].miss++
        this.cacheStats[cacheType].total++
    }

    // 记录实际计算
    recordActualCompute() {
        this.cacheStats.actualCompute++
    }

    // 输出统计报告
    report() {
        console.log('\n📊 ===== 性能分析报告 =====\n')

        // 1. subRuleHandler 总体统计
        console.log('🎯 subRuleHandler 调用统计:')
        console.log(`   总调用次数: ${this.cacheStats.subRuleHandlerTotal}`)
        console.log(`   递归检测返回: ${this.cacheStats.recursiveReturn}`)
        console.log(`   层级限制返回: ${this.cacheStats.levelLimitReturn}`)
        console.log(`   正常处理: ${this.cacheStats.subRuleHandlerTotal - this.cacheStats.recursiveReturn - this.cacheStats.levelLimitReturn}`)
        console.log('')

        // 2. 缓存统计
        console.log('💾 缓存命中率统计:')
        console.log(`   DFS_First1 (深度优先 First(1)):`)
        console.log(`     命中: ${this.cacheStats.dfsFirst1.hit}`)
        console.log(`     未命中: ${this.cacheStats.dfsFirst1.miss}`)
        console.log(`     总次数: ${this.cacheStats.dfsFirst1.total}`)
        console.log(`     命中率: ${this.cacheStats.dfsFirst1.total > 0 ? ((this.cacheStats.dfsFirst1.hit / this.cacheStats.dfsFirst1.total) * 100).toFixed(1) : 0}%`)

        console.log(`   DFS_FirstK (深度优先 First(K)):`)
        console.log(`     命中: ${this.cacheStats.dfsFirstK.hit}`)
        console.log(`     未命中: ${this.cacheStats.dfsFirstK.miss}`)
        console.log(`     总次数: ${this.cacheStats.dfsFirstK.total}`)
        console.log(`     命中率: ${this.cacheStats.dfsFirstK.total > 0 ? ((this.cacheStats.dfsFirstK.hit / this.cacheStats.dfsFirstK.total) * 100).toFixed(1) : 0}%`)

        console.log(`   GetDirectChildren (懒加载缓存):`)
        console.log(`     命中: ${this.cacheStats.getDirectChildren.hit}`)
        console.log(`     未命中: ${this.cacheStats.getDirectChildren.miss}`)
        console.log(`     总次数: ${this.cacheStats.getDirectChildren.total}`)
        console.log(`     命中率: ${this.cacheStats.getDirectChildren.total > 0 ? ((this.cacheStats.getDirectChildren.hit / this.cacheStats.getDirectChildren.total) * 100).toFixed(1) : 0}%`)

        // BFS 增量优化效果
        if (this.cacheStats.bfsOptimization.totalCalls > 0) {
            console.log(`\n   🚀 BFS 增量优化效果:`)
            console.log(`     总调用次数: ${this.cacheStats.bfsOptimization.totalCalls}`)
            console.log(`     从 level 1 开始: ${this.cacheStats.bfsOptimization.fromLevel1} (${((this.cacheStats.bfsOptimization.fromLevel1 / this.cacheStats.bfsOptimization.totalCalls) * 100).toFixed(1)}%)`)
            console.log(`     从缓存层级开始: ${this.cacheStats.bfsOptimization.fromCachedLevel} (${((this.cacheStats.bfsOptimization.fromCachedLevel / this.cacheStats.bfsOptimization.totalCalls) * 100).toFixed(1)}%)`)
            console.log(`     总计跳过层数: ${this.cacheStats.bfsOptimization.skippedLevels}`)
            if (this.cacheStats.bfsOptimization.fromCachedLevel > 0) {
                const avgSkipped = this.cacheStats.bfsOptimization.skippedLevels / this.cacheStats.bfsOptimization.fromCachedLevel
                console.log(`     平均每次跳过: ${avgSkipped.toFixed(2)} 层`)
            }
        }

        // 以下缓存仅在特殊场景使用，通常命中率较低
        if (this.cacheStats.bfsLevel.total > 0) {
            console.log(`   BFS_Level (handleDFS特殊场景: firstK=∞, maxLevel=1):`)
            console.log(`     命中: ${this.cacheStats.bfsLevel.hit}`)
            console.log(`     未命中: ${this.cacheStats.bfsLevel.miss}`)
            console.log(`     总次数: ${this.cacheStats.bfsLevel.total}`)
            console.log(`     命中率: ${((this.cacheStats.bfsLevel.hit / this.cacheStats.bfsLevel.total) * 100).toFixed(1)}%`)
        }

        if (this.cacheStats.expandOneLevel.total > 0) {
            console.log(`   ExpandOneLevel (BFS路径展开缓存):`)
            console.log(`     命中: ${this.cacheStats.expandOneLevel.hit}`)
            console.log(`     未命中: ${this.cacheStats.expandOneLevel.miss}`)
            console.log(`     总次数: ${this.cacheStats.expandOneLevel.total}`)
            console.log(`     命中率: ${((this.cacheStats.expandOneLevel.hit / this.cacheStats.expandOneLevel.total) * 100).toFixed(1)}%`)
        }

        console.log(`   实际计算次数 (getDirectChildren): ${this.cacheStats.actualCompute}`)
        console.log('')

        // 验证统计完整性
        const expectedNormalProcess = this.cacheStats.subRuleHandlerTotal - this.cacheStats.recursiveReturn - this.cacheStats.levelLimitReturn
        const actualCacheOperations = this.cacheStats.dfsFirst1.hit +
            this.cacheStats.dfsFirstK.hit +
            this.cacheStats.actualCompute
        console.log(`📈 统计验证:`)
        console.log(`   预期正常处理: ${expectedNormalProcess}`)
        console.log(`   实际缓存操作: ${actualCacheOperations}`)
        console.log(`   差异: ${expectedNormalProcess - actualCacheOperations} (应该接近0)`)
        console.log('')

        // 2. 方法调用统计（按净耗时排序）
        const sorted = Array.from(this.stats.entries())
            .sort((a, b) => b[1].netTime - a[1].netTime)
            .slice(0, 20)  // 只显示前20个

        // 计算总耗时
        const totalTime = Array.from(this.stats.values())
            .reduce((sum, stat) => sum + stat.totalTime, 0)

        // 计算净耗时总和（用于百分比计算）
        const totalNetTime = Array.from(this.stats.values())
            .reduce((sum, stat) => sum + stat.netTime, 0)

        console.log('⏱️  方法耗时统计 (按净耗时排序, Top 20):')
        console.log('='.repeat(80))
        for (const [method, stat] of sorted) {
            const avgNetTime = stat.netTime / stat.count
            const avgTotalTime = stat.totalTime / stat.count
            const percentage = totalNetTime > 0 ? (stat.netTime / totalNetTime * 100).toFixed(1) : '0.0'
            const avgInput = stat.inputSizes.length > 0
                ? stat.inputSizes.reduce((a, b) => a + b, 0) / stat.inputSizes.length
                : 0
            const avgOutput = stat.outputSizes.length > 0
                ? stat.outputSizes.reduce((a, b) => a + b, 0) / stat.outputSizes.length
                : 0

            console.log(`📌 ${method}:`)
            console.log(`   净耗时: ${stat.netTime.toFixed(0)}ms (${percentage}%) | 总耗时: ${stat.totalTime.toFixed(0)}ms`)
            console.log(`   调用次数: ${stat.count}次, 平均净耗时: ${avgNetTime.toFixed(2)}ms, 平均总耗时: ${avgTotalTime.toFixed(2)}ms`)
            console.log(`   最大耗时: ${stat.maxTime.toFixed(0)}ms, 最小耗时: ${stat.minTime === Infinity ? 0 : stat.minTime.toFixed(0)}ms`)

            if (stat.inputSizes.length > 0 && stat.outputSizes.length > 0) {
                console.log(`   输入→输出: ${avgInput.toFixed(1)} → ${avgOutput.toFixed(1)} (${(avgOutput / avgInput).toFixed(1)}x)`)
            }
            console.log('')
        }

        console.log(`⏱️  所有方法净耗时总和: ${totalNetTime.toFixed(2)}ms`)
        console.log(`⏱️  所有方法总耗时总和: ${totalTime.toFixed(2)}ms`)
        console.log('='.repeat(80))
        console.log('')
    }

    // 清空统计
    clear() {
        this.stats.clear()
        this.cacheStats = {
            subRuleHandlerTotal: 0,
            recursiveReturn: 0,
            levelLimitReturn: 0,
            // 新的独立缓存统计
            dfsFirstKCache: { hit: 0, miss: 0, total: 0 },
            bfsAllCache: { hit: 0, miss: 0, total: 0 },
            bfsLevelCache: { hit: 0, miss: 0, total: 0 },
            getDirectChildren: { hit: 0, miss: 0, total: 0 },
            // 废弃的统计（保留兼容性）
            dfsFirst1: { hit: 0, miss: 0, total: 0 },
            dfsFirstK: { hit: 0, miss: 0, total: 0 },
            bfsLevel: { hit: 0, miss: 0, total: 0 },
            expandOneLevel: { hit: 0, miss: 0, total: 0 },
            expandOneLevelTruncated: { hit: 0, miss: 0, total: 0 },
            actualCompute: 0,
            bfsOptimization: {
                totalCalls: 0,
                skippedLevels: 0,
                fromLevel1: 0,
                fromCachedLevel: 0
            }
        }
    }
}
