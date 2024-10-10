import AlienMatchToken from "./token/AlienMatchToken";
export default class AlienCst {
    name: string;
    children?: AlienCst[] = [];
    tokens?: AlienMatchToken[] = [];
    value?: string | number;
    constructor(cst?: AlienCst) {
        if (cst) {
            this.name = cst.name;
            this.children = cst.children;
            this.value = cst.value;
        }
    }
}
