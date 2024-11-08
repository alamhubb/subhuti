// This definition file follows a somewhat unusual format. ESTree allows
// runtime type checks based on the `type` parameter. In order to explain this
// to typescript we want to use discriminated union types:
// https://github.com/Microsoft/TypeScript/pull/9163
//
// For ESTree this is a bit tricky because the high level interfaces like
// Node or Function are pulling double duty. We want to pass common fields down
// to the interfaces that extend them (like Identifier or
// ArrowFunctionExpression), but you can't extend a type union or enforce
// common fields on them. So we've split the high level interfaces into two
// types, a base type which passes down inherited fields, and a type union of
// all types which extend the base type. Only the type union is exported, and
// the union is how other types refer to the collection of inheriting types.
//
// This makes the definitions file here somewhat more difficult to maintain,
// but it has the notable advantage of making ESTree much easier to use as
// an end user.


export interface SubhutiHighlithBaseNodeWithoutComments {
    // Every leaf interface SubhutiHighliththat extends SubhutiHighlithBaseNode must specify a type property.
    // The type property should be a string literal. For example, Identifier
    // has: SubhutiHighlith`type: "Identifier"`
    type: string;
    loc?: SubhutiHighlithSourceLocation | null | undefined;
    range?: [number, number] | undefined;
}

export interface SubhutiHighlithBaseNode extends SubhutiHighlithBaseNodeWithoutComments {
    leadingComments?: SubhutiHighlithComment[] | undefined;
    trailingComments?: SubhutiHighlithComment[] | undefined;
}

export interface SubhutiHighlithNodeMap {
    AssignmentProperty: SubhutiHighlithAssignmentProperty;
    CatchClause: SubhutiHighlithCatchClause;
    Class: SubhutiHighlithClass;
    ClassBody: SubhutiHighlithClassBody;
    Expression: SubhutiHighlithExpression;
    Function: Function;
    Identifier: SubhutiHighlithIdentifier;
    Literal: SubhutiHighlithLiteral;
    MethodDefinition: SubhutiHighlithMethodDefinition;
    ModuleDeclaration: SubhutiHighlithModuleDeclaration;
    ModuleSpecifier: SubhutiHighlithModuleSpecifier;
    Pattern: SubhutiHighlithPattern;
    PrivateIdentifier: SubhutiHighlithPrivateIdentifier;
    Program: SubhutiHighlithProgram;
    Property: SubhutiHighlithProperty;
    PropertyDefinition: SubhutiHighlithPropertyDefinition;
    SpreadElement: SubhutiHighlithSpreadElement;
    Statement: SubhutiHighlithStatement;
    Super: SubhutiHighlithSuper;
    SwitchCase: SubhutiHighlithSwitchCase;
    TemplateElement: SubhutiHighlithTemplateElement;
    VariableDeclarator: SubhutiHighlithVariableDeclarator;
}

export type SubhutiHighlithNode = SubhutiHighlithNodeMap[keyof SubhutiHighlithNodeMap];

export interface SubhutiHighlithComment extends SubhutiHighlithBaseNodeWithoutComments {
    type: "Line" | "Block";
    value: string;
}

export interface SubhutiHighlithSourceLocation {
    source?: string | null | undefined;
    start: SubhutiHighlithPosition;
    end: SubhutiHighlithPosition;
}

export interface SubhutiHighlithPosition {
    /** >= SubhutiHighlith1 */
    line: number;
    /** >= SubhutiHighlith0 */
    column: number;
}

export interface SubhutiHighlithProgram extends SubhutiHighlithBaseNode {
    type: "Program";
    sourceType: "script" | "module";
    body: Array<SubhutiHighlithDirective | SubhutiHighlithStatement | SubhutiHighlithModuleDeclaration>;
    comments?: SubhutiHighlithComment[] | undefined;
}

export interface SubhutiHighlithDirective extends SubhutiHighlithBaseNode {
    type: "ExpressionStatement";
    expression: SubhutiHighlithLiteral;
    directive: string;
}

