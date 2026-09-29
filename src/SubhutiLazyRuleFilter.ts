export type LookaheadPath =
    | { readonly kind: 'token'; readonly name: string; readonly value?: string }
    | { readonly kind: 'rule'; readonly name: string }
    | { readonly kind: 'sequence'; readonly parts: readonly LookaheadPath[] }
    | { readonly kind: 'choice'; readonly parts: readonly LookaheadPath[] }
    | { readonly kind: 'optional'; readonly body: LookaheadPath }
    | { readonly kind: 'repeat'; readonly body: LookaheadPath }
    | { readonly kind: 'unknown' }

export const pathToken = (name: string): LookaheadPath => ({ kind: 'token', name })
export const pathTokenValue = (name: string, value: string): LookaheadPath =>
    ({ kind: 'token', name, value })
export const pathRule = (name: string): LookaheadPath => ({ kind: 'rule', name })
export const pathSequence = (...parts: LookaheadPath[]): LookaheadPath => ({ kind: 'sequence', parts })
export const pathChoice = (...parts: LookaheadPath[]): LookaheadPath => ({ kind: 'choice', parts })
export const pathOptional = (body: LookaheadPath): LookaheadPath => ({ kind: 'optional', body })
export const pathRepeat = (body: LookaheadPath): LookaheadPath => ({ kind: 'repeat', body })
export const pathUnknown = (): LookaheadPath => ({ kind: 'unknown' })

type StackEntry = LookaheadPath
    | { readonly kind: 'endRule'; readonly name: string }
    | { readonly kind: 'endRepeat'; readonly node: LookaheadPath }

interface Position {
    branch: number
    stack: readonly StackEntry[]
    activeRules: ReadonlySet<string>
    activeRepeats: ReadonlySet<number>
}

interface PendingToken {
    branch: number
    name: string
    value?: string
    stack: readonly StackEntry[]
}

export interface LookaheadToken {
    readonly name: string
    readonly value?: string
}

export type ReadLookaheadToken = string | LookaheadToken

interface State {
    tokens: PendingToken[]
    accepted: Set<number>
    transitions: Map<string, State | null>
    byToken: Map<string, PendingToken[]>
    valuesByToken: Map<string, Set<string>>
    candidates: readonly number[]
    acceptedBranches: readonly number[]
    decision: number | null
    endDecision: number | null
}

/**
 * A shared, lazy prefix graph for one ordered choice. The descriptions must
 * overapproximate the runtime grammar; opaque predicates require falling back
 * to the ordinary parser. No source text or CST is stored in this cache.
 */
export class SubhutiLazyRuleFilter {
    private readonly ids = new WeakMap<LookaheadPath, number>()
    private nextId = 0
    private readonly statesByKey = new Map<string, State>()
    private readonly initial: State | null
    private readonly maxStates: number
    private transitionCount = 0
    private transitionHits = 0
    private transitionMisses = 0
    private budgetFallbacks = 0

    constructor(
        alternatives: readonly LookaheadPath[],
        private readonly rules: Readonly<Record<string, LookaheadPath>>,
        maxStates = 4096,
        private readonly maxTransitions = maxStates * 16,
    ) {
        if (!Number.isSafeInteger(maxStates) || maxStates < 1
            || !Number.isSafeInteger(maxTransitions) || maxTransitions < 1) {
            throw new RangeError('Lazy filter cache budgets must be positive safe integers')
        }
        this.maxStates = maxStates
        this.initial = this.close(alternatives.map((path, branch) => ({
            branch, stack: [path], activeRules: new Set(), activeRepeats: new Set(),
        })))
    }

    get cachedStateCount(): number {
        return this.statesByKey.size
    }

    get cacheStats() {
        return {
            states: this.cachedStateCount,
            transitions: this.transitionCount,
            hits: this.transitionHits,
            misses: this.transitionMisses,
            budgetFallbacks: this.budgetFallbacks,
        }
    }

    /**
     * Only a definite mismatch may stop an optional/repeated rule. Nullable
     * paths and unsafe descriptions leave the runtime parser in control.
     */
    canStart(token: ReadLookaheadToken | undefined): boolean | null {
        const state = this.initial
        if (!state || state.accepted.size) return null
        if (token === undefined) return false
        const tokenName = typeof token === 'string' ? token : token.name
        return state.byToken.has(tokenName)
    }

    /**
     * Returns a branch to try first, or null when the graph cannot prove
     * enough. The ordinary Or still handles failure and error recovery.
     */
    predict(readToken: (offset: number) => ReadLookaheadToken | undefined): number | null {
        let state = this.initial
        for (let offset = 1; state; offset++) {
            if (state.decision !== null) return state.decision
            if (state.byToken.size === 0) return null

            const token = readToken(offset)
            if (token === undefined) {
                return state.endDecision
            }
            const actual = typeof token === 'string' ? { name: token } : token
            state = this.advance(state, actual)
        }
        return null
    }

    /**
     * An ordered, conservative set: a removed branch cannot match this prefix.
     * Unknown grammar tails keep their branch alive, rather than nominating a
     * later branch that might change PEG choice priority.
     */
    predictCandidates(readToken: (offset: number) => ReadLookaheadToken | undefined): readonly number[] | null {
        let state = this.initial
        for (let offset = 1; state; offset++) {
            if (state.decision !== null || !state.byToken.size) {
                return state.candidates
            }
            const token = readToken(offset)
            if (token === undefined) return state.acceptedBranches
            state = this.advance(state, typeof token === 'string' ? {name: token} : token)
        }
        return null
    }

