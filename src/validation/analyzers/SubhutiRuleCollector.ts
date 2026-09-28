/**
 * Subhuti Grammar Validation - 规则收集器
 *
 * 功能：收集分析执行可见的 Parser 规则 AST
 *
 * 实现方案：使用双层Proxy拦截Parser方法调用，记录规则结构
 *
 * 核心原理：
 * 1. **Parser Proxy**：拦截规则方法调用（Or/Many/Option/AtLeastOne/子规则）
 * 2. **TokenConsumer Proxy**：拦截token消费调用（LParen/RParen/Identifier等）
 * 3. **双层Proxy的必要性**：
 *    - tokenConsumer是独立对象，不是Parser的方法
 *    - 规则内部通过this.tokenConsumer.XXX()消费token
 *    - 如果只有Parser Proxy，无法拦截tokenConsumer的方法调用
 *
 * 关键改进（相比初始版本）：
 * 1. ✅ 同时拦截consume和_consumeToken（兼容两种调用方式）
 * 2. ✅ 代理tokenConsumer对象（拦截所有token消费）
 * 3. ✅ 拦截子规则调用（记录subrule节点）
 * 4. ✅ 修复this绑定问题（所有handler使用proxy而不是target）
 * 5. ✅ 使用分析模式（Parser不抛异常，避免用异常控制流程）
 *
 * 收集到的AST用途：
 * - 提供给SubhutiGrammarAnalyzer计算路径（展开subrule为实际token序列）
 * - 提供给SubhutiConflictDetector检测Or分支冲突（基于token路径的前缀检测）
 *
 * 参数化规则与依赖运行时状态的条件分支可能在单次收集中不可见。
 * 返回的 AST 不能单独作为完整预测图的证明。
 *
 * @version 3.0.0 - 使用分析模式，不再依赖异常处理
 */

import type SubhutiParser from "../../SubhutiParser"
import type {
    ConsumeNode,
    RuleNode,
    RulePredicateObservation,
    SequenceNode,
} from "../types/SubhutiValidationError"

export interface RuleCollectionVariant {
    readonly args?: readonly unknown[]
    readonly lookahead?: Readonly<Record<number, { tokenName: string; tokenValue?: string }>>
}

/**
 * 规则收集器
 *
 * 职责：
 * 1. 启用 Parser 的分析模式（不抛异常）
 * 2. 创建 Parser 的 Proxy 代理
 * 3. 拦截 Or/Many/Option/AtLeastOne/consume 方法调用
 * 4. 记录调用序列形成 AST
 *
 * 优势：
 * - Parser 代码完全干净，无需任何验证相关代码
 * - 验证逻辑完全独立，易于维护
 * - 生产环境零性能开销
 * - 不使用异常控制流程，性能更好
 */
export class SubhutiRuleCollector {
    /** 收集到的规则 AST */
    private ruleASTs = new Map<string, SequenceNode>()


    private tokenAstCache = new Map<string, ConsumeNode>()

    /** 当前正在记录的规则栈 */
    private currentRuleStack: SequenceNode[] = []

    /** 当前规则名称 */
    private currentRuleName: string = ''

    /** 是否正在执行顶层规则调用 */
    private isExecutingTopLevelRule: boolean = false

    /** 正在执行的规则栈（用于检测递归） */
    private executingRuleStack: Set<string> = new Set()

    /**
     * 收集所有规则，或仅收集指定根规则可达的规则
     *
     * @param parser Parser 实例
     * @param roots 可选根规则；省略时收集所有带装饰器的规则
     * @returns 规则名称 → AST 的映射
     */
    static collectRules(
        parser: SubhutiParser,
        roots?: readonly string[],
        variants: Readonly<Record<string, readonly RuleCollectionVariant[]>> = {}
    ): { cstMap: Map<string, SequenceNode>, tokenMap: Map<string, ConsumeNode> } {
        const collector = new SubhutiRuleCollector()
        return collector.collect(parser, roots, variants)
    }