export interface SubhutiHighlithBaseFunction extends SubhutiHighlithBaseNode {
    params: SubhutiHighlithPattern[];
    generator?: boolean | undefined;
    async?: boolean | undefined;
    // The body is either BlockStatement or Expression because arrow functions
    // can have a body that's either. FunctionDeclarations and
    // FunctionExpressions have only BlockStatement bodies.
    body: SubhutiHighlithBlockStatement | SubhutiHighlithExpression;
}

export type SubhutiHighlithFunction = SubhutiHighlithFunctionDeclaration | SubhutiHighlithFunctionExpression | SubhutiHighlithArrowFunctionExpression;

export type SubhutiHighlithStatement =
    | SubhutiHighlithExpressionStatement
    | SubhutiHighlithBlockStatement
    | SubhutiHighlithStaticBlock
    | SubhutiHighlithEmptyStatement
    | SubhutiHighlithDebuggerStatement
    | SubhutiHighlithWithStatement
    | SubhutiHighlithReturnStatement
    | SubhutiHighlithLabeledStatement
    | SubhutiHighlithBreakStatement
    | SubhutiHighlithContinueStatement
    | SubhutiHighlithIfStatement
    | SubhutiHighlithSwitchStatement
    | SubhutiHighlithThrowStatement
    | SubhutiHighlithTryStatement
    | SubhutiHighlithWhileStatement
    | SubhutiHighlithDoWhileStatement
    | SubhutiHighlithForStatement
    | SubhutiHighlithForInStatement
    | SubhutiHighlithForOfStatement
    | SubhutiHighlithDeclaration;

export interface SubhutiHighlithBaseStatement extends SubhutiHighlithBaseNode {
}

export interface SubhutiHighlithEmptyStatement extends SubhutiHighlithBaseStatement {
    type: "EmptyStatement";
}

export interface SubhutiHighlithBlockStatement extends SubhutiHighlithBaseStatement {
    type: "BlockStatement";
    body: SubhutiHighlithStatement[];
    innerComments?: SubhutiHighlithComment[] | undefined;
}

export interface SubhutiHighlithStaticBlock extends Omit<SubhutiHighlithBlockStatement, "type"> {
    type: "StaticBlock";
}

export interface SubhutiHighlithExpressionStatement extends SubhutiHighlithBaseStatement {
    type: "ExpressionStatement";
    expression: SubhutiHighlithExpression;
}

export interface SubhutiHighlithIfStatement extends SubhutiHighlithBaseStatement {
    type: "IfStatement";
    test: SubhutiHighlithExpression;
    consequent: SubhutiHighlithStatement;
    alternate?: SubhutiHighlithStatement | null | undefined;
}

export interface SubhutiHighlithLabeledStatement extends SubhutiHighlithBaseStatement {
    type: "LabeledStatement";
    label: SubhutiHighlithIdentifier;
    body: SubhutiHighlithStatement;
}

export interface SubhutiHighlithBreakStatement extends SubhutiHighlithBaseStatement {
    type: "BreakStatement";
    label?: SubhutiHighlithIdentifier | null | undefined;
}

export interface SubhutiHighlithContinueStatement extends SubhutiHighlithBaseStatement {
    type: "ContinueStatement";
    label?: SubhutiHighlithIdentifier | null | undefined;
}

export interface SubhutiHighlithWithStatement extends SubhutiHighlithBaseStatement {
    type: "WithStatement";
    object: SubhutiHighlithExpression;
    body: SubhutiHighlithStatement;
}

export interface SubhutiHighlithSwitchStatement extends SubhutiHighlithBaseStatement {
    type: "SwitchStatement";
    discriminant: SubhutiHighlithExpression;
    cases: SubhutiHighlithSwitchCase[];
}

export interface SubhutiHighlithReturnStatement extends SubhutiHighlithBaseStatement {
    type: "ReturnStatement";
    argument?: SubhutiHighlithExpression | null | undefined;
}

export interface SubhutiHighlithThrowStatement extends SubhutiHighlithBaseStatement {
    type: "ThrowStatement";
    argument: SubhutiHighlithExpression;
}

export interface SubhutiHighlithTryStatement extends SubhutiHighlithBaseStatement {
    type: "TryStatement";
    block: SubhutiHighlithBlockStatement;
    handler?: SubhutiHighlithCatchClause | null | undefined;
    finalizer?: SubhutiHighlithBlockStatement | null | undefined;
}

