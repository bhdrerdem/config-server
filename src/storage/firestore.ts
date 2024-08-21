import * as admin from "firebase-admin";
import { FirebaseConfig } from "../config/default";
import { cert } from "firebase-admin/app";

export class Firestore {
    private static instance: Firestore;
    private config: FirebaseConfig;
    private health: boolean = false;
    private client!: FirebaseFirestore.Firestore;

    constructor(config: FirebaseConfig) {
        this.config = config;
    }

    public static async init(config: FirebaseConfig): Promise<void> {
        if (!Firestore.instance) {
            Firestore.instance = new Firestore(config);
        }

        Firestore.instance.connect();
    }

    public connect() {
        admin.initializeApp({
            credential: cert(this.config),
        });

        Firestore.instance.client = admin.firestore();
        Firestore.instance.health = true;
        console.log("Connected to Firestore");
    }

    public getHealthCheck() {
        return this.health;
    }

    public async ping() {
        try {
            await this.client.collection("configurations").doc("health").get();
        } catch (error) {
            console.error("Error pinging Firestore:", error);
            this.health = false;
            throw error;
        }
    }

    public static getInstance(): Firestore {
        if (!Firestore.instance || !Firestore.instance.getHealthCheck()) {
            throw new Error("Firestore not initialized");
        }

        return Firestore.instance;
    }

    public async getById(collection: string, id: string) {
        return await this.client.collection(collection).doc(id).get();
    }

    public async query(collection: string, query?: FirebaseFirestore.Query) {
        const collectionRef = this.client.collection(collection);

        if (!query) {
            return await collectionRef.get();
        }

        return await query.get();
    }

    public async create(collection: string, data: any) {
        return await this.client.collection(collection).add(data);
    }

    public async update(collection: string, id: string, data: any) {
        return await this.client.collection(collection).doc(id).update(data);
    }

    public async delete(collection: string, id: string) {
        return await this.client.collection(collection).doc(id).delete();
    }

    public async selectAndGet(collection: string, fields: string[]) {
        let query = this.client.collection(collection).select(...fields);
        const result = await query.get();

        return result;
    }
}
