import SubhutiMatchToken from "./SubhutiMatchToken.ts";

export default class SubhutiCst {
    // pathName: string;
    name: string;
    children?: SubhutiCst[]
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