export interface SubhutiHighlithWhileStatement extends SubhutiHighlithBaseStatement {
    type: "WhileStatement";
    test: SubhutiHighlithExpression;
    body: SubhutiHighlithStatement;
}

export interface SubhutiHighlithDoWhileStatement extends SubhutiHighlithBaseStatement {
    type: "DoWhileStatement";
    body: SubhutiHighlithStatement;
    test: SubhutiHighlithExpression;
}

export interface SubhutiHighlithForStatement extends SubhutiHighlithBaseStatement {
    type: "ForStatement";
    init?: SubhutiHighlithVariableDeclaration | SubhutiHighlithExpression | null | undefined;
    test?: SubhutiHighlithExpression | null | undefined;
    update?: SubhutiHighlithExpression | null | undefined;
    body: SubhutiHighlithStatement;
}

export interface SubhutiHighlithBaseForXStatement extends SubhutiHighlithBaseStatement {
    left: SubhutiHighlithVariableDeclaration | SubhutiHighlithPattern;
    right: SubhutiHighlithExpression;
    body: SubhutiHighlithStatement;
}

export interface SubhutiHighlithForInStatement extends SubhutiHighlithBaseForXStatement {
    type: "ForInStatement";
}

export interface SubhutiHighlithDebuggerStatement extends SubhutiHighlithBaseStatement {
    type: "DebuggerStatement";
}

export type SubhutiHighlithDeclaration = SubhutiHighlithFunctionDeclaration | SubhutiHighlithVariableDeclaration | SubhutiHighlithClassDeclaration;

export interface SubhutiHighlithBaseDeclaration extends SubhutiHighlithBaseStatement {
}

export interface SubhutiHighlithMaybeNamedFunctionDeclaration extends SubhutiHighlithBaseFunction, SubhutiHighlithBaseDeclaration {
    type: "FunctionDeclaration";
    /** It is null when a function declaration is a part of the `export default function` statement */
    id: SubhutiHighlithIdentifier | null;
    body: SubhutiHighlithBlockStatement;
}

export interface SubhutiHighlithFunctionDeclaration extends SubhutiHighlithMaybeNamedFunctionDeclaration {
    id: SubhutiHighlithIdentifier;
}

export interface SubhutiHighlithVariableDeclaration extends SubhutiHighlithBaseDeclaration {
    type: "VariableDeclaration";
    declarations: SubhutiHighlithVariableDeclarator[];
    kind: SubhutiHighlithSubhutiTokenAst;
}

export interface SubhutiHighlithVariableDeclarator extends SubhutiHighlithBaseNode {
    type: "VariableDeclarator";
    id: SubhutiHighlithPattern;
    init?: SubhutiHighlithExpression | null | undefined;
}

export interface SubhutiHighlithExpressionMap {
    ArrayExpression: SubhutiHighlithArrayExpression;
    ArrowFunctionExpression: SubhutiHighlithArrowFunctionExpression;
    AssignmentExpression: SubhutiHighlithAssignmentExpression;
    AwaitExpression: SubhutiHighlithAwaitExpression;
    BinaryExpression: SubhutiHighlithBinaryExpression;
    CallExpression: SubhutiHighlithCallExpression;
    ChainExpression: SubhutiHighlithChainExpression;
    ClassExpression: SubhutiHighlithClassExpression;
    ConditionalExpression: SubhutiHighlithConditionalExpression;
    FunctionExpression: SubhutiHighlithFunctionExpression;
    Identifier: SubhutiHighlithIdentifier;
    ImportExpression: SubhutiHighlithImportExpression;
    Literal: SubhutiHighlithLiteral;
    LogicalExpression: SubhutiHighlithLogicalExpression;
    MemberExpression: SubhutiHighlithMemberExpression;
    MetaProperty: SubhutiHighlithMetaProperty;
    NewExpression: SubhutiHighlithNewExpression;
    ObjectExpression: SubhutiHighlithObjectExpression;
    SequenceExpression: SubhutiHighlithSequenceExpression;
    TaggedTemplateExpression: SubhutiHighlithTaggedTemplateExpression;
    TemplateLiteral: SubhutiHighlithTemplateLiteral;
    ThisExpression: SubhutiHighlithThisExpression;
    UnaryExpression: SubhutiHighlithUnaryExpression;
    UpdateExpression: SubhutiHighlithUpdateExpression;
    YieldExpression: SubhutiHighlithYieldExpression;
}

