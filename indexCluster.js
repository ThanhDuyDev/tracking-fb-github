import fs from "fs";
import {
  maxWorkers,
  createCookies,
  clickNext,
  getComtID,
  getReact,
  randomNum,
  scrapeReactID,
  scrapeGroup,
  scrapePage,
  scrapePost,
} from "./crawFunc.js";
import { Cluster } from "puppeteer-cluster";

let fbGroups = JSON.parse(
  fs.readFileSync("./trackingdata/group.json", {
    encoding: "utf8",
    flag: "r",
  })
);

let accounts = JSON.parse(
  fs.readFileSync("./trackingdata/accounts.json", {
    encoding: "utf8",
    flag: "r",
  })
);

let i = 0;

async function open() {
  await createCookies(accounts);

  //open user
  const cluster = await Cluster.launch({
    headless: true,
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: maxWorkers,
    timeout: 12000000, //prevent idle
  });

  await cluster.task(async ({ page, data: { accounts, fbGroup, i } }) => {
    try {
      i = Number(i); //locations of output data: 0- folder browser1data, 1 - folder browser2data..
      let counter = 0; //to limit total posts of each cluster, maxCounter = paginating
      let paginating = 100; //maximum size of groupPost (oftens 7 post / paginating)

      await page.goto(fbGroup.url);
      console.log(`Browser${i + 1} crawling ${fbGroup.url}`);

      // await scrapeGroup(page, accounts[i], paginating, i, counter);
      await scrapeGroup(page, paginating, i, counter);
    } catch (error) {
      console.log("TaskErr", error);
    }
  });

  for (let index in fbGroups) {
    i === maxWorkers - 1 ? 0 : i; // fs.write data of each group to specific browser${i}
    cluster.queue({ accounts: accounts, fbGroup: fbGroups[index], i });
    i++;
  }

  await cluster.idle();
  await cluster.close();
}

open();
