import assert from 'node:assert/strict'
import {
    SubhutiLazyRuleFilter, pathToken as t, pathRule as r,
    pathTokenValue, pathSequence as seq, pathChoice as choice,
    pathRepeat as many, pathOptional as opt, pathUnknown,
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
const empty = new SubhutiLazyRuleFilter([], {})
assert.equal(empty.predict(() => { throw new Error('Empty state must not read a token') }), null)
assert.equal(empty.canStart('Identifier'), false)

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

const transitionBounded = new SubhutiLazyRuleFilter([
    seq(t('A'), t('B')), seq(t('A'), t('C')),
], {}, 20, 5)
assert.equal(transitionBounded.predict(i => ['A', 'C'][i - 1]), 1)
const warmStats = transitionBounded.cacheStats
for (let index = 0; index < 100; index++) {
    assert.equal(transitionBounded.predict(i => ['A', 'C'][i - 1]), 1)
}
assert.equal(transitionBounded.cacheStats.misses, warmStats.misses)
assert.equal(transitionBounded.cacheStats.hits, warmStats.hits + 200)
for (let index = 0; index < 100; index++) {
    assert.equal(transitionBounded.predict(() => `Unknown${index}`), null)
}
assert.equal(transitionBounded.cacheStats.transitions, 5)
assert.ok(transitionBounded.cacheStats.budgetFallbacks > 0)
// Saturation must not invalidate a previously cached path.
assert.equal(transitionBounded.predict(i => ['A', 'C'][i - 1]), 1)
for (const budget of [0, -1, 1.5, NaN, Infinity]) {
    assert.throws(() => new SubhutiLazyRuleFilter([], {}, budget), RangeError)
    assert.throws(() => new SubhutiLazyRuleFilter([], {}, 10, budget), RangeError)
}

const contextual = new SubhutiLazyRuleFilter([
    pathTokenValue('IdentifierName', 'keyof'),
    pathTokenValue('IdentifierName', 'readonly'),
    t('IdentifierName'),
], {})
assert.equal(contextual.predict(() => ({name: 'IdentifierName', value: 'keyof'})), 0)
assert.equal(contextual.predict(() => ({name: 'IdentifierName', value: 'readonly'})), 1)
assert.equal(contextual.predict(() => ({name: 'IdentifierName', value: 'UserType'})), 2)
// A name-only reader cannot distinguish contextual values, so it may only
// prioritize the first same-name branch; the parser still keeps PEG fallback.
assert.equal(contextual.predict(() => 'IdentifierName'), 0)

const valueStates = new SubhutiLazyRuleFilter([
    choice(
        seq(pathTokenValue('T', 'x'), pathTokenValue('T', 'p'), t('A')),
        seq(pathTokenValue('T', 'y'), pathTokenValue('T', 'q'), t('A')),
    ),
    seq(t('T'), t('T'), t('B')),
], {})
const values = (first: string, second: string, last: string) =>
    valueStates.predict(offset => [
        { name: 'T', value: first },
        { name: 'T', value: second },
        { name: last },
    ][offset - 1])
assert.equal(values('x', 'p', 'A'), 0)
assert.equal(values('x', 'q', 'B'), 1)
assert.equal(values('y', 'q', 'A'), 0)
assert.equal(values('y', 'p', 'B'), 1)

const identifierValues = new SubhutiLazyRuleFilter([
    seq(t('IdentifierName'), t('B')), seq(t('IdentifierName'), t('C')),
], {}, 20, 10)
for (let index = 0; index < 10000; index++) {
    assert.deepEqual(identifierValues.predictCandidates(offset => [
        {name: 'IdentifierName', value: `variable${index}`}, {name: 'C'},
    ][offset - 1]), [1])
}
assert.equal(identifierValues.cacheStats.transitions, 2)
assert.equal(identifierValues.cacheStats.budgetFallbacks, 0)

const contextualCandidates = new SubhutiLazyRuleFilter([
    pathTokenValue('IdentifierName', 'keyof'), t('IdentifierName'),
], {})
assert.deepEqual(contextualCandidates.predictCandidates(() => ({name: 'IdentifierName', value: 'Other'})), [1])
assert.deepEqual(contextualCandidates.predictCandidates(() => 'IdentifierName'), [0, 1])
assert.deepEqual(contextualCandidates.predictCandidates(() => ({name: 'IdentifierName', value: 'keyof'})), [0, 1])
for (let index = 0; index < 1000; index++) {
    assert.deepEqual(contextualCandidates.predictCandidates(() => ({
        name: 'IdentifierName', value: `Other${index}`,
    })), [1])
}
assert.equal(contextualCandidates.cacheStats.transitions, 3)

const opaque = new SubhutiLazyRuleFilter([
    seq(t('A'), pathUnknown(), t('B')), seq(t('A'), t('C')), t('D'),
], {})
assert.deepEqual(opaque.predictCandidates(i => ['A', 'C'][i - 1]), [0, 1])
assert.deepEqual(opaque.predictCandidates(i => ['A', 'Z'][i - 1]), [0, 1])
assert.deepEqual(opaque.predictCandidates(() => 'D'), [2])
assert.equal(opaque.canStart('Z'), false)
assert.equal(new SubhutiLazyRuleFilter([pathUnknown(), t('D')], {}).canStart('Z'), null)
assert.deepEqual(ordered.predictCandidates(i => ['A', 'B'][i - 1]), [0, 1])
const laterAccepted = new SubhutiLazyRuleFilter([
    seq(t('A'), t('B')), t('A'),
], {})
assert.deepEqual(laterAccepted.predictCandidates(i => ['A', 'C'][i - 1]), [1])
assert.deepEqual(laterAccepted.predictCandidates(i => ['A', 'B'][i - 1]), [0, 1])

console.log('LAZY_RULE_FILTER status=OK')