    /**
     * 收集所有规则（私有实现）
     */
    private collect(
        parser: SubhutiParser,
        roots: readonly string[] | undefined,
        variants: Readonly<Record<string, readonly RuleCollectionVariant[]>>
    ): { cstMap: Map<string, SequenceNode>, tokenMap: Map<string, ConsumeNode> } {
        if (roots && roots.length === 0) throw new Error('At least one root rule is required')
        // ✅ 启用分析模式（不抛异常）
        parser.enableAnalysisMode()

        try {
            const proxy = this.createAnalyzeProxy(parser)
            const knownRules = new Set(this.getAllRuleNames(parser))
            for (const name of Object.keys(variants)) {
                if (!knownRules.has(name)) throw new Error(`Unknown variant rule "${name}"`)
            }
            const pending = roots ? [...roots] : [...knownRules]
            const queued = new Set(pending)
            for (let index = 0; index < pending.length; index++) {
                const ruleName = pending[index]
                if (this.ruleASTs.has(ruleName)) continue
                if (!knownRules.has(ruleName)) throw new Error(`Unknown rule "${ruleName}"`)
                const alternatives = [
                    this.collectRule(proxy, ruleName, {}),
                    ...(variants[ruleName] ?? []).map(variant => this.collectRule(proxy, ruleName, variant)),
                ]
                this.ruleASTs.set(ruleName, alternatives.length === 1 ? alternatives[0] : {
                    type: 'sequence',
                    ruleName,
                    nodes: [{ type: 'or', alternatives }],
                })
                if (roots) {
                    const references = new Set<string>()
                    this.collectReferences(this.ruleASTs.get(ruleName)!, references)
                    for (const reference of references) {
                        if (!knownRules.has(reference)) {
                            throw new Error(`Rule "${ruleName}" references unknown rule "${reference}"`)
                        }
                        if (!queued.has(reference)) {
                            queued.add(reference)
                            pending.push(reference)
                        }
                    }
                }
            }
        } finally {
            parser.disableAnalysisMode()
        }

        return {
            cstMap: this.ruleASTs,
            tokenMap: this.tokenAstCache
        }
    }

    private collectReferences(node: RuleNode, references: Set<string>): void {
        switch (node.type) {
            case 'subrule':
                references.add(node.ruleName)
                break
            case 'sequence':
                node.nodes.forEach(child => this.collectReferences(child, references))
                break
            case 'or':
                node.alternatives.forEach(child => this.collectReferences(child, references))
                break
            case 'many':
            case 'option':
            case 'atLeastOne':
                this.collectReferences(node.node, references)
                break
        }
    }

