import { MongoClient } from "mongodb";
import fs from "fs";
import data from "./data.json" assert { type: "json" };

const uri =
  "mongodb+srv://haitan:Tan001@cluster0.ke7bgle.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);
export async function pushDatabase() {
  try {
    const dataBaseName = client.db("test");
    const scrapeData = dataBaseName.collection("Fb");

    await scrapeData.insertMany(data, { ordered: false });
  } finally {
    await client.close();
  }
}

// pushDatabase().catch(err => console.error());