export type SubhutiHighlithExpression = SubhutiHighlithExpressionMap[keyof SubhutiHighlithExpressionMap];

export interface SubhutiHighlithBaseExpression extends SubhutiHighlithBaseNode {
}

export type SubhutiHighlithChainElement = SubhutiHighlithSimpleCallExpression | SubhutiHighlithMemberExpression;

export interface SubhutiHighlithChainExpression extends SubhutiHighlithBaseExpression {
    type: "ChainExpression";
    expression: SubhutiHighlithChainElement;
}

export interface SubhutiHighlithThisExpression extends SubhutiHighlithBaseExpression {
    type: "ThisExpression";
}

export interface SubhutiHighlithArrayExpression extends SubhutiHighlithBaseExpression {
    type: "ArrayExpression";
    elements: Array<SubhutiHighlithExpression | SubhutiHighlithSpreadElement | null>;
}

export interface SubhutiHighlithObjectExpression extends SubhutiHighlithBaseExpression {
    type: "ObjectExpression";
    properties: Array<SubhutiHighlithProperty | SubhutiHighlithSpreadElement>;
}

export interface SubhutiHighlithPrivateIdentifier extends SubhutiHighlithBaseNode {
    type: "PrivateIdentifier";
    name: string;
}

export interface SubhutiHighlithProperty extends SubhutiHighlithBaseNode {
    type: "Property";
    key: SubhutiHighlithExpression | SubhutiHighlithPrivateIdentifier;
    value: SubhutiHighlithExpression | SubhutiHighlithPattern; // Could be an AssignmentProperty
    kind: "init" | "get" | "set";
    method: boolean;
    shorthand: boolean;
    computed: boolean;
}

export interface SubhutiHighlithPropertyDefinition extends SubhutiHighlithBaseNode {
    type: "PropertyDefinition";
    key: SubhutiHighlithExpression | SubhutiHighlithPrivateIdentifier;
    value?: SubhutiHighlithExpression | null | undefined;
    computed: boolean;
    static: boolean;
}

export interface SubhutiHighlithFunctionExpression extends SubhutiHighlithBaseFunction, SubhutiHighlithBaseExpression {
    id?: SubhutiHighlithIdentifier | null | undefined;
    type: "FunctionExpression";
    body: SubhutiHighlithBlockStatement;
}

export interface SubhutiHighlithSequenceExpression extends SubhutiHighlithBaseExpression {
    type: "SequenceExpression";
    expressions: SubhutiHighlithExpression[];
}

export interface SubhutiHighlithUnaryExpression extends SubhutiHighlithBaseExpression {
    type: "UnaryExpression";
    operator: SubhutiHighlithUnaryOperator;
    prefix: true;
    argument: SubhutiHighlithExpression;
}

export interface SubhutiHighlithBinaryExpression extends SubhutiHighlithBaseExpression {
    type: "BinaryExpression";
    operator: SubhutiHighlithBinaryOperator;
    left: SubhutiHighlithExpression | SubhutiHighlithPrivateIdentifier;
    right: SubhutiHighlithExpression;
}

export interface SubhutiHighlithAssignmentExpression extends SubhutiHighlithBaseExpression {
    type: "AssignmentExpression";
    operator: SubhutiHighlithAssignmentOperator;
    left: SubhutiHighlithPattern | SubhutiHighlithMemberExpression;
    right: SubhutiHighlithExpression;
}

export interface SubhutiHighlithUpdateExpression extends SubhutiHighlithBaseExpression {
    type: "UpdateExpression";
    operator: SubhutiHighlithUpdateOperator;
    argument: SubhutiHighlithExpression;
    prefix: boolean;
}

export interface SubhutiHighlithLogicalExpression extends SubhutiHighlithBaseExpression {
    type: "LogicalExpression";
    operator: SubhutiHighlithLogicalOperator;
    left: SubhutiHighlithExpression;
    right: SubhutiHighlithExpression;
}