    /**
     * 创建分析代理（拦截 Parser 方法调用）
     */
    private createAnalyzeProxy(parser: SubhutiParser): SubhutiParser {
        const collector = this

        const proxy: any = Object.create(parser as any)
        proxy.Or = (
            alternatives: Array<{ alt: () => any }> | { alt: () => any },
            ...additional: Array<{ alt: () => any }>
        ) => collector.handleOr(Array.isArray(alternatives) ? alternatives : [alternatives, ...additional], proxy)
        proxy.OrFiltered = (_filter: unknown, alternatives: Array<{ alt: () => any }>) =>
            collector.handleOr(alternatives, proxy)
        proxy.OrSingleTokens = (alternatives: Array<{ tokenName: string; alt: () => any }>) =>
            collector.handleOr(alternatives, proxy)
        proxy.OrSingleTokenValues = (alternatives: Array<{
            tokenName: string; tokenValue?: string; alt: () => any
        }>) => collector.handleOr(alternatives, proxy)
        proxy.TokenSwitch = (alternatives: Array<{
            tokenName?: string; tokenValue?: string; alt: () => any
        }>) => collector.handleOr(alternatives, proxy)
        proxy.Many = (fn: () => any) => collector.handleMany(fn, proxy)
        proxy.ManyUntil = (stopTokens: readonly string[], fn: () => any) =>
            collector.handleMany(fn, proxy, stopTokens)
        proxy.ManyFiltered = (_filter: unknown, fn: () => any) => collector.handleMany(fn, proxy)
        proxy.ManyTolerant = (fn: () => any) => collector.handleMany(fn, proxy)
        proxy.Option = (fn: () => any) => collector.handleOption(fn, proxy)
        proxy.AtLeastOne = (fn: () => any) => collector.handleAtLeastOne(fn, proxy)
        proxy.consume = (tokenName: string) => collector.handleConsume(tokenName)
        proxy._consumeToken = (tokenName: string) => collector.handleConsume(tokenName)
        proxy.consumePartialToken = (tokenName: string) => collector.handleConsume(tokenName)
        proxy.tokenConsumer = collector.createTokenConsumerProxy((parser as any).tokenConsumer)

        for (const ruleName of this.getAllRuleNames(parser)) {
            const original = (parser as any)[ruleName]
            if (typeof original !== 'function') {
                continue
            }
            proxy[ruleName] = function (...args: any[]) {
                if (collector.isExecutingTopLevelRule && ruleName === collector.currentRuleName) {
                    collector.isExecutingTopLevelRule = false
                    if (collector.executingRuleStack.has(ruleName)) {
                        return collector.handleSubrule(ruleName)
                    }
                    collector.executingRuleStack.add(ruleName)
                    try {
                        const originalFun = (original as any).__originalFunction__ || original
                        return originalFun.call(proxy, ...args)
                    } finally {
                        collector.executingRuleStack.delete(ruleName)
                    }
                }
                return collector.handleSubrule(ruleName)
            }
        }

        return proxy as SubhutiParser

        /*
        const proxy = new Proxy(parser, {
            get(target: any, prop: string | symbol) {
                // if (prop === 'Or' || prop === 'Arguments') {
                //     console.log(`[PROXY] get: ${String(prop)}`)
                // }

                // 拦截核心方法
                if (prop === 'Or') {
                    const debugRules = ['ConditionalExpression', 'AssignmentExpression', 'Expression', 'Statement']
                    const isDebugRule = debugRules.includes(collector.currentRuleName)

                    return (alternatives: Array<{ alt: () => any }>) => {
                        return collector.handleOr(alternatives, proxy)
                    }
                }
                if (prop === 'Many') {
                    return (fn: () => any) =>
                        collector.handleMany(fn, proxy)
                }
                if (prop === 'Option') {
                    return (fn: () => any) =>
                        collector.handleOption(fn, proxy)
                }
                if (prop === 'AtLeastOne') {
                    return (fn: () => any) =>
                        collector.handleAtLeastOne(fn, proxy)
                }
                // 拦截 consume 和 _consumeToken（兼容两种调用方式）
                if (prop === 'consume' || prop === '_consumeToken') {
                    return (tokenName: string) =>
                        collector.handleConsume(tokenName)
                }

                // 拦截 tokenConsumer，返回代理对象
                if (prop === 'tokenConsumer') {
                    const originalConsumer = Reflect.get(target, prop)
                    return collector.createTokenConsumerProxy(originalConsumer)
                }

                // 拦截子规则调用（以大写字母开头的方法，但排除核心方法）
                const original = Reflect.get(target, prop)
                const coreMethod = ['Or', 'Many', 'Option', 'AtLeastOne', 'consume', '_consumeToken', 'tokenConsumer']
                if (typeof original === 'function' &&
                    typeof prop === 'string' &&
                    /^[A-Z]/.test(prop) &&
                    !coreMethod.includes(prop)) {
                    return function (...args: any[]) {
                        const debugRules = ['ConditionalExpression', 'AssignmentExpression', 'Expression', 'Statement']
                        const isDebugRule = debugRules.includes(prop)

                        // 如果是顶层规则调用（收集该规则本身），执行原方法
                        if (collector.isExecutingTopLevelRule && prop === collector.currentRuleName) {
                            collector.isExecutingTopLevelRule = false

                            // 检测递归：如果规则已在执行栈中，说明是递归调用
                            if (collector.executingRuleStack.has(prop)) {
                                // 记录递归调用，但不执行（防止无限递归）
                                return collector.handleSubrule(prop)
                            }

                            // 将规则加入执行栈
                            collector.executingRuleStack.add(prop)

                            try {
                                // 获取原始函数（绕过装饰器），在 proxy 上下文中执行
                                const originalFun = (original as any).__originalFunction__ || original

                                // 在 proxy 上下文中执行原始函数
                                const result = originalFun.call(proxy, ...args)

                                return result
                            } finally {
                                // 执行完成后，从执行栈中移除
                                collector.executingRuleStack.delete(prop)
                            }
                        }

                        // 如果是子规则调用，只记录，不执行
                        return collector.handleSubrule(prop)
                    }
                }

                // 其他属性/方法保持原样
                return original
            }
        })

        return proxy
         */
    }

