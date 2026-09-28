import { performance } from "node:perf_hooks"
import SubhutiParser, { SubhutiRule } from "../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../src/SubhutiTokenConsumer.ts"
import { createKeywordToken, createRegToken, createValueRegToken } from "../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createKeywordToken("Import", "import"),
    createKeywordToken("Export", "export"),
    createKeywordToken("Var", "var"),
    createRegToken("Identifier", /[a-zA-Z_][a-zA-Z0-9_]*/),
    createValueRegToken("Whitespace", /\s+/, " ", true),
]

class Consumer extends SubhutiTokenConsumer {
    Import() { return this.consume("Import") }
    Export() { return this.consume("Export") }
    Var() { return this.consume("Var") }
    Identifier() { return this.consume("Identifier") }
}

class Parser extends SubhutiParser<Consumer> {
    importAttempts = 0
    exportAttempts = 0

    constructor(source: string) {
        super(source, { tokenConsumer: Consumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    Program() {
        this.Many(() => this.Item())
    }

    @SubhutiRule
    Item() {
        this.Or([
            { firstTokens: ["Import"], alt: () => {
                this.importAttempts++
                this.tokenConsumer.Import()
                this.tokenConsumer.Identifier()
            } },
            { firstTokens: ["Export"], alt: () => {
                this.exportAttempts++
                this.tokenConsumer.Export()
                this.tokenConsumer.Identifier()
            } },
            { firstTokens: ["Var"], alt: () => {
                this.tokenConsumer.Var()
                this.tokenConsumer.Identifier()
            } },
        ])
    }
}

const source = Array.from({ length: 400 }, (_, i) => `var item${i}`).join("\n")
const filtering = process.argv.includes("--filter")
const rounds = 15
for (let i = 0; i < 3; i++) new Parser(source).filterOrByFirstToken(filtering).Program()
const times: number[] = []
let attempts = ""
for (let i = 0; i < rounds; i++) {
    const started = performance.now()
    const parser = new Parser(source)
    parser.filterOrByFirstToken(filtering)
    parser.Program()
    if (parser.parsedTokens.length !== 800) throw new Error("Incomplete parse")
    times.push(performance.now() - started)
    attempts = `${parser.importAttempts}/${parser.exportAttempts}`
}
times.sort((a, b) => a - b)
console.log(`OR_BENCHMARK filtering=${filtering} medianMs=${times[Math.floor(rounds / 2)].toFixed(2)} attempts=${attempts}`)