export interface SubhutiHighlithConditionalExpression extends SubhutiHighlithBaseExpression {
    type: "ConditionalExpression";
    test: SubhutiHighlithExpression;
    alternate: SubhutiHighlithExpression;
    consequent: SubhutiHighlithExpression;
}

export interface SubhutiHighlithBaseCallExpression extends SubhutiHighlithBaseExpression {
    callee: SubhutiHighlithExpression | SubhutiHighlithSuper;
    arguments: Array<SubhutiHighlithExpression | SubhutiHighlithSpreadElement>;
}

export type SubhutiHighlithCallExpression = SubhutiHighlithSimpleCallExpression | SubhutiHighlithNewExpression;

export interface SubhutiHighlithSimpleCallExpression extends SubhutiHighlithBaseCallExpression {
    type: "CallExpression";
    optional: boolean;
}

export interface SubhutiHighlithNewExpression extends SubhutiHighlithBaseCallExpression {
    type: "NewExpression";
}

export interface SubhutiHighlithMemberExpression extends SubhutiHighlithBaseExpression, SubhutiHighlithBasePattern {
    type: "MemberExpression";
    object: SubhutiHighlithExpression | SubhutiHighlithSuper;
    property: SubhutiHighlithExpression | SubhutiHighlithPrivateIdentifier;
    computed: boolean;
    optional: boolean;
}

export type SubhutiHighlithPattern = SubhutiHighlithIdentifier | SubhutiHighlithObjectPattern | SubhutiHighlithArrayPattern | SubhutiHighlithRestElement | SubhutiHighlithAssignmentPattern | SubhutiHighlithMemberExpression;

export interface SubhutiHighlithBasePattern extends SubhutiHighlithBaseNode {
}

export interface SubhutiHighlithSwitchCase extends SubhutiHighlithBaseNode {
    type: "SwitchCase";
    test?: SubhutiHighlithExpression | null | undefined;
    consequent: SubhutiHighlithStatement[];
}

export interface SubhutiHighlithCatchClause extends SubhutiHighlithBaseNode {
    type: "CatchClause";
    param: SubhutiHighlithPattern | null;
    body: SubhutiHighlithBlockStatement;
}

export interface SubhutiHighlithIdentifier extends SubhutiHighlithBaseNode, SubhutiHighlithBaseExpression, SubhutiHighlithBasePattern {
    type: "Identifier";
    name: string;
}

export type SubhutiHighlithLiteral = SubhutiHighlithSimpleLiteral | RegExpLiteral | bigintLiteral;

export interface SubhutiHighlithSimpleLiteral extends SubhutiHighlithBaseNode, SubhutiHighlithBaseExpression {
    type: "Literal";
    value: string | boolean | number | null;
    raw?: string | undefined;
}

export interface RegExpLiteral extends SubhutiHighlithBaseNode, SubhutiHighlithBaseExpression {
    type: "Literal";
    value?: RegExp | null | undefined;
    regex: {
        pattern: string;
        flags: string;
    };
    raw?: string | undefined;
}

export interface bigintLiteral extends SubhutiHighlithBaseNode, SubhutiHighlithBaseExpression {
    type: "Literal";
    value?: bigint | null | undefined;
    bigint: string;
    raw?: string | undefined;
}

export type SubhutiHighlithUnaryOperator = "-" | "+" | "!" | "~" | "typeof" | "void" | "delete";

export type SubhutiHighlithBinaryOperator =
    | "=="
    | "!="
    | "==="
    | "!=="
    | "<"
    | "<="
    | ">"
    | ">="
    | "<<"
    | ">>"
    | ">>>"
    | "+"
    | "-"
    | "*"
    | "/"
    | "%"
    | "**"
    | "|"
    | "^"
    | "&"
    | "in"
    | "instanceof";

export type SubhutiHighlithLogicalOperator = "||" | "&&" | "??";

export type SubhutiHighlithAssignmentOperator =
    | "="
    | "+="
    | "-="
    | "*="
    | "/="
    | "%="
    | "**="
    | "<<="
    | ">>="
    | ">>>="
    | "|="
    | "^="
    | "&="
    | "||="
    | "&&="
    | "??=";

export type SubhutiHighlithUpdateOperator = "++" | "--";

