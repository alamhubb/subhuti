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

class Variadic extends SubhutiParser<Consumer> {
    constructor() {
        super('', { tokenDefinitions: tokens, tokenConsumer: Consumer })
    }

    @SubhutiRule
    Entry() {
        this.Or(
            { alt: () => this.ManyTolerant(() => this.tokenConsumer.A()) },
            { alt: () => this.tokenConsumer.B() },
        )
    }
}

const variadic = SubhutiRuleCollector.collectRules(new Variadic())
assert.deepEqual(variadic.cstMap.get('Entry')?.nodes, [{
    type: 'or',
    alternatives: [
        { type: 'sequence', nodes: [{
            type: 'many',
            node: { type: 'sequence', nodes: [{ type: 'consume', tokenName: 'A' }] },
        }] },
        { type: 'sequence', nodes: [{ type: 'consume', tokenName: 'B' }] },
    ],
}])

class SingleTokens extends SubhutiParser<Consumer> {
    constructor() {
        super('', { tokenDefinitions: tokens, tokenConsumer: Consumer })
    }
    @SubhutiRule
    Entry() {
        this.OrSingleTokens([
            { tokenName: 'A', alt: () => this.tokenConsumer.A() },
            { tokenName: 'B', alt: () => this.tokenConsumer.B() },
        ])
    }
}
assert.deepEqual(SubhutiRuleCollector.collectRules(new SingleTokens()).cstMap.get('Entry')?.nodes, [{
    type: 'or', alternatives: [
        { type: 'sequence', nodes: [{ type: 'consume', tokenName: 'A' }] },
        { type: 'sequence', nodes: [{ type: 'consume', tokenName: 'B' }] },
    ],
}])

class SingleTokenValues extends SingleTokens {
    @SubhutiRule
    override Entry() {
        this.OrSingleTokenValues([
            { tokenName: 'A', tokenValue: 'a', alt: () => this.tokenConsumer.A() },
            { tokenName: 'B', tokenValue: 'b', alt: () => this.tokenConsumer.B() },
        ])
    }
}
assert.deepEqual(SubhutiRuleCollector.collectRules(new SingleTokenValues()).cstMap.get('Entry')?.nodes,
    SubhutiRuleCollector.collectRules(new SingleTokens()).cstMap.get('Entry')?.nodes)

class PartialToken extends SingleTokens {
    @SubhutiRule
    override Entry() {
        this.consumePartialToken('A', 1)
    }
}
assert.deepEqual(SubhutiRuleCollector.collectRules(new PartialToken()).cstMap.get('Entry')?.nodes, [
    { type: 'consume', tokenName: 'A' },
])

class Rooted extends SubhutiParser<Consumer> {
    constructor() {
        super('', { tokenDefinitions: tokens, tokenConsumer: Consumer })
    }

    @SubhutiRule
    Entry() { this.Child() }

    @SubhutiRule
    Child() { this.tokenConsumer.A() }

    @SubhutiRule
    Unused() { throw new Error('unreachable rule') }
}

const rooted = new Rooted()
const reachable = SubhutiRuleCollector.collectRules(rooted, ['Entry'])
assert.deepEqual([...reachable.cstMap.keys()], ['Entry', 'Child'])
assert.deepEqual([...reachable.tokenMap.keys()], ['A'])
assert.equal((rooted as any)._analysisMode, false)
assert.throws(() => SubhutiRuleCollector.collectRules(new Rooted(), ['Missing']), /Unknown rule "Missing"/)
assert.throws(() => SubhutiRuleCollector.collectRules(new Rooted(), []), /At least one root rule/)

class Parameterized extends SubhutiParser<Consumer> {
    constructor() {
        super('', { tokenDefinitions: tokens, tokenConsumer: Consumer })
    }

    @SubhutiRule
    Entry(mode: 'default' | 'extra' = 'default') {
        if (mode === 'extra') this.Child()
        else this.tokenConsumer.A()
    }

    @SubhutiRule
    Child() { this.tokenConsumer.B() }
}

