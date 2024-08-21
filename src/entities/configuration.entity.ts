import { firestore } from "firebase-admin";
import { ConfigError } from "../utils/ConfigError";

export interface IConfiguration {
    id: string;
    parameterKey: string;
    value: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
    version?: number;
}

export class Configuration {
    public id: string;
    public parameterKey: string;
    public value: string;
    public description: string;
    public createdAt: Date;
    public updatedAt: Date;
    public version: number;

    constructor(config?: IConfiguration) {
        this.id = config?.id || "";
        this.parameterKey = config?.parameterKey || "";
        this.value = config?.value || "";
        this.description = config?.description || "";
        this.createdAt = Configuration.convertToDate(config?.createdAt);
        this.updatedAt = Configuration.convertToDate(config?.updatedAt);
        this.version = config?.version || 1;
    }

    public static fromFirestore(data: any, id: string): Configuration {
        return new Configuration({
            id: id,
            parameterKey: data.parameterKey,
            value: data.value,
            description: data.description,
            createdAt: Configuration.convertToDate(data.createdAt),
            updatedAt: Configuration.convertToDate(data.updatedAt),
            version: data.version || 1,
        });
    }

    public static copyProperties(
        source: IConfiguration,
        dest: Configuration
    ): Configuration {
        if (!source.parameterKey?.trim()) {
            throw new ConfigError("Field 'parameterKey' cannot be empty.");
        }
        dest.parameterKey = source.parameterKey.trim().replace(/\s+/g, "_");

        if (!source.value?.trim()) {
            throw new ConfigError("Field 'value' cannot be empty.");
        }
        dest.value = source.value.trim();

        if (source.description) {
            dest.description = source.description;
        }

        if (source.createdAt) {
            dest.createdAt =
                source.createdAt instanceof firestore.Timestamp
                    ? source.createdAt.toDate()
                    : source.createdAt;
        }

        if (source.updatedAt) {
            dest.updatedAt =
                source.updatedAt instanceof firestore.Timestamp
                    ? source.updatedAt.toDate()
                    : source.updatedAt;
        }

        if (source.version) {
            dest.version = source.version;
        }

        return dest;
    }

    private static convertToDate(
        value?: Date | firestore.Timestamp | string
    ): Date {
        if (value instanceof firestore.Timestamp) {
            return value.toDate();
        } else if (typeof value === "string") {
            return new Date(value);
        }
        return value || new Date();
    }

    public validate(): void {
        if (!this.parameterKey.trim()) {
            throw new ConfigError("Field 'parameterKey' cannot be empty.");
        }

        if (!this.value.trim()) {
            throw new ConfigError("Field 'value' cannot be empty.");
        }
    }

    public toObject(): IConfiguration {
        return {
            id: this.id,
            parameterKey: this.parameterKey,
            value: this.value,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            version: this.version,
        };
    }
}