export interface SubhutiHighlithForOfStatement extends SubhutiHighlithBaseForXStatement {
    type: "ForOfStatement";
    await: boolean;
}

export interface SubhutiHighlithSuper extends SubhutiHighlithBaseNode {
    type: "Super";
}

export interface SubhutiHighlithSpreadElement extends SubhutiHighlithBaseNode {
    type: "SpreadElement";
    argument: SubhutiHighlithExpression;
}

export interface SubhutiHighlithArrowFunctionExpression extends SubhutiHighlithBaseExpression, SubhutiHighlithBaseFunction {
    type: "ArrowFunctionExpression";
    expression: boolean;
    body: SubhutiHighlithBlockStatement | SubhutiHighlithExpression;
}

export interface SubhutiHighlithYieldExpression extends SubhutiHighlithBaseExpression {
    type: "YieldExpression";
    argument?: SubhutiHighlithExpression | null | undefined;
    delegate: boolean;
}

export interface SubhutiHighlithTemplateLiteral extends SubhutiHighlithBaseExpression {
    type: "TemplateLiteral";
    quasis: SubhutiHighlithTemplateElement[];
    expressions: SubhutiHighlithExpression[];
}

export interface SubhutiHighlithTaggedTemplateExpression extends SubhutiHighlithBaseExpression {
    type: "TaggedTemplateExpression";
    tag: SubhutiHighlithExpression;
    quasi: SubhutiHighlithTemplateLiteral;
}

export interface SubhutiHighlithTemplateElement extends SubhutiHighlithBaseNode {
    type: "TemplateElement";
    tail: boolean;
    value: {
        /** It is null when the template literal is tagged and the text has an invalid escape (e.g. - tag`\unicode and \u{55}`) */
        cooked?: string | null | undefined;
        raw: string;
    };
}

export interface SubhutiHighlithAssignmentProperty extends SubhutiHighlithProperty {
    value: SubhutiHighlithPattern;
    kind: "init";
    method: boolean; // false
}

export interface SubhutiHighlithObjectPattern extends SubhutiHighlithBasePattern {
    type: "ObjectPattern";
    properties: Array<SubhutiHighlithAssignmentProperty | SubhutiHighlithRestElement>;
}

export interface SubhutiHighlithArrayPattern extends SubhutiHighlithBasePattern {
    type: "ArrayPattern";
    elements: Array<SubhutiHighlithPattern | null>;
}

export interface SubhutiHighlithRestElement extends SubhutiHighlithBasePattern {
    type: "RestElement";
    argument: SubhutiHighlithPattern;
}

export interface SubhutiHighlithAssignmentPattern extends SubhutiHighlithBasePattern {
    type: "AssignmentPattern";
    left: SubhutiHighlithPattern;
    right: SubhutiHighlithExpression;
}

export type SubhutiHighlithClass = SubhutiHighlithClassDeclaration | SubhutiHighlithClassExpression;

export interface SubhutiHighlithBaseClass extends SubhutiHighlithBaseNode {
    superClass?: SubhutiHighlithExpression | null | undefined;
    body: SubhutiHighlithClassBody;
}

export interface SubhutiHighlithClassBody extends SubhutiHighlithBaseNode {
    type: "ClassBody";
    body: Array<SubhutiHighlithMethodDefinition | SubhutiHighlithPropertyDefinition | SubhutiHighlithStaticBlock>;
}

export interface SubhutiHighlithMethodDefinition extends SubhutiHighlithBaseNode {
    type: "MethodDefinition";
    key: SubhutiHighlithExpression | SubhutiHighlithPrivateIdentifier;
    value: SubhutiHighlithFunctionExpression;
    kind: "constructor" | "method" | "get" | "set";
    computed: boolean;
    static: SubhutiHighlithSubhutiTokenAst;
}

export interface SubhutiHighlithMaybeNamedClassDeclaration extends SubhutiHighlithBaseClass, SubhutiHighlithBaseDeclaration {
    type: "ClassDeclaration";
    /** It is null when a class declaration is a part of the `export default class` statement */
    id: SubhutiHighlithIdentifier | null;
}

