/**
 * LogWriter 接口 - 统一日志输出抽象
 * 
 * 职责：
 * - 定义日志写入接口
 * - 支持控制台和文件两种实现
 * 
 * @version 1.0.0
 */

export interface LogWriter {
    /**
     * 写入日志消息
     * @param message 日志消息
     */
    write(message: string): void

    /**
     * 关闭日志写入器（可选）
     * 用于释放资源（如文件句柄）
     */
    close?(): void
}
