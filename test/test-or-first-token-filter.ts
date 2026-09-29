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

class SingleTokenParser extends SubhutiParser<Consumer> {
    attempts: string[] = []

    constructor(source: string, private readonly failFastOnMismatch = false) {
        super(source, { tokenConsumer: Consumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    Choice() {
        this.OrSingleTokens([
            { tokenName: "A", alt: () => {
                this.attempts.push("A")
                this.tokenConsumer.A()
            } },
            { tokenName: "B", alt: () => {
                this.attempts.push("B")
                this.tokenConsumer.B()
            } },
            { tokenName: "C", alt: () => {
                this.attempts.push("C")
                this.tokenConsumer.C()
            } },
        ], this.failFastOnMismatch)
    }
}

class SingleTokenValueParser extends SubhutiParser<Consumer> {
    attempts: string[] = []

    constructor(source: string) {
        super(source, { tokenConsumer: Consumer, tokenDefinitions: tokens })
    }

    private consumeIdentifierValue(value: string) {
        if (this.LA(1)?.tokenName === "Identifier" && this.LA(1)?.tokenValue === value) {
            this.tokenConsumer.Identifier()
        } else {
            this.setParseFail()
        }
    }

    @SubhutiRule
    Choice() {
        this.OrSingleTokenValues([
            { tokenName: "Identifier", tokenValue: "alpha", alt: () => {
                this.attempts.push("alpha")
                this.consumeIdentifierValue("alpha")
            } },
            { tokenName: "Identifier", tokenValue: "beta", alt: () => {
                this.attempts.push("beta")
                this.consumeIdentifierValue("beta")
            } },
            { tokenName: "C", alt: () => {
                this.attempts.push("C")
                this.tokenConsumer.C()
            } },
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

for (const source of ["a", "b", "c"]) {
    const baseline = new SingleTokenParser(source)
    const filtered = new SingleTokenParser(source).filterOrByFirstToken()
    assert.equal(JSON.stringify(filtered.Choice()), JSON.stringify(baseline.Choice()), source)
    assert.deepEqual(filtered.attempts, [source.toUpperCase()], source)
}
const singleTokenOff = new SingleTokenParser("c").filterOrByFirstToken(false)
singleTokenOff.Choice()
assert.deepEqual(singleTokenOff.attempts, ["A", "B", "C"])
const singleTokenMismatch = new SingleTokenParser("name").filterOrByFirstToken()
assert.throws(() => singleTokenMismatch.Choice())
assert.deepEqual(singleTokenMismatch.attempts, ["A", "B", "C"])
for (const source of ["name", "", "a c"]) {
    const baseline = new SingleTokenParser(source).filterOrByFirstToken()
    const fast = new SingleTokenParser(source, true).filterOrByFirstToken()
    const result = (parser: SingleTokenParser) => {
        try {
            return {cst: JSON.stringify(parser.Choice()), tokens: parser.parsedTokens, eof: parser.isEof, error: null}
        } catch (error) {
            return {cst: null, tokens: parser.parsedTokens, eof: parser.isEof,
                error: (error as Error).constructor.name}
        }
    }
    assert.deepEqual(result(fast), result(baseline), source)
    assert.deepEqual(fast.attempts, ["A"], source)
    assert.deepEqual(baseline.attempts, source === "name" || source === ""
        ? ["A", "B", "C"] : ["A"], source)
}

for (const source of ["alpha", "beta", "c", "other"]) {
    const before = new SingleTokenValueParser(source)
    const after = new SingleTokenValueParser(source).filterOrByFirstToken()
    const result = (parser: SingleTokenValueParser) => {
        try {
            return { cst: JSON.stringify(parser.Choice()), error: null }
        } catch (error) {
            return { cst: null, error: (error as Error).constructor.name }
        }
    }
    assert.deepEqual(result(after), result(before), source)
    assert.deepEqual(after.attempts, source === "alpha" || source === "beta"
        ? [source] : source === "c" ? ["C"] : ["alpha", "beta", "C"], source)
}

for (const source of ["a", "b"]) {
    const before = new FullyHintedParser(source)
    const after = new FullyHintedParser(source).filterOrByFirstToken()
    assert.equal(JSON.stringify(after.Choice()), JSON.stringify(before.Choice()))
}
const rejected = new FullyHintedParser("c").filterOrByFirstToken()
assert.throws(() => rejected.Choice())
assert.equal(rejected.attempts, 2)
console.log("OR_FIRST_TOKEN_FILTER status=OK cases=21")
