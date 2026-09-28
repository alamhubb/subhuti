import assert from 'node:assert/strict'
import {
    SubhutiLazyRuleFilter, type LookaheadPath, pathChoice, pathOptional,
    pathRepeat, pathRule, pathSequence, pathToken,
} from '../src/SubhutiLazyRuleFilter.ts'

const tokenNames = ['A', 'B'] as const
const sequences: string[][] = [[]]
for (let length = 1; length <= 5; length++) {
    for (let bits = 0; bits < 1 << length; bits++) {
        sequences.push(Array.from({ length }, (_, index) => tokenNames[(bits >> index) & 1]))
    }
}

function matches(path: LookaheadPath, tokens: readonly string[], start: number,
    rules: Readonly<Record<string, LookaheadPath>>): Set<number> {
    switch (path.kind) {
        case 'token':
            return new Set(tokens[start] === path.name ? [start + 1] : [])
        case 'rule':
            return matches(rules[path.name], tokens, start, rules)
        case 'choice': {
            const ends = new Set<number>()
            for (const part of path.parts) {
                for (const end of matches(part, tokens, start, rules)) ends.add(end)
            }
            return ends
        }
        case 'optional':
            return new Set([start, ...matches(path.body, tokens, start, rules)])
        case 'sequence': {
            let positions = new Set([start])
            for (const part of path.parts) {
                const next = new Set<number>()
                for (const position of positions) {
                    for (const end of matches(part, tokens, position, rules)) next.add(end)
                }
                positions = next
            }
            return positions
        }
        case 'repeat': {
            const ends = new Set([start])
            const pending = [start]
            for (let index = 0; index < pending.length; index++) {
                for (const end of matches(path.body, tokens, pending[index], rules)) {
                    if (!ends.has(end)) {
                        ends.add(end)
                        pending.push(end)
                    }
                }
            }
            return ends
        }
    }
}

let seed = 0x4654ab12
function random(bound: number): number {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return Math.floor((seed / 0x100000000) * bound)
}

function randomPath(depth: number): LookaheadPath {
    if (!depth || random(3) === 0) return pathToken(tokenNames[random(2)])
    switch (random(4)) {
        case 0: return pathSequence(randomPath(depth - 1), randomPath(depth - 1))
        case 1: return pathChoice(randomPath(depth - 1), randomPath(depth - 1))
        case 2: return pathOptional(randomPath(depth - 1))
        default: return pathRepeat(randomPath(depth - 1))
    }
}

let checked = 0
let decidedMatches = 0
for (let grammar = 0; grammar < 500; grammar++) {
    const rules = { Nested: randomPath(2) }
    const alternatives = [
        pathSequence(pathRule('Nested'), randomPath(2)),
        pathSequence(pathRule('Nested'), randomPath(2)),
    ]
    const filter = new SubhutiLazyRuleFilter(alternatives, rules, 256)
    for (const tokens of sequences) {
        const expected = alternatives.findIndex(path => matches(path, tokens, 0, rules).size > 0)
        const predicted = filter.predict(index => tokens[index - 1])
        // A prefix-only prediction may nominate a branch even when the
        // complete input matches none; the ordinary Or still handles failure.
        if (predicted !== null && expected !== -1) {
            assert.equal(predicted, expected,
                `grammar=${grammar} tokens=${tokens.join(',')} rules=${JSON.stringify(rules)} alternatives=${JSON.stringify(alternatives)}`)
            decidedMatches++
        }
        checked++
    }
}

assert.ok(decidedMatches > 1000, `Too few checked decisions: ${decidedMatches}`)
console.log(`LAZY_RULE_FILTER_ORACLE status=OK cases=${checked} decidedMatches=${decidedMatches}`)
