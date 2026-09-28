import assert from "node:assert/strict"
import SubhutiParser, { SubhutiRule } from "../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../src/SubhutiTokenConsumer.ts"
import { createKeywordToken, createRegToken, createValueRegToken } from "../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createKeywordToken("A", "a"),
    createKeywordToken("B", "b"),
    createKeywordToken("C", "c"),
    createRegToken("Identifier", /[a-z]+/),
    createValueRegToken("Whitespace", /\s+/, " ", true),
]

class Consumer extends SubhutiTokenConsumer {
    A() { return this.consume("A") }
    B() { return this.consume("B") }
    C() { return this.consume("C") }
    Identifier() { return this.consume("Identifier") }
}

class Parser extends SubhutiParser<Consumer> {
    attempts: string[] = []

    constructor(source: string) {
        super(source, { tokenConsumer: Consumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    Choice() {
        this.Or([
            { firstTokens: ["A"], alt: () => {
                this.attempts.push("A-long")
                this.tokenConsumer.A()
                this.tokenConsumer.B()
            } },
            { firstTokens: ["A"], alt: () => {
                this.attempts.push("A-short")
                this.tokenConsumer.A()
            } },
            { alt: () => {
                this.attempts.push("Identifier")
                this.tokenConsumer.Identifier()
            } },
            { firstTokens: ["B"], alt: () => {
                this.attempts.push("B")
                this.tokenConsumer.B()
            } },
            { firstTokens: ["C"], alt: () => {
                this.attempts.push("C")
                this.tokenConsumer.C()
            } },
        ])
    }
}

class FullyHintedParser extends SubhutiParser<Consumer> {
    attempts = 0

    constructor(source: string) {
        super(source, { tokenConsumer: Consumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    Choice() {
        this.Or([
            { firstTokens: ["A"], alt: () => { this.attempts++; this.tokenConsumer.A() } },
            { firstTokens: ["B"], alt: () => { this.attempts++; this.tokenConsumer.B() } },
        ])
    }
}

function parse(source: string, enabled: boolean) {
    const parser = new Parser(source).filterOrByFirstToken(enabled)
    try {
        const cst = parser.Choice()
        return { cst: JSON.stringify(cst), tokens: parser.parsedTokens.map(token => token.tokenName),
            attempts: parser.attempts, error: null }
    } catch (error) {
        return { cst: null, tokens: parser.parsedTokens.map(token => token.tokenName),
            attempts: parser.attempts, error: (error as Error).constructor.name }
    }
}

for (const source of ["a b", "a", "b", "c", "name", "a c", "b c"]) {
    const baseline = parse(source, false)
    const filtered = parse(source, true)
    assert.deepEqual(
        { cst: filtered.cst, tokens: filtered.tokens, error: filtered.error },
        { cst: baseline.cst, tokens: baseline.tokens, error: baseline.error },
        source,
    )
}
assert.deepEqual(parse("a b", true).attempts, ["A-long"])
assert.deepEqual(parse("a", true).attempts, ["A-long", "A-short"])
assert.deepEqual(parse("b", true).attempts, ["Identifier", "B"])
assert.deepEqual(parse("name", true).attempts, parse("name", false).attempts)
for (const source of ["a", "b"]) {
    const before = new FullyHintedParser(source)
    const after = new FullyHintedParser(source).filterOrByFirstToken()
    assert.equal(JSON.stringify(after.Choice()), JSON.stringify(before.Choice()))
}
const rejected = new FullyHintedParser("c").filterOrByFirstToken()
assert.throws(() => rejected.Choice())
assert.equal(rejected.attempts, 2)
console.log("OR_FIRST_TOKEN_FILTER status=OK cases=7")
