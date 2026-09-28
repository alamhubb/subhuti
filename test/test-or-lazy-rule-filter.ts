import assert from 'node:assert/strict'
import SubhutiParser, { SubhutiRule } from '../src/SubhutiParser.ts'
import SubhutiTokenConsumer from '../src/SubhutiTokenConsumer.ts'
import { SubhutiLazyRuleFilter, pathToken as t, pathRule as r, pathSequence as seq, pathRepeat as many } from '../src/SubhutiLazyRuleFilter.ts'
import { createKeywordToken, createRegToken, createValueRegToken } from '../src/struct/SubhutiCreateToken.ts'

const tokens = [
    createKeywordToken('A', 'a'), createKeywordToken('B', 'b'),
    createKeywordToken('C', 'c'), createRegToken('Comma', /,/),
    createValueRegToken('Space', /\s+/, ' ', true),
]
const filter = new SubhutiLazyRuleFilter([
    seq(r('List'), t('B')), seq(r('List'), t('C')),
], { List: seq(t('A'), many(seq(t('Comma'), t('A')))) })
assert.equal(filter.predict(i => ['A', 'Comma', 'A', 'C'][i - 1]), 1)

class Consumer extends SubhutiTokenConsumer {
    A() { return this.consume('A') }
    B() { return this.consume('B') }
    C() { return this.consume('C') }
    Comma() { return this.consume('Comma') }
}

class Parser extends SubhutiParser<Consumer> {
    attempts: number[] = []

    constructor(source: string, enabled: boolean) {
        super(source, { tokenConsumer: Consumer, tokenDefinitions: tokens })
        this.filterOrByLazyRules(enabled)
    }

    names() {
        return Array.from({ length: 5 }, (_, i) => this.LA(i + 1)?.tokenName)
    }

    @SubhutiRule
    List() {
        this.tokenConsumer.A()
        this.Many(() => {
            this.tokenConsumer.Comma()
            this.tokenConsumer.A()
        })
    }

    @SubhutiRule
    Choice() {
        this.OrFiltered(filter, [
            { alt: () => { this.attempts.push(0); this.List(); this.tokenConsumer.B() } },
            { alt: () => { this.attempts.push(1); this.List(); this.tokenConsumer.C() } },
        ])
    }
}

class Repeated extends SubhutiParser<Consumer> {
    attempts = 0
    constructor(source: string, enabled: boolean) {
        super(source, { tokenConsumer: Consumer, tokenDefinitions: tokens })
        this.filterOrByLazyRules(enabled)
    }
    @SubhutiRule
    Items() {
        this.ManyFiltered(new SubhutiLazyRuleFilter([t('A')], {}), () => {
            this.attempts++
            this.tokenConsumer.A()
        })
        this.tokenConsumer.C()
    }
}

for (const source of ['c', 'a c', 'a a c', 'a b']) {
    const baseline = new Repeated(source, false)
    const filtered = new Repeated(source, true)
    const parse = (parser: Repeated) => {
        try { return JSON.stringify(parser.Items()) }
        catch (error) { return (error as Error).constructor.name }
    }
    assert.equal(parse(filtered), parse(baseline), source)
    assert.ok(filtered.attempts <= baseline.attempts, source)
}

for (const length of [1, 2, 10, 100]) {
    const prefix = Array(length).fill('a').join(',')
    for (const suffix of ['b', 'c', '', 'a']) {
        const source = prefix + (suffix ? ` ${suffix}` : '')
        const baseline = new Parser(source, false)
        const filtered = new Parser(source, true)
        if (length === 2 && suffix === 'c') {
            const names = filtered.names()
            assert.deepEqual(names, ['A', 'Comma', 'A', 'C', undefined])
            assert.equal(filter.predict(i => names[i - 1]), 1)
        }
        const result = (parser: Parser) => {
            try {
                return { cst: JSON.stringify(parser.Choice()), tokens: parser.parsedTokens.map(t => t.tokenName), error: null }
            } catch (error) {
                return { cst: null, tokens: parser.parsedTokens.map(t => t.tokenName), error: (error as Error).constructor.name }
            }
        }
        assert.deepEqual(result(filtered), result(baseline), source)
        if (suffix === 'c') assert.deepEqual(filtered.attempts, [1], source)
    }
}

console.log('OR_LAZY_RULE_FILTER status=OK cases=16')
