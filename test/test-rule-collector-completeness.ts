import assert from 'node:assert/strict'
import SubhutiParser, { SubhutiRule } from '../src/SubhutiParser.ts'
import SubhutiTokenConsumer from '../src/SubhutiTokenConsumer.ts'
import { SubhutiLazyRuleFilter, pathToken } from '../src/SubhutiLazyRuleFilter.ts'
import { SubhutiRuleCollector } from '../src/validation/analyzers/SubhutiRuleCollector.ts'
import { createKeywordToken } from '../src/struct/SubhutiCreateToken.ts'

const tokens = [
    createKeywordToken('A', 'a'),
    createKeywordToken('B', 'b'),
    createKeywordToken('C', 'c'),
]
const filter = new SubhutiLazyRuleFilter([pathToken('A'), pathToken('C')], {})

class Consumer extends SubhutiTokenConsumer {
    A() { return this.consume('A') }
    B() { return this.consume('B') }
    C() { return this.consume('C') }
}

class Covered extends SubhutiParser<Consumer> {
    constructor() {
        super('', { tokenDefinitions: tokens, tokenConsumer: Consumer })
    }

    @SubhutiRule
    Entry() {
        this.OrFiltered(filter, [
            { alt: () => {
                this.tokenConsumer.A()
                this.ManyFiltered(filter, () => this.tokenConsumer.B())
            } },
            { alt: () => this.tokenConsumer.C() },
        ])
    }
}

const covered = new Covered()
const collected = SubhutiRuleCollector.collectRules(covered)
assert.deepEqual(collected.cstMap.get('Entry'), {
    type: 'sequence',
    ruleName: 'Entry',
    nodes: [{
        type: 'or',
        alternatives: [
            { type: 'sequence', nodes: [
                { type: 'consume', tokenName: 'A' },
                { type: 'many', node: { type: 'sequence', nodes: [
                    { type: 'consume', tokenName: 'B' },
                ] } },
            ] },
            { type: 'sequence', nodes: [{ type: 'consume', tokenName: 'C' }] },
        ],
    }],
})
assert.deepEqual([...collected.tokenMap.keys()], ['A', 'B', 'C'])
assert.equal((covered as any)._analysisMode, false)

type FailureKind = 'rule' | 'or' | 'orFiltered' | 'many' | 'manyFiltered' | 'option' | 'atLeastOne'
class Failing extends SubhutiParser<Consumer> {
    constructor(private readonly kind: FailureKind) {
        super('', { tokenDefinitions: tokens, tokenConsumer: Consumer })
    }

    @SubhutiRule
    Entry() {
        const fail = () => {
            this.tokenConsumer.A()
            throw new Error('incomplete branch')
        }
        switch (this.kind) {
            case 'rule': fail(); break
            case 'or': this.Or([{ alt: () => this.tokenConsumer.B() }, { alt: fail }]); break
            case 'orFiltered': this.OrFiltered(filter, [
                { alt: () => this.tokenConsumer.B() }, { alt: fail },
            ]); break
            case 'many': this.Many(fail); break
            case 'manyFiltered': this.ManyFiltered(filter, fail); break
            case 'option': this.Option(fail); break
            case 'atLeastOne': this.AtLeastOne(fail); break
        }
    }
}

for (const kind of ['rule', 'or', 'orFiltered', 'many', 'manyFiltered', 'option', 'atLeastOne'] as const) {
    const parser = new Failing(kind)
    assert.throws(() => SubhutiRuleCollector.collectRules(parser), error =>
        error instanceof Error
        && error.message === 'Cannot collect rule "Entry"'
        && error.cause instanceof Error
        && error.cause.message === 'incomplete branch', kind)
    assert.equal((parser as any)._analysisMode, false, kind)
}

console.log('RULE_COLLECTOR_COMPLETENESS status=OK cases=8')
