import { Request, Response } from "express";
import * as ConfigurationService from "../services/configuration.service";
import {
    Configuration,
    IConfiguration,
} from "../entities/configuration.entity";
import { ConfigError } from "../utils/ConfigError";

async function create(req: Request, res: Response) {
    const configData: Omit<IConfiguration, "createdAt" | "updatedAt"> =
        req.body;

    try {
        const configuration = new Configuration();
        Configuration.copyProperties(configData, configuration);

        const createdConfig = await ConfigurationService.create(configuration);
        res.status(201).json(createdConfig.toObject());
    } catch (error) {
        console.error("Failed to create a configuration:", error);

        if (error instanceof ConfigError) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        res.status(500).json({
            error: "Failed to create a configuration, please try again.",
        });
    }
}

async function getById(req: Request, res: Response) {
    const id = req.params.id;

    try {
        const configuration = await ConfigurationService.getById(id);
        res.status(200).json(configuration.toObject());
    } catch (error) {
        console.error("Error getting configuration:", error);

        if (error instanceof ConfigError) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        res.status(500).json({ error: "Failed to get a configuration" });
    }
}

async function update(req: Request, res: Response) {
    const id = req.params.id;
    const configData: IConfiguration = req.body;
    if (!configData) {
        return res.status(400).json({ error: "Body cannot be null" });
    }

    try {
        const version = configData.version;

        const configuration = await ConfigurationService.getById(id);

        if (version && version !== configuration.version) {
            return res.status(412).json({
                error: "The provided version shows that the entity has been updated in the meantime, please re-fetch the resource first",
            });
        }

        Configuration.copyProperties(configData, configuration);
        configuration.updatedAt = new Date();
        configuration.version++;

        const updatedConfig = await ConfigurationService.update(configuration);
        res.status(200).json(updatedConfig.toObject());
    } catch (error) {
        console.error("Failed to update configuration:", error);

        if (error instanceof ConfigError) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        res.status(500).json({
            error: "Failed to update configuration, please try again.",
        });
    }
}

async function remove(req: Request, res: Response) {
    const id = req.params.id;

    try {
        await ConfigurationService.remove(id);
        res.status(204).send();
    } catch (error) {
        console.error("Failed to delete configuration:", error);

        if (error instanceof ConfigError) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        return res
            .status(500)
            .json({ error: "Failed to delete configuration" });
    }
}

async function getAll(req: Request, res: Response) {
    try {
        const configurations = await ConfigurationService.getAll();
        res.status(200).json(configurations.map((config) => config.toObject()));
    } catch (error) {
        console.error("Failed to get all configurations:", error);

        if (error instanceof ConfigError) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        res.status(500).json({ error: "Error getting configurations" });
    }
}

async function getAllForMobile(req: Request, res: Response) {
    try {
        const configurations = await ConfigurationService.getAllForMobile();
        res.status(200).send(Object.fromEntries(configurations));
    } catch (error) {
        console.error("Failed to get all configurations:", error);

        if (error instanceof ConfigError) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        res.status(500).json({ error: "Error getting configurations" });
    }
}

export { create, getById, update, remove, getAll, getAllForMobile };
