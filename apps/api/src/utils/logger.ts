import { env } from "../config/env";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: any;
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    
    if (env.NODE_ENV === "production") {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...context,
      });
    } else {
      const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : "";
      const colorMap = {
        info: "\x1b[36mINFO\x1b[0m",
        warn: "\x1b[33mWARN\x1b[0m",
        error: "\x1b[31mERROR\x1b[0m",
        debug: "\x1b[35mDEBUG\x1b[0m",
      };
      return `[${timestamp}] [${colorMap[level]}] ${message}${contextStr}`;
    }
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatLog("info", message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatLog("warn", message, context));
  }

  error(message: string, error?: any, context?: LogContext) {
    const errorContext = error
      ? {
          errorMsg: error.message || error,
          stack: error.stack,
          ...context,
        }
      : context;
    console.error(this.formatLog("error", message, errorContext));
  }

  debug(message: string, context?: LogContext) {
    if (env.NODE_ENV === "development") {
      console.log(this.formatLog("debug", message, context));
    }
  }
}

export const logger = new Logger();
export default logger;
