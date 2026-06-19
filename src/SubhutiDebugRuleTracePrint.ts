let _showRulePath = true

export function setShowRulePath(show: boolean): void {
    _showRulePath = show
}

export function getShowRulePath(): boolean {
    return _showRulePath
}

export class TreeFormatHelper {
    static formatLine(
        content: string,
        options: {
            depth?: number
            prefix?: string
        }
    ): string {
        const indent = options.prefix ?? '  '.repeat(options.depth ?? 0)
        return indent + content
    }

    static contentJoin(parts: string[]): string[] {
        return parts.filter(p => p !== null && p !== undefined && p !== '')
    }

    static formatTokenValue(value: string, maxLength: number = 40): string {
        let escaped = value
            .replace(/\\/g, '\\\\')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')

        if (escaped.length > maxLength) {
            escaped = escaped.slice(0, maxLength) + '...'
        }

        return escaped
    }

    static formatLocation(loc: any): string {
        if (!loc?.start || !loc?.end) {
            return ''
        }

        const startLine = loc.start.line
        const startCol = loc.start.column
        const endLine = loc.end.line
        const endCol = loc.end.column

        if (startLine === endLine) {
            return `[${startLine}:${startCol}-${endCol}]`
        }
        return `[${startLine}:${startCol}-${endLine}:${endCol}]`
    }

    static formatRuleChain(rules: string[], separator: string = ' > '): string {
        return rules.join(separator)
    }
}

export interface RuleStackItem {
    ruleName?: string
    tokenValue?: string
    tokenSuccess?: boolean
    tokenExpectName?: string
    tokenName?: string
    startTime: number
    outputted: boolean
    tokenIndex: number
    isManuallyAdded?: boolean
    shouldBreakLine?: boolean
    displayDepth?: number
    childs?: string[]
    orBranchInfo?: {
        orIndex?: number
        branchIndex?: number
        isOrEntry: boolean
        isOrBranch: boolean
        totalBranches?: number
        startTokenIndex?: number
        branchAttempts?: any[]
    }
}

export interface OrBranchInfo {
    totalBranches: number
    currentBranch: number
    targetDepth: number
    savedPendingLength: number
    parentRuleName: string
}

export class SubhutiDebugRuleTracePrint {
    static formatOrSuffix(item: RuleStackItem): string {
        const info = item.orBranchInfo
        if (!info) {
            return ''
        }

        if (info.isOrEntry) {
            return ' [Or]'
        }

        if (info.isOrBranch) {
            return ` [Or #${(info.branchIndex ?? 0) + 1}/${info.totalBranches ?? '?'}]`
        }

        return ' [Or ?]'
    }

    static isOrEntry(item: RuleStackItem): boolean {
        return item.orBranchInfo?.isOrEntry ?? false
    }

    public static getPrintToken(tokenItem: RuleStackItem, location?: string): string {
        const value = TreeFormatHelper.formatTokenValue(tokenItem.tokenValue || '', 20)
        const tokenIndex = `token[${tokenItem.tokenIndex}]`
        const tokenName = `<${tokenItem.tokenName ?? ''}>`

        if (tokenItem.tokenSuccess) {
            return ['OK', 'Consume', tokenIndex, value, '-', tokenName, location || '[]'].join(' ')
        }

        return [
            'MISS',
            tokenIndex,
            'Expect:',
            tokenItem.tokenExpectName ?? '',
            '-',
            'Get:',
            value,
            '-',
            tokenName
        ].join(' ')
    }

    public static formatLine(str: string, depth: number, symbol: string = '+-'): string {
        return TreeFormatHelper.formatLine(str, {
            prefix: '  '.repeat(depth) + symbol
        })
    }

    public static consoleLog(...strs: any[]): void {
        if (!_showRulePath) {
            return
        }
        console.log(...strs)
    }

    public static formatPendingOutputs_NonCache_Impl(ruleStack: RuleStackItem[]): string[] {
        if (!ruleStack.length) {
            throw new Error('Invalid ruleStack input')
        }

        let unOutputIndex = ruleStack.findIndex(item => !item.outputted)
        if (unOutputIndex < 0) {
            unOutputIndex = ruleStack.length
        }

        const pendingRules = ruleStack.slice(unOutputIndex)
        if (!pendingRules.length) {
            return []
        }

        const lastOutputted = ruleStack[unOutputIndex - 1]
        let baseDepth = lastOutputted?.displayDepth ?? 0
        const lines: string[] = []

        for (const group of this.groupPendingRules(pendingRules)) {
            if (group[0].shouldBreakLine) {
                const result = this.formatMultipleSingleRule(group, baseDepth)
                lines.push(...result.lines)
                baseDepth = result.depth
            } else {
                baseDepth++
                lines.push(...this.formatChainRule(group, baseDepth))
            }
        }

        return lines
    }

