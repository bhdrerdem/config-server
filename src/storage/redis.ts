import { createClient, RedisClientType } from "redis";
import { RedisConfig } from "../config/default";

export class Redis {
    private static instance: Redis;
    private config: RedisConfig;
    private health: boolean = false;
    private client!: RedisClientType;

    constructor(config: RedisConfig) {
        this.config = config;
    }

    public static async init(config: RedisConfig): Promise<void> {
        if (!Redis.instance) {
            Redis.instance = new Redis(config);
        }

        Redis.instance.client = createClient({
            url: Redis.instance.config.url,
        });
        await Redis.instance.connect();
    }

    public getHealthCheck() {
        return this.health;
    }

    public async connect() {
        return new Promise<void>((resolve, reject) => {
            this.client.connect();

            this.client.on("connect", () => {
                console.log("Connected to Redis");
                this.health = true;
                resolve();
            });

            this.client.on("error", (err) => {
                console.error(`Error connecting to Redis: ${err}`);
                this.health = false;
                reject(err);
            });
        });
    }

    public async ping() {
        try {
            await this.client.ping();
        } catch (error) {
            console.error("Error pinging Redis:", error);
            this.health = false;
            throw error;
        }
    }

    public static getInstance(url?: string): Redis {
        if (!Redis.instance || !Redis.instance.getHealthCheck()) {
            throw new Error("Redis not initialized");
        }

        return Redis.instance;
    }

    public async get(key: string) {
        return await this.client.get(key);
    }

    public async set(key: string, value: any, expire?: number) {
        return await this.client.set(key, value, {
            EX: expire || 0,
        });
    }

    public async incr(key: string) {
        return await this.client.incr(key);
    }

    public async expire(key: string, seconds: number) {
        return await this.client.expire(key, seconds);
    }

    public async hincrby(key: string, field: string, increment: number) {
        return await this.client.hIncrBy(key, field, increment);
    }

    public async hget(key: string, field: string) {
        return await this.client.hGet(key, field);
    }

    public async hset(key: string, field: string, value: any) {
        return await this.client.hSet(key, field, value);
    }

    public async del(key: string) {
        return await this.client.del(key);
    }

    public async hmget(key: string, ...fields: string[]) {
        return await this.client.hmGet(key, fields);
    }

    public async hmset(key: string, ...args: string[]) {
        return await this.client.hSet(key, args);
    }
}
