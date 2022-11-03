//This is main file
import puppeteer from "puppeteer";
import fs from "fs";
import {
  clickNext,
  getComtID,
  getReact,
  createCookies,
  checkBanned,
  nextAcc,
  randomNum,
  scrapeReactID,
  scrapeGroup,
  scrapePage,
  scrapePost,
} from "./crawFunc.js";

let accounts = JSON.parse(
  fs.readFileSync("./trackingdata/accounts.json", {
    encoding: "utf8",
    flag: "r",
  })
);

// import { pushDatabase } from "./mongodb.js";
(async () => {
  //Inputs
  let url = "https://mbasic.facebook.com/groups/377562787016149"; // crawl link
  let startAccount = accounts[0]; // take 1 account from accounts.json
  let paginating = 2; //maximum size of groupPost (oftens 7 post / paginating)
  let counter = 0; //to limit total posts of each cluster
  let i = 0; //locations of output data: 0- folder browser1data, 1 - folder browser2data..
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await createCookies(accounts);

  await page.setCookie(...startAccount.cookie);

  await page.goto(url);

  await scrapeGroup(page, startAccount, paginating, i, counter);

})();
