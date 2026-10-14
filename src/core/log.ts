/**
 * Logging for the Smarter SDK.
 *
 * As a library should, the SDK logs nothing unless asked to. Pass a `logger` (any object with
 * `debug`, `info`, `warn` and `error` methods: `console`, pino, winston, ...) to the client, and set
 * `SMARTER_LOG=info` to log each request's method, url, status and duration, or `SMARTER_LOG=debug` to
 * log their bodies too. The `logLevel` option overrides `SMARTER_LOG`. Without a `logger`, a level
 * logs to `console`.
 *
 * Api keys are never logged: see {@link maskSecret}.
 */

/** A logger: `console`, or any object with the same four methods. */
export interface SmarterLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/** How much the SDK logs. `debug` includes request and response bodies. */
export type SmarterLogLevel = "debug" | "info" | "warn" | "error" | "off";

const LEVELS: Record<SmarterLogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40, off: 100 };

/**
 * A secret, masked for logging: its last four characters.
 *
 * @param secret - The secret, e.g. an api key.
 * @returns e.g. `****5150`, or `None` when there is no secret.
 */
export function maskSecret(secret: string | null | undefined): string {
  if (!secret) return "None";
  return secret.length > 8 ? `****${secret.slice(-4)}` : "****";
}

/** The SDK's logger: a level, and the caller's logger. Messages are prefixed with `smarter:<source>`. */
export class Logger {
  /** The level, below which nothing is logged. */
  readonly level: SmarterLogLevel;
  readonly #target: SmarterLogger;

  /**
   * @param level - The level.
   * @param target - Where to log.
   */
  constructor(level: SmarterLogLevel, target: SmarterLogger) {
    this.level = level;
    this.#target = target;
  }

  /**
   * Whether messages of a level are logged.
   *
   * @param level - The level.
   * @returns True if they are.
   */
  enabled(level: Exclude<SmarterLogLevel, "off">): boolean {
    return LEVELS[level] >= LEVELS[this.level];
  }

  /**
   * Log a message.
   *
   * @param level - The message's level.
   * @param source - The SDK module, e.g. `http`.
   * @param message - The message.
   */
  log(level: Exclude<SmarterLogLevel, "off">, source: string, message: string): void {
    if (this.enabled(level)) this.#target[level](`smarter:${source} ${message}`);
  }
}

/**
 * The SDK's logger for a client's options.
 *
 * @param level - The `logLevel` option, or `SMARTER_LOG`, or undefined.
 * @param target - The `logger` option, or undefined.
 * @returns The logger: off when no level is given.
 */
export function makeLogger(level: SmarterLogLevel | undefined, target: SmarterLogger | undefined): Logger {
  return new Logger(level ?? "off", target ?? console);
}
