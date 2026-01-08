/**
 * ConsoleLogWriter - 控制台日志输出
 * 
 * 职责：
 * - 将日志输出到控制台
 * - 默认的日志输出方式
 * 
 * @version 1.0.0
 */

import type { LogWriter } from './LogWriter.ts'

export class ConsoleLogWriter implements LogWriter {
    /**
     * 写入日志到控制台
     * @param message 日志消息
     */
    write(message: string): void {
        console.log(message)
    }

    /**
     * 关闭（控制台无需关闭）
     */
    close(): void {
        // No-op for console
    }
}