    public static flushPendingOutputs_NonCache_Impl(ruleStack: RuleStackItem[]): number {
        const lines = this.formatPendingOutputs_NonCache_Impl(ruleStack)
        lines.forEach(line => this.consoleLog(line))

        const lastRule = ruleStack[ruleStack.length - 1]
        return lastRule?.displayDepth || 0
    }

    public static flushPendingOutputs_Cache_Impl(ruleStack: RuleStackItem[]): void {
        const pendingRules = ruleStack.filter(item => !item.outputted)
        if (pendingRules.length === 0) {
            throw new Error('Invalid cache ruleStack input')
        }

        for (const group of this.groupPendingRules(pendingRules)) {
            if (group[0].shouldBreakLine) {
                this.printMultipleSingleRule(group)
            } else {
                this.printChainRule(group)
            }
        }
    }

    static formatChainRule(rules: RuleStackItem[], depth: number = rules[0].displayDepth ?? 0): string[] {
        if (!rules.length) {
            throw new Error('rules must not be empty')
        }

        const names = rules.map(r => SubhutiDebugRuleTracePrint.getRuleItemLogContent(r))
        const displayNames = names.length > 4
            ? [...names.slice(0, 2), '...', ...names.slice(-2)]
            : names
        const line = SubhutiDebugRuleTracePrint.formatLine(displayNames.join(' > '), depth, '+-')

        rules.forEach(r => {
            r.displayDepth = depth
            r.outputted = true
        })

        return [line]
    }

    static printChainRule(rules: RuleStackItem[], depth: number = rules[0].displayDepth ?? 0): void {
        const lines = this.formatChainRule(rules, depth)
        lines.forEach(line => this.consoleLog(line))
    }

    static formatMultipleSingleRule(
        rules: RuleStackItem[],
        depth: number = rules[0].displayDepth ?? 0
    ): { lines: string[], depth: number } {
        const lines: string[] = []

        rules.forEach((item, index) => {
            depth++
            if (!item.isManuallyAdded) {
                item.displayDepth = depth
            }

            const isLast = index === rules.length - 1
            const branch = isLast ? '+-' : '|-'
            const printStr = this.getRuleItemLogContent(item)
            const line = SubhutiDebugRuleTracePrint.formatLine(printStr, item.displayDepth ?? 0, branch)

            lines.push(line)
            item.outputted = true
        })

        return { lines, depth }
    }

    static printMultipleSingleRule(rules: RuleStackItem[], depth: number = rules[0].displayDepth ?? 0): number {
        const result = this.formatMultipleSingleRule(rules, depth)
        result.lines.forEach(line => this.consoleLog(line))
        return result.depth
    }

    private static groupPendingRules(rules: RuleStackItem[]): RuleStackItem[][] {
        const groups: RuleStackItem[][] = []
        let currentGroup: RuleStackItem[] | null = null

        for (const item of rules) {
            if (!currentGroup || currentGroup[0].shouldBreakLine !== item.shouldBreakLine) {
                currentGroup = [item]
                groups.push(currentGroup)
            } else {
                currentGroup.push(item)
            }
        }

        return groups
    }

    private static getRuleItemLogContent(tokenItem: RuleStackItem): string {
        let res = ''

        if (tokenItem.orBranchInfo) {
            const branchInfo = tokenItem.orBranchInfo
            if (branchInfo.isOrEntry) {
                res = `${tokenItem.ruleName ?? 'Or'}(Or)`
            } else if (branchInfo.isOrBranch) {
                res = `[Branch #${(branchInfo.branchIndex ?? 0) + 1}](${tokenItem.ruleName ?? ''})`
            } else {
                res = `${tokenItem.ruleName ?? 'Or'}(?)`
            }
        } else if (tokenItem.tokenExpectName) {
            res = SubhutiDebugRuleTracePrint.getPrintToken(tokenItem)
        } else {
            res = tokenItem.ruleName ?? ''
        }

        if (tokenItem.isManuallyAdded) {
            res += ' [cached]'
        }

        return res
    }
}
