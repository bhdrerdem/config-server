export class ConfigError extends Error {
    constructor(message: string, public statusCode = 500) {
        super(message);
        this.name = "ConfigError";
        this.statusCode = statusCode;
    }
}
