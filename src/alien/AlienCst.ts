import AlienMatchToken from "./AlienMatchToken";

export default class AlienCst {
    name: string
    children?: AlienCst[]
    tokens?: AlienMatchToken[]
    tokenTypeIdx?: number
    tokenTypeName?: string
    image?: string | number
    startOffset?: number
    endOffset?: number

    constructor(cst?: AlienCst) {
        if (cst) {
            this.name = cst.name;
            this.children = cst.children;
            this.tokenTypeIdx = cst.tokenTypeIdx;
            this.tokenTypeName = cst.tokenTypeName;
            this.image = cst.image;
            this.startOffset = cst.startOffset;
            this.endOffset = cst.endOffset;
        }
    }
}
