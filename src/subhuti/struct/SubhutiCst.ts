import SubhutiMatchToken from "./token/SubhutiMatchToken";
export default class SubhutiCst {
    name: string;
    children?: SubhutiCst[] = [];
    tokens?: SubhutiMatchToken[] = [];
    value?: string | number;
    constructor(cst?: SubhutiCst) {
        if (cst) {
            this.name = cst.name;
            this.children = cst.children;
            this.value = cst.value;
        }
    }
}
