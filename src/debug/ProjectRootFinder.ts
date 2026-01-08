/**
 * ProjectRootFinder - 项目根目录查找工具
 * 
 * 职责：
 * - 查找项目根目录（通过 package.json）
 * - 生成默认日志路径
 * 
 * @version 1.0.0
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

export class ProjectRootFinder {
    /**
     * 查找项目根目录
     * 从当前工作目录向上查找 package.json
     * 
     * @returns 项目根目录路径
     */
    static findProjectRoot(): string {
        // 使用 process.cwd() 作为起点（兼容ES模块和CommonJS）
        let currentDir = process.cwd()

        // 向上查找，最多 10 层
        for (let i = 0; i < 10; i++) {
            const packageJsonPath = path.join(currentDir, 'package.json')

            if (fs.existsSync(packageJsonPath)) {
                return currentDir
            }

            const parentDir = path.dirname(currentDir)
            if (parentDir === currentDir) {
                // 已到达根目录
                break
            }
            currentDir = parentDir
        }

        // 未找到，使用当前工作目录
        return process.cwd()
    }

    /**
     * 生成默认日志文件路径
     * 格式: {projectRoot}/.subhuti/logs/YYYY-MM-DD-HH-mm.log
     * 
     * @returns 默认日志文件路径
     */
    static getDefaultLogPath(): string {
        const projectRoot = this.findProjectRoot()
        const timestamp = this.getTimestamp()
        return path.join(projectRoot, '.subhuti', 'logs', `${timestamp}.log`)
    }

    /**
     * 获取时间戳字符串
     * 格式: YYYY-MM-DD-HH-mm
     * 
     * @returns 时间戳字符串
     */
    private static getTimestamp(): string {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hour = String(now.getHours()).padStart(2, '0')
        const minute = String(now.getMinutes()).padStart(2, '0')

        return `${year}-${month}-${day}-${hour}-${minute}`
    }
}
