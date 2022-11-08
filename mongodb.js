import { MongoClient } from "mongodb";
import puppeteer from "puppeteer";
import fs from "fs";
import { scrapePost } from "./crawFunc.js";

let crawledData = JSON.parse(
  fs.readFileSync(`./resultData.json`, {
    encoding: "utf8",
    flag: "r",
  })
);

const url =
  "mongodb+srv://Nereb:nJ8F9BUXwBrGMld9@cluster0.euanrwr.mongodb.net/?retryWrites=true&w=majority";
const dbName = "FirstProjectWithCLI";
const client = new MongoClient(url);

export async function update(data, curCollection) {
  try {
    await client.connect();
    console.log("Connected correctly to server");
    const db = client.db(dbName);

    // Use the collection "FbCrawledGroup"
    const col = db.collection(curCollection);

    // Update or Insert data
    const bulk = col.initializeUnorderedBulkOp();
    data.forEach(element => {
      bulk.find({ PostUrl: element.PostUrl }).upsert().replaceOne(element);
    });


  } catch (err) {
    console.log(err.stack);
  } finally {
    await client.close();
  }
}
// console.log(crawledData[0].PostUrl);
update(crawledData, "FbCrawledGroup").catch(console.dir);
