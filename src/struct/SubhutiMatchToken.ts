export default class SubhutiMatchToken {
    tokenName: string;
    //只能为字符串，为parser解析时输入的字符串
    tokenValue: string;
    line?: number;
    // endRowNum?: number;
    column?: number;
    // columnEndNum?: number;
    codeIndex?: number
    // length?: number
    hasLineBreakBefore?: boolean;  // 此 token 前是否有换行（Babel 风格）

    constructor(osvToken: SubhutiMatchToken) {
        this.tokenName = osvToken.tokenName;
        this.tokenValue = osvToken.tokenValue;
        this.line = osvToken.line;
        // this.endRowNum = osvToken.endRowNum;
        this.column = osvToken.column;
        // this.columnEndNum = osvToken.columnEndNum;
        // this.length = osvToken.length;
        this.codeIndex = osvToken.codeIndex;
        this.hasLineBreakBefore = osvToken.hasLineBreakBefore;
    }
}

export function createMatchToken(osvToken: SubhutiMatchToken) {
    return new SubhutiMatchToken(osvToken);
}
