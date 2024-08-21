import { firestore } from "firebase-admin";
import {
    Configuration,
    IConfiguration,
} from "../entities/configuration.entity";
import { Firestore } from "../storage/firestore";
import { Redis } from "../storage/redis";
import { ConfigError } from "../utils/ConfigError";

const CACHE_CONFIG_NAME = "configuration";
const CACHE_TTL = 60 * 60;

export async function create(
    configuration: Configuration
): Promise<Configuration> {
    const db = Firestore.getInstance();

    const configRef = await db.create("configurations", {
        parameterKey: configuration.parameterKey,
        value: configuration.value,
        description: configuration.description,
        createdAt: configuration.createdAt,
        updatedAt: configuration.updatedAt,
    });

    configuration.id = configRef.id;

    return configuration;
}

export async function getById(id: string): Promise<Configuration> {
    const cache = Redis.getInstance();
    const db = Firestore.getInstance();

    try {
        const cachedConfig = await cache.get(`${CACHE_CONFIG_NAME}:${id}`);
        if (cachedConfig) {
            return new Configuration(JSON.parse(cachedConfig));
        }
    } catch (error) {
        console.error("Failed to get config from cache", error);
    }

    const configDoc = await db.getById("configurations", id);
    if (!configDoc.exists) {
        throw new ConfigError(`Configuration ${id} not found.`, 404);
    }

    const configuration = Configuration.fromFirestore(
        configDoc.data(),
        configDoc.id
    );

    try {
        await cache.set(
            `${CACHE_CONFIG_NAME}:${id}`,
            JSON.stringify(configuration.toObject()),
            CACHE_TTL
        );
    } catch (error) {
        console.error("Failed to cache config", error);
    }

    return configuration;
}

export async function update(
    configuration: Configuration
): Promise<Configuration> {
    const cache = Redis.getInstance();
    const db = Firestore.getInstance();

    await db.update("configurations", configuration.id, {
        parameterKey: configuration.parameterKey,
        value: configuration.value,
        description: configuration.description,
        updatedAt: configuration.updatedAt,
        version: configuration.version,
    });

    try {
        await cache.set(
            `${CACHE_CONFIG_NAME}:${configuration.id}`,
            JSON.stringify(configuration.toObject()),
            CACHE_TTL
        );
        console.log("Updated cache");
    } catch (error) {
        console.error("Failed to update cache", error);
    }

    return configuration;
}

export async function remove(id: string): Promise<void> {
    const db = Firestore.getInstance();
    const cache = Redis.getInstance();

    await db.delete("configurations", id);

    try {
        await cache.del(`${CACHE_CONFIG_NAME}:${id}`);
    } catch (error) {
        console.error("Failed to delete config from cache", error);
    }
}

export async function getAll(): Promise<Configuration[]> {
    const db = Firestore.getInstance();

    const configDocs = await db.query("configurations");

    const configurations: Configuration[] = [];

    try {
        configDocs.forEach((doc) => {
            const configuration = Configuration.fromFirestore(
                doc.data(),
                doc.id
            );

            configurations.push(configuration);
        });
    } catch (error) {
        // Never should happen in prod
        console.error("Failed to convert configurations", error);
        throw new ConfigError("Failed to get configurations", 500);
    }

    return configurations;
}

export async function getAllForMobile(): Promise<Map<string, string>> {
    const db = Firestore.getInstance();

    const configDocs = await db.selectAndGet("configurations", [
        "parameterKey",
        "value",
    ]);

    const mobileConfigs = new Map<string, string>();

    configDocs.forEach((doc) => {
        const data = doc.data();
        mobileConfigs.set(data.parameterKey, data.value);
    });

    return mobileConfigs;
}
