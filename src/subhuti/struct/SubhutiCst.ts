import SubhutiMatchToken from "./SubhutiMatchToken";
export default class SubhutiCst<T = any> {
    name: string;
    children?: SubhutiCst[] = [];
    tokens?: SubhutiMatchToken[] = [];
    value?: string | number;
    extendObject: T;
    constructor(cst?: SubhutiCst) {
        if (cst) {
            this.name = cst.name;
            this.children = cst.children;
            this.value = cst.value;
        }
    }
}
