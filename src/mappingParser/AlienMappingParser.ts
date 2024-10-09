import AlienMatchToken from "../alien/AlienMatchToken";
import { Es6TokenName } from "../es6/Es6Tokens";
import AlienCst from "../alien/AlienCst";
import AlienParser from "../alien/AlienParser";
import MappingCst from "./MappingCst";
import RuleObj from "../alien/RuleObj";
import { Es6SyntaxName } from "../es6/Es6Parser";
export class AlienMappingParser extends AlienParser {
    constructor(tokens: AlienMatchToken[]) {
        super(tokens);
        this.initRule();
    }
    generateCst(cst: AlienCst<any>): AlienCst {
        return cst;
    }
    initRule() {
        this.rule(Es6SyntaxName.program, () => {
            this.or([
                {
                    alt: () => {
                        this.consume(Es6TokenName.let);
                    }
                },
                {
                    alt: () => {
                        this.consume(Es6TokenName.const);
                    }
                }
            ]);
            this.subRule(Es6SyntaxName.identifierEqual);
            this.subRule(Es6SyntaxName.assignmentExpression);
        });
        this.rule(Es6SyntaxName.identifierEqual, () => {
            this.consume(Es6TokenName.identifier);
            this.consume(Es6TokenName.equal);
        });
        this.rule(Es6SyntaxName.assignmentExpression, () => {
            this.or([
                {
                    alt: () => {
                        this.consume(Es6TokenName.integer);
                    }
                },
                {
                    alt: () => {
                        this.consume(Es6TokenName.string);
                    }
                }
            ]);
        });
    }
}
const alienMappingParser = new AlienMappingParser();
export default alienMappingParser;
