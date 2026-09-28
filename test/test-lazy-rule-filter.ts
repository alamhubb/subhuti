import assert from 'node:assert/strict'
import {
    SubhutiLazyRuleFilter, pathToken as t, pathRule as r,
    pathSequence as seq, pathChoice as choice, pathRepeat as many, pathOptional as opt,
} from '../src/SubhutiLazyRuleFilter.ts'

const parameter = choice(t('Identifier'), seq(t('LBracket'), t('Identifier'), t('RBracket')))
const list = seq(parameter, many(seq(t('Comma'), parameter)))
const filter = new SubhutiLazyRuleFilter([
    seq(t('LParen'), r('ParameterList'), t('RParen'), t('Arrow')),
    seq(t('LParen'), r('ParameterList'), t('RParen'), t('Semicolon')),
], { ParameterList: list })
const predict = (names: string[]) => filter.predict(offset => names[offset - 1])
for (const count of [1, 2, 10, 100]) {
    const prefix = ['LParen', 'Identifier']
    for (let i = 1; i < count; i++) prefix.push('Comma', 'Identifier')
    assert.equal(predict([...prefix, 'RParen', 'Arrow']), 0)
    assert.equal(predict([...prefix, 'RParen', 'Semicolon']), 1)
}
assert.equal(predict(['LParen', 'Identifier', 'RParen']), null)
assert.equal(predict(['Unknown']), null)
assert.equal(filter.canStart('LParen'), true)
assert.equal(filter.canStart('Unknown'), false)
assert.equal(filter.canStart(undefined), false)

const nested = new SubhutiLazyRuleFilter(
    [seq(r('Nested'), t('B')), seq(r('Nested'), t('C'))],
    { Nested: choice(t('A'), seq(t('LParen'), r('Nested'), t('RParen'))) },
)
assert.equal(nested.predict(i => ['LParen', 'LParen', 'A', 'RParen', 'RParen', 'C'][i - 1]), 1)
assert.equal(nested.predict(i => ['LParen', 'A', 'RParen', 'B'][i - 1]), 0)

const ordered = new SubhutiLazyRuleFilter([t('A'), seq(t('A'), t('B'))], {})
assert.equal(ordered.predict(i => ['A', 'B'][i - 1]), 0)
const unsafe = new SubhutiLazyRuleFilter([r('Left'), t('A')], { Left: r('Left') }, 30)
assert.equal(unsafe.predict(() => 'A'), null)
assert.equal(unsafe.canStart('Z'), null)
assert.equal(new SubhutiLazyRuleFilter([r('Missing'), t('A')], {}).predict(() => 'A'), null)
assert.equal(new SubhutiLazyRuleFilter([seq(many(opt(t('A'))), t('B')), t('C')], {})
    .predict(() => 'C'), null)
const repeatedRule = new SubhutiLazyRuleFilter([seq(r('Unit'), r('Unit'), t('B')), t('C')], {
    Unit: opt(t('A')),
})
assert.equal(repeatedRule.predict(i => ['A', 'A', 'B'][i - 1]), 0)
assert.equal(repeatedRule.predict(i => ['C'][i - 1]), 1)
const bounded = new SubhutiLazyRuleFilter([
    seq(many(t('A')), t('B')), seq(many(t('A')), t('C')),
], {}, 20)
const shortPrefix = [...Array(100).fill('A'), 'C']
const longPrefix = [...Array(10000).fill('A'), 'B']
assert.equal(bounded.predict(i => shortPrefix[i - 1]), 1)
assert.equal(bounded.predict(i => longPrefix[i - 1]), 0)
const statesAfterBoth = bounded.cachedStateCount
assert.equal(bounded.predict(i => shortPrefix[i - 1]), 1)
assert.equal(bounded.cachedStateCount, statesAfterBoth)
assert.ok(statesAfterBoth < 20)

const distinct = new SubhutiLazyRuleFilter([
    seq(...Array.from({ length: 40 }, (_, index) => t(`A${index}`)), t('B')),
    seq(...Array.from({ length: 40 }, (_, index) => t(`A${index}`)), t('C')),
], {}, 20)
assert.equal(distinct.predict(i => [...Array.from({ length: 40 }, (_, index) => `A${index}`), 'C'][i - 1]), null)
assert.equal(distinct.cachedStateCount, 20)

console.log('LAZY_RULE_FILTER status=OK')
