const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const levelName = (process.env.LOG_LEVEL || "info").toLowerCase();
const currentLevel = LEVELS[levelName] ?? LEVELS.info;

function timestamp() {
  return new Date().toISOString();
}

function formatArgs(args) {
  return args
    .map((arg) => {
      if (arg instanceof Error) {
        return arg.stack || arg.message;
      }

      if (typeof arg === "object" && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }

      return String(arg);
    })
    .join(" ");
}

function write(level, args) {
  if ((LEVELS[level] ?? LEVELS.info) > currentLevel) {
    return;
  }

  const line = `[${timestamp()}] [${level.toUpperCase()}] ${formatArgs(args)}`;

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

const logger = {
  error: (...args) => write("error", args),
  warn: (...args) => write("warn", args),
  info: (...args) => write("info", args),
  debug: (...args) => write("debug", args),
};

module.exports = logger;
