import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createKeywordToken, createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createKeywordToken('Function', 'function'),
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createValueRegToken('LParen', /\(/, '('),
    createValueRegToken('RParen', /\)/, ')'),
    createValueRegToken('LBrace', /\{/, '{'),
    createValueRegToken('RBrace', /\}/, '}'),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

class CustomTokenConsumer extends SubhutiTokenConsumer {
    Function() { return this.consume('Function') }
    Identifier() { return this.consume('Identifier') }
    LParen() { return this.consume('LParen') }
    RParen() { return this.consume('RParen') }
    LBrace() { return this.consume('LBrace') }
    RBrace() { return this.consume('RBrace') }
}

@Subhuti
class TestParser extends SubhutiParser<CustomTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: CustomTokenConsumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    FunctionDeclaration() {
        this.getTokenConsumer().Function()
        this.getTokenConsumer().Identifier()
        this.getTokenConsumer().LParen()
        this.getTokenConsumer().RParen()
        this.getTokenConsumer().LBrace()
        this.getTokenConsumer().RBrace()
        return this.getCurCst()
    }
}

const parser = new TestParser('function viaGetter() { }')
if (!(parser.getTokenConsumer() instanceof CustomTokenConsumer)) {
    throw new Error('getTokenConsumer did not return the configured token consumer')
}
if (parser.curToken?.getTokenValue() !== 'function') {
    throw new Error('curToken did not expose the SubhutiMatchToken getter API')
}

const cst = parser.FunctionDeclaration()
if (!cst?.children?.some(child => child.name === 'Identifier')) {
    throw new Error('getTokenConsumer did not parse through the configured consumer')
}

console.log('test-021-token-consumer-getter passed')