    private advance(state: State, actual: LookaheadToken): State | null {
        const values = state.valuesByToken.get(actual.name)
        const valueClass = actual.value !== undefined && values?.has(actual.value) ? actual.value : null
        const transitionKey = JSON.stringify([
            actual.name, valueClass, values !== undefined && actual.value === undefined,
        ])
        if (state.transitions.has(transitionKey)) {
            this.transitionHits++
            return state.transitions.get(transitionKey) ?? null
        }
        this.transitionMisses++
        if (this.transitionCount >= this.maxTransitions) {
            this.budgetFallbacks++
            return null
        }
        const next = (state.byToken.get(actual.name) ?? [])
            .filter(item => actual.value === undefined
                || item.value === undefined || item.value === actual.value)
            .map(item => ({
                branch: item.branch, stack: item.stack,
                activeRules: new Set<string>(), activeRepeats: new Set<number>(),
            }))
        const advanced = this.close(next, state.accepted)
        state.transitions.set(transitionKey, advanced)
        this.transitionCount++
        return advanced
    }

    private id(node: LookaheadPath): number {
        let id = this.ids.get(node)
        if (id === undefined) {
            id = ++this.nextId
            this.ids.set(node, id)
        }
        return id
    }

    private stackKey(stack: readonly StackEntry[]): (number | readonly [string, string | number])[] {
        return stack.map(node => {
            if (node.kind === 'endRule') return ['rule', node.name] as const
            if (node.kind === 'endRepeat') return ['repeat', this.id(node.node)] as const
            return this.id(node)
        })
    }

    private close(positions: Position[], previousAccepted: ReadonlySet<number> = new Set()): State | null {
        const queue = [...positions]
        const accepted = new Set(previousAccepted)
        const tokens: PendingToken[] = []
        const visited = new Set<string>()
        while (queue.length) {
            const position = queue.pop()!
            const key = JSON.stringify([
                position.branch, this.stackKey(position.stack),
                [...position.activeRules].sort(),
                [...position.activeRepeats].sort((a, b) => a - b),
            ])
            if (visited.has(key)) continue
            visited.add(key)
            if (visited.size > this.maxStates) {
                this.budgetFallbacks++
                return null
            }
            const stack = position.stack
            if (stack.length === 0) {
                accepted.add(position.branch)
                continue
            }
            const node = stack[stack.length - 1]
            const rest = stack.slice(0, -1)
            const push = (
                next: readonly StackEntry[],
                activeRules = position.activeRules,
                activeRepeats = position.activeRepeats,
            ) => queue.push({ branch: position.branch, stack: [...rest, ...next], activeRules, activeRepeats })
            switch (node.kind) {
                case 'unknown':
                    // An opaque action may consume arbitrary input. Neither it
                    // nor its continuation can safely eliminate this branch.
                    accepted.add(position.branch)
                    break
                case 'endRule': {
                    const active = new Set(position.activeRules)
                    active.delete(node.name)
                    push([], active)
                    break
                }
                case 'endRepeat': {
                    const id = this.id(node.node)
                    if (position.activeRepeats.has(id)) return null
                    const active = new Set(position.activeRepeats)
                    active.delete(id)
                    push([], position.activeRules, active)
                    break
                }
                case 'token':
                    tokens.push({
                        branch: position.branch,
                        name: node.name,
                        value: node.value,
                        stack: rest,
                    })
                    break
                case 'rule': {
                    if (position.activeRules.has(node.name)) return null
                    const body = this.rules[node.name]
                    if (!body) return null
                    const active = new Set(position.activeRules)
                    active.add(node.name)
                    push([{ kind: 'endRule', name: node.name }, body], active)
                    break
                }
                case 'sequence':
                    push([...node.parts].reverse())
                    break
                case 'choice':
                    for (const part of node.parts) push([part])
                    break
                case 'optional':
                    push([])
                    push([node.body])
                    break
                case 'repeat':
                    if (position.activeRepeats.has(this.id(node))) return null
                    push([])
                    const active = new Set(position.activeRepeats)
                    active.add(this.id(node))
                    push([node, { kind: 'endRepeat', node }, node.body], position.activeRules, active)
                    break
            }
        }
        const key = JSON.stringify([
            [...accepted].sort((a, b) => a - b),
            tokens.map(item => [item.branch, item.name, item.value ?? null, this.stackKey(item.stack)])
                .map(item => JSON.stringify(item)).sort(),
        ])
        const existing = this.statesByKey.get(key)
        if (existing) return existing
        if (this.statesByKey.size >= this.maxStates) {
            this.budgetFallbacks++
            return null
        }
        const byToken = new Map<string, PendingToken[]>()
        const valuesByToken = new Map<string, Set<string>>()
        const active = new Set(accepted)
        for (const item of tokens) {
            active.add(item.branch)
            const group = byToken.get(item.name) ?? []
            group.push(item)
            byToken.set(item.name, group)
            if (item.value !== undefined) {
                const values = valuesByToken.get(item.name) ?? new Set<string>()
                values.add(item.value)
                valuesByToken.set(item.name, values)
            }
        }
        const first = active.size ? Math.min(...active) : null
        const decision = active.size === 1 || (first !== null && accepted.has(first)) ? first : null
        const state: State = {
            tokens, accepted, transitions: new Map(), byToken, valuesByToken, decision,
            candidates: Object.freeze([...active].sort((a, b) => a - b)),
            acceptedBranches: Object.freeze([...accepted].sort((a, b) => a - b)),
            endDecision: accepted.size ? Math.min(...accepted) : null,
        }
        this.statesByKey.set(key, state)
        return state
    }
}