    /**
     * 创建 TokenConsumer 代理（拦截 token 消费调用）
     */
    private createTokenConsumerProxy(tokenConsumer: any): any {
        const collector = this

        const facade: any = Object.create(tokenConsumer)
        let proto: any = tokenConsumer
        while (proto != null) {
            for (const prop of Object.getOwnPropertyNames(proto)) {
                if (prop === 'constructor' || typeof tokenConsumer[prop] !== 'function') {
                    continue
                }
                facade[prop] = function () {
                    collector.handleConsume(prop)
                    return undefined
                }
            }
            proto = Object.getPrototypeOf(proto)
        }
        return facade

        /*
        return new Proxy(tokenConsumer, {
            get(target: any, prop: string | symbol) {
                const original = Reflect.get(target, prop)

                // 拦截所有方法调用（除了特殊属性）
                if (typeof original === 'function' && typeof prop === 'string') {
                    return function (...args: any[]) {
                        // 记录 token 消费（方法名即 token 名）
                        collector.handleConsume(prop)

                        // 不需要执行原方法，因为我们只是收集 AST 结构
                        // 直接返回 undefined
                        return undefined

                        // // 尝试执行原方法，但捕获异常
                        // try {
                        //     return original.apply(target, args)
                        // } catch (error: any) {
                        //     // 消费失败（缺少token），但我们已经记录了consume调用
                        //     // 返回undefined，让规则继续执行
                        //     return undefined
                        // }
                    }
                }

                return original
            }
        })
         */
    }

    /** An incomplete rule cannot be used for validation or prediction. */
    private collectRule(proxy: SubhutiParser, ruleName: string, variant: RuleCollectionVariant): SequenceNode {
        // ⏱️ 记录开始时间
        const startTime = Date.now()

        // 重置状态
        this.currentRuleName = ruleName
        this.currentRuleStack = []
        this.isExecutingTopLevelRule = false

        // 创建根 Sequence 节点
        const rootNode: SequenceNode = {
            type: 'sequence',
            ruleName: ruleName,
            ...((variant.args?.length || variant.lookahead) ? {
                collectionVariant: {
                    ...(variant.args?.length ? { args: [...variant.args] } : {}),
                    ...(variant.lookahead ? {
                        lookahead: Object.fromEntries(
                            Object.entries(variant.lookahead).map(([offset, token]) => [
                                Number(offset),
                                { ...token },
                            ]),
                        ),
                    } : {}),
                },
            } : {}),
            nodes: []
        }
        this.currentRuleStack.push(rootNode)
        const proxyObject = proxy as any
        const ownLA = Object.getOwnPropertyDescriptor(proxyObject, 'LA')
        const originalLA = proxyObject.LA
        proxyObject.LA = (offset: number) => {
            const observed = variant.lookahead?.[offset] ?? originalLA.call(proxyObject, offset)
            const observation: RulePredicateObservation = {
                kind: 'LA',
                offset,
                ...(observed ? {
                    tokenName: observed.tokenName,
                    ...(observed.tokenValue !== undefined ? { tokenValue: observed.tokenValue } : {}),
                } : {}),
            }
            const activeSequence = this.currentRuleStack[this.currentRuleStack.length - 1]
            if (activeSequence) {
                activeSequence.predicateObservations = [
                    ...(activeSequence.predicateObservations ?? []),
                    observation,
                ]
            }
            return observed
        }

        try {
            // 执行规则（分析模式下会记录调用，不会抛解析异常）
            // 注意：这里调用proxy的方法，让内部的子规则调用被拦截
            const ruleMethod = (proxy as any)[ruleName]
            if (typeof ruleMethod !== 'function') throw new Error('Missing rule method')
            this.isExecutingTopLevelRule = true
            ruleMethod.call(proxy, ...(variant.args ?? []))

            // ⏱️ 计算耗时
            const elapsed = Date.now() - startTime

            // 如果超过10秒，输出警告
            if (elapsed > 10000) {
                console.error(`❌❌❌ Rule "${ruleName}" took ${elapsed}ms (${(elapsed / 1000).toFixed(2)}s) - EXTREMELY SLOW!`)
            }
            return rootNode
        } catch (error) {
            throw new Error(`Cannot collect rule "${ruleName}"`, { cause: error })
        } finally {
            if (ownLA) Object.defineProperty(proxyObject, 'LA', ownLA)
            else delete proxyObject.LA
            this.isExecutingTopLevelRule = false
            this.currentRuleStack = []
        }
    }

