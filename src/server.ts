import express, { Express, Request, Response } from "express";
import { Config } from "./config/default";
import { Redis } from "./storage/redis";
import { Firestore } from "./storage/firestore";
import {
    create,
    getAll,
    getAllForMobile,
    getById,
    remove,
    update,
} from "./controllers/configuration.controller";
import { get } from "http";

export class Server {
    private config: Config;
    private health: boolean = true;

    constructor(config: any) {
        this.config = config;
    }

    public async run() {
        await Redis.init(this.config.redis);
        await Firestore.init(this.config.firebase);

        const redis = Redis.getInstance();
        const firestore = Firestore.getInstance();

        setInterval(async () => {
            try {
                if (!redis.getHealthCheck()) {
                    console.log(
                        "Redis is not healthy, attempting to reconnect..."
                    );
                    this.health = false;
                    await redis.connect();
                }
                await redis.ping();
            } catch (error) {
                this.health = false;
                console.error(
                    "Error during Redis health check or reconnect:",
                    error
                );
            }
        }, 10000);

        setInterval(async () => {
            try {
                if (!firestore.getHealthCheck()) {
                    this.health = false;
                    console.log(
                        "Firestore is not healthy, attempting to reconnect..."
                    );
                    firestore.connect();
                }
                await firestore.ping();
            } catch (error) {
                this.health = false;
                console.error(
                    "Error during Firestore health check or reconnect:",
                    error
                );
            }
        }, 10000);

        const app = express();
        const port = this.config.port;

        app.use(express.json());

        app.get("/health", (req: Request, res: Response) => {
            if (this.health) {
                return res.status(200).json({ status: "UP" });
            } else {
                return res.status(500).json({ status: "DOWN" });
            }
        });

        app.post("/configurations", create);
        app.get("/configurations/:id", getById);
        app.put("/configurations/:id", update);
        app.delete("/configurations/:id", remove);
        app.get("/configurations", getAll);
        app.get("/configurations-mobile", getAllForMobile);

        app.listen(port, () => {
            console.log(`Server is running at port ${port}`);
        });
    }
}