export interface SubhutiHighlithClassDeclaration extends SubhutiHighlithMaybeNamedClassDeclaration {
    id: SubhutiHighlithIdentifier;
    class: SubhutiHighlithSubhutiTokenAst
}

export interface SubhutiHighlithClassExpression extends SubhutiHighlithBaseClass, SubhutiHighlithBaseExpression {
    type: "ClassExpression";
    id?: SubhutiHighlithIdentifier | null | undefined;
}

export interface SubhutiHighlithMetaProperty extends SubhutiHighlithBaseExpression {
    type: "MetaProperty";
    meta: SubhutiHighlithIdentifier;
    property: SubhutiHighlithIdentifier;
}

export type SubhutiHighlithModuleDeclaration =
    | SubhutiHighlithImportDeclaration
    | SubhutiHighlithExportNamedDeclaration
    | SubhutiHighlithExportDeclaration
    | SubhutiHighlithExportAllDeclaration;

export interface SubhutiHighlithBaseModuleDeclaration extends SubhutiHighlithBaseNode {
}

export type SubhutiHighlithModuleSpecifier = SubhutiHighlithImportSpecifier | SubhutiHighlithImportDefaultSpecifier | SubhutiHighlithImportNamespaceSpecifier | SubhutiHighlithExportSpecifier;

export interface SubhutiHighlithBaseModuleSpecifier extends SubhutiHighlithBaseNode {
    local: SubhutiHighlithIdentifier;
}

export interface SubhutiHighlithImportDeclaration extends SubhutiHighlithBaseModuleDeclaration {
    type: "ImportDeclaration";
    specifiers: Array<SubhutiHighlithImportSpecifier | SubhutiHighlithImportDefaultSpecifier | SubhutiHighlithImportNamespaceSpecifier>;
    source: SubhutiHighlithLiteral;
}

export interface SubhutiHighlithImportSpecifier extends SubhutiHighlithBaseModuleSpecifier {
    type: "ImportSpecifier";
    imported: SubhutiHighlithIdentifier | SubhutiHighlithLiteral;
}

export interface SubhutiHighlithImportExpression extends SubhutiHighlithBaseExpression {
    type: "ImportExpression";
    source: SubhutiHighlithExpression;
}

export interface SubhutiHighlithImportDefaultSpecifier extends SubhutiHighlithBaseModuleSpecifier {
    type: "ImportDefaultSpecifier";
}

export interface SubhutiHighlithImportNamespaceSpecifier extends SubhutiHighlithBaseModuleSpecifier {
    type: "ImportNamespaceSpecifier";
}

export interface SubhutiHighlithExportNamedDeclaration extends SubhutiHighlithBaseModuleDeclaration {
    type: "ExportNamedDeclaration";
    declaration?: SubhutiHighlithDeclaration | null | undefined;
    specifiers: SubhutiHighlithExportSpecifier[];
    source?: SubhutiHighlithLiteral | null | undefined;
}

export interface SubhutiHighlithExportSpecifier extends Omit<SubhutiHighlithBaseModuleSpecifier, "local"> {
    type: "ExportSpecifier";
    local: SubhutiHighlithIdentifier | SubhutiHighlithLiteral;
    exported: SubhutiHighlithIdentifier | SubhutiHighlithLiteral;
}

export interface SubhutiHighlithSubhutiTokenAst extends SubhutiHighlithBaseNodeWithoutComments {

}

export interface SubhutiHighlithExportDeclaration extends SubhutiHighlithBaseModuleDeclaration {
    type: "ExportDeclaration";
    export: SubhutiHighlithSubhutiTokenAst
    default: SubhutiHighlithSubhutiTokenAst
    declaration: SubhutiHighlithMaybeNamedFunctionDeclaration | SubhutiHighlithMaybeNamedClassDeclaration | SubhutiHighlithExpression;
}

export interface SubhutiHighlithExportAllDeclaration extends SubhutiHighlithBaseModuleDeclaration {
    type: "ExportAllDeclaration";
    exported: SubhutiHighlithIdentifier | SubhutiHighlithLiteral | null;
    source: SubhutiHighlithLiteral;
}

export interface SubhutiHighlithAwaitExpression extends SubhutiHighlithBaseExpression {
    type: "AwaitExpression";
    argument: SubhutiHighlithExpression;
}
