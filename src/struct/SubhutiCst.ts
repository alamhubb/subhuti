import SubhutiMatchToken from "./SubhutiMatchToken.ts";
import type {Position, SourceLocation} from "estree";

export default class SubhutiCst {
    // pathName: string;
    name: string;
    children?: SubhutiCst[]
    loc:SourceLocation
    tokens?: SubhutiMatchToken[]
    value?: string;

    constructor(cst?: SubhutiCst) {
        if (cst) {
            this.name = cst.name;
            // this.pathName = cst.pathName;
            this.children = cst.children;
            this.value = cst.value;
        }
    }

    pushCstToken?(popToken: SubhutiMatchToken) {
        this.tokens.push(popToken);
    }
}
