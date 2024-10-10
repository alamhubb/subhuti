import AlienMatchToken from "./AlienMatchToken";
export default class AlienCst<T = any> {
    name: string;
    children?: AlienCst[] = [];
    tokens?: AlienMatchToken[] = [];
    value?: string | number;
    extendObject: T;
    constructor(cst?: AlienCst) {
        if (cst) {
            this.name = cst.name;
            this.children = cst.children;
            this.value = cst.value;
        }
    }
}
