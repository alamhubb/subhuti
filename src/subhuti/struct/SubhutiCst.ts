import SubhutiMatchToken from "./SubhutiMatchToken";

export default class SubhutiCst {
    name: string;
    children?: SubhutiCst[]
    tokens?: SubhutiMatchToken[]
    value?: string;

    constructor(cst?: SubhutiCst) {
        if (cst) {
            this.name = cst.name;
            this.children = cst.children;
            this.value = cst.value;
        }
    }

    pushCstToken(popToken: SubhutiMatchToken) {
        // this.tokens.push(popToken);
    }
}
