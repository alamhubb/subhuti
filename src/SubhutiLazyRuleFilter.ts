export type LookaheadPath =
    | { readonly kind: 'token'; readonly name: string }
    | { readonly kind: 'rule'; readonly name: string }
    | { readonly kind: 'sequence'; readonly parts: readonly LookaheadPath[] }
    | { readonly kind: 'choice'; readonly parts: readonly LookaheadPath[] }
    | { readonly kind: 'optional'; readonly body: LookaheadPath }
    | { readonly kind: 'repeat'; readonly body: LookaheadPath }

export const pathToken = (name: string): LookaheadPath => ({ kind: 'token', name })
export const pathRule = (name: string): LookaheadPath => ({ kind: 'rule', name })
export const pathSequence = (...parts: LookaheadPath[]): LookaheadPath => ({ kind: 'sequence', parts })
export const pathChoice = (...parts: LookaheadPath[]): LookaheadPath => ({ kind: 'choice', parts })
export const pathOptional = (body: LookaheadPath): LookaheadPath => ({ kind: 'optional', body })
export const pathRepeat = (body: LookaheadPath): LookaheadPath => ({ kind: 'repeat', body })

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
    stack: readonly StackEntry[]
}

interface State {
    tokens: PendingToken[]
    accepted: Set<number>
    transitions: Map<string, State | null>
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

    constructor(
        alternatives: readonly LookaheadPath[],
        private readonly rules: Readonly<Record<string, LookaheadPath>>,
        maxStates = 4096,
    ) {
        this.maxStates = maxStates
        this.initial = this.close(alternatives.map((path, branch) => ({
            branch, stack: [path], activeRules: new Set(), activeRepeats: new Set(),
        })))
    }

    get cachedStateCount(): number {
        return this.statesByKey.size
    }

    /**
     * Only a definite mismatch may stop an optional/repeated rule. Nullable
     * paths and unsafe descriptions leave the runtime parser in control.
     */
    canStart(tokenName: string | undefined): boolean | null {
        const state = this.initial
        if (!state || state.accepted.size) return null
        return state.tokens.some(item => item.name === tokenName)
    }

    /**
     * Returns a branch to try first, or null when the graph cannot prove
     * enough. The ordinary Or still handles failure and error recovery.
     */
    predict(readTokenName: (offset: number) => string | undefined): number | null {
        let state = this.initial
        for (let offset = 1; state; offset++) {
            const active = new Set(state.accepted)
            for (const item of state.tokens) active.add(item.branch)
            if (active.size === 0) return null
            const first = Math.min(...active)
            if (active.size === 1 || state.accepted.has(first)) return first

            const token = readTokenName(offset)
            if (token === undefined) {
                return state.accepted.size ? Math.min(...state.accepted) : null
            }
            if (!state.transitions.has(token)) {
                const next = state.tokens
                    .filter(item => item.name === token)
                    .map(item => ({
                        branch: item.branch, stack: item.stack,
                        activeRules: new Set<string>(), activeRepeats: new Set<number>(),
                    }))
                const advanced = this.close(next, state.accepted)
                state.transitions.set(token, advanced)
            }
            state = state.transitions.get(token) ?? null
        }
        return null
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
            if (visited.size > this.maxStates) return null
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
                    tokens.push({ branch: position.branch, name: node.name, stack: rest })
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
            tokens.map(item => [item.branch, item.name, this.stackKey(item.stack)])
                .map(item => JSON.stringify(item)).sort(),
        ])
        const existing = this.statesByKey.get(key)
        if (existing) return existing
        if (this.statesByKey.size >= this.maxStates) return null
        const state = { tokens, accepted, transitions: new Map<string, State | null>() }
        this.statesByKey.set(key, state)
        return state
    }
}
