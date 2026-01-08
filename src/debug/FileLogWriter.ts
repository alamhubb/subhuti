/**
 * FileLogWriter - 文件日志输出
 * 
 * 职责：
 * - 将日志输出到文件
 * - 自动创建目录
 * - 覆盖模式（同一分钟覆盖）
 * 
 * @version 1.0.0
 */

import type { LogWriter } from './LogWriter.ts'
import * as fs from 'fs'
import * as path from 'path'

export class FileLogWriter implements LogWriter {
    private filePath: string
    private writeStream: fs.WriteStream | null = null

    /**
     * 创建文件日志写入器
     * @param filePath 日志文件路径
     */
    constructor(filePath: string) {
        this.filePath = filePath
        this.initializeFile()
    }

    /**
     * 初始化文件和目录
     */
    private initializeFile(): void {
        try {
            // 1. 确保目录存在
            const dir = path.dirname(this.filePath)
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
            }

            // 2. 创建写入流（覆盖模式）
            this.writeStream = fs.createWriteStream(this.filePath, {
                flags: 'w',  // 覆盖模式
                encoding: 'utf8'
            })

            // 3. 处理错误
            this.writeStream.on('error', (err) => {
                console.error(`[FileLogWriter] 写入文件失败: ${err.message}`)
            })
        } catch (err: any) {
            console.error(`[FileLogWriter] 初始化失败: ${err.message}`)
            // 降级到控制台输出
            this.writeStream = null
        }
    }

    /**
     * 写入日志到文件
     * @param message 日志消息
     */
    write(message: string): void {
        if (this.writeStream && !this.writeStream.destroyed) {
            this.writeStream.write(message + '\n')
        } else {
            // 降级到控制台
            console.log(message)
        }
    }

    /**
     * 关闭文件写入流
     */
    close(): void {
        if (this.writeStream && !this.writeStream.destroyed) {
            this.writeStream.end()
            this.writeStream = null
        }
    }
}
