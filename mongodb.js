import { MongoClient } from "mongodb";
import  puppeteer  from "puppeteer";
import fs from "fs";
import {scrapePost} from "./crawFunc.js"
import data from "./data.json" assert { type: "json" };

const uri =
  "mongodb+srv://haitan:Tan001@cluster0.ke7bgle.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);
//Recheck if data not crawled all...
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
	let scrapedData = JSON.parse(
	  fs.readFileSync(`./reusultData.json`, {
	    encoding: "utf8",
	    flag: "r",
	  })
	);

	await scrapePost(page, i, scrapedData);

	fs.writeFileSync(
	  `./reusultData.json`,
	  JSON.stringify(scrapedData)
	)()

})

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