const parameterized = new Parameterized()
const variants = SubhutiRuleCollector.collectRules(parameterized, ['Entry'], {
    Entry: [{ args: ['extra'] }],
})
assert.deepEqual([...variants.cstMap.keys()], ['Entry', 'Child'])
assert.deepEqual(variants.cstMap.get('Entry'), {
    type: 'sequence',
    ruleName: 'Entry',
    nodes: [{
        type: 'or',
        alternatives: [
            { type: 'sequence', ruleName: 'Entry',
                nodes: [{ type: 'consume', tokenName: 'A' }] },
            { type: 'sequence', ruleName: 'Entry',
                collectionVariant: { args: ['extra'] },
                nodes: [{ type: 'subrule', ruleName: 'Child' }] },
        ],
    }],
})
assert.deepEqual([...variants.tokenMap.keys()], ['A', 'B'])
assert.equal((parameterized as any)._analysisMode, false)
assert.throws(() => SubhutiRuleCollector.collectRules(new Parameterized(), ['Entry'], {
    Missing: [{}],
}), /Unknown variant rule "Missing"/)

class LookaheadVariant extends SubhutiParser<Consumer> {
    constructor() {
        super('', { tokenDefinitions: tokens, tokenConsumer: Consumer })
    }

    @SubhutiRule
    Entry() {
        if (this.LA(1)?.tokenValue === 'b') this.tokenConsumer.B()
        else this.tokenConsumer.A()
    }
}
const lookaheadParser = new LookaheadVariant()
const lookaheadVariants = SubhutiRuleCollector.collectRules(lookaheadParser, ['Entry'], {
    Entry: [{ lookahead: { 1: { tokenName: 'B', tokenValue: 'b' } } }],
})
assert.deepEqual(lookaheadVariants.cstMap.get('Entry')?.nodes, [{
    type: 'or',
    alternatives: [
        { type: 'sequence', ruleName: 'Entry',
            nodes: [{ type: 'consume', tokenName: 'A' }] },
        { type: 'sequence', ruleName: 'Entry',
            collectionVariant: {
                lookahead: { 1: { tokenName: 'B', tokenValue: 'b' } },
            },
            nodes: [{ type: 'consume', tokenName: 'B' }] },
    ],
}])
assert.equal(lookaheadParser.LA(1), undefined)
assert.equal((lookaheadParser as any)._analysisMode, false)

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

class FailingVariant extends Parameterized {
    @SubhutiRule
    override Entry(mode: 'default' | 'extra' = 'default') {
        if (mode === 'extra') throw new Error('variant failed')
        super.Entry(mode)
    }
}
const failingVariant = new FailingVariant()
assert.throws(() => SubhutiRuleCollector.collectRules(failingVariant, ['Entry'], {
    Entry: [{ args: ['extra'] }],
}), error => error instanceof Error
    && error.message === 'Cannot collect rule "Entry"'
    && error.cause instanceof Error
    && error.cause.message === 'variant failed')
assert.equal((failingVariant as any)._analysisMode, false)

class FailingLookaheadVariant extends LookaheadVariant {
    @SubhutiRule
    override Entry() {
        if (this.LA(1)?.tokenValue === 'b') throw new Error('lookahead variant failed')
        super.Entry()
    }
}
const failingLookahead = new FailingLookaheadVariant()
assert.throws(() => SubhutiRuleCollector.collectRules(failingLookahead, ['Entry'], {
    Entry: [{ lookahead: { 1: { tokenName: 'B', tokenValue: 'b' } } }],
}), error => error instanceof Error
    && error.message === 'Cannot collect rule "Entry"'
    && error.cause instanceof Error
    && error.cause.message === 'lookahead variant failed')
assert.equal(failingLookahead.LA(1), undefined)
assert.equal(Object.hasOwn(failingLookahead, 'LA'), false)
assert.equal((failingLookahead as any)._analysisMode, false)

console.log('RULE_COLLECTOR_COMPLETENESS status=OK cases=21')