    /**
     * 获取所有规则名称（遍历整个原型链，只收集被 @SubhutiRule 装饰的方法）
     *
     * 通过检查 __isSubhutiRule__ 元数据标记来区分规则方法和普通方法
     */
    private getAllRuleNames(parser: SubhutiParser): string[] {
        const ruleNames = new Set<string>()
        let prototype = Object.getPrototypeOf(parser)

        // 遍历整个原型链，直到 Object.prototype
        while (prototype && prototype !== Object.prototype) {
            // 遍历当前原型的所有方法
            for (const key of Object.getOwnPropertyNames(prototype)) {
                if (key === 'constructor') continue

                const descriptor = Object.getOwnPropertyDescriptor(prototype, key)
                if (descriptor && typeof descriptor.value === 'function') {
                    // ✅ 检查是否是 @SubhutiRule 装饰的方法
                    const method = descriptor.value
                    if (method.__isSubhutiRule__ === true) {
                        ruleNames.add(key)
                    }
                }
            }

            // 移动到父类原型
            prototype = Object.getPrototypeOf(prototype)
        }

        return Array.from(ruleNames)
    }

    // ============================================
    // Proxy 拦截方法
    // ============================================

    /**
     * 处理 Or 规则
     */
    private handleOr(alternatives: Array<{ alt: () => any }>, target: any): void {
        const altNodes: SequenceNode[] = []

        for (let i = 0; i < alternatives.length; i++) {
            const alt = alternatives[i]
            // 进入新的序列
            const seqNode: SequenceNode = { type: 'sequence', nodes: [] }
            this.currentRuleStack.push(seqNode)

            try {
                alt.alt.call(target)
            } finally {
                this.currentRuleStack.pop()
            }
            altNodes.push(seqNode)
        }

        this.recordNode({ type: 'or', alternatives: altNodes })
    }

    /**
     * 处理 Many 规则
     */
    private handleMany(fn: () => any, target: any, stopTokens?: readonly string[]): void {
        const seqNode: SequenceNode = { type: 'sequence', nodes: [] }
        this.currentRuleStack.push(seqNode)

        try {
            fn.call(target)
        } finally {
            this.currentRuleStack.pop()
        }
        this.recordNode({
            type: 'many',
            ...(stopTokens ? { stopTokens: [...stopTokens] } : {}),
            node: seqNode,
        })
    }

    /**
     * 处理 Option 规则
     */
    private handleOption(fn: () => any, target: any): void {
        const seqNode: SequenceNode = { type: 'sequence', nodes: [] }
        this.currentRuleStack.push(seqNode)

        try {
            fn.call(target)
        } finally {
            this.currentRuleStack.pop()
        }
        this.recordNode({ type: 'option', node: seqNode })
    }

    /**
     * 处理 AtLeastOne 规则
     */
    private handleAtLeastOne(fn: () => any, target: any): void {
        const seqNode: SequenceNode = { type: 'sequence', nodes: [] }
        this.currentRuleStack.push(seqNode)

        try {
            fn.call(target)
        } finally {
            this.currentRuleStack.pop()
        }
        this.recordNode({ type: 'atLeastOne', node: seqNode })
    }

    /**
     * 处理 consume
     */
    private handleConsume(tokenName: string): void {
        const tokenNode: ConsumeNode = { type: 'consume', tokenName }
        this.tokenAstCache.set(tokenName, tokenNode)
        this.recordNode(tokenNode)
    }

    /**
     * 处理子规则调用
     */
    private handleSubrule(ruleName: string): any {
        this.recordNode({ type: 'subrule', ruleName })
    }

    /**
     * 记录节点到当前序列
     */
    private recordNode(node: RuleNode): void {
        const currentSeq = this.currentRuleStack[this.currentRuleStack.length - 1]
        if (currentSeq) {
            currentSeq.nodes.push(node)
        }
    }
}

