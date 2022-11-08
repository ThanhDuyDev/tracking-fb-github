import { fail } from "assert";
import fs from "fs";
import puppeteer from "puppeteer";
export const maxWorkers = 2;

let accounts = JSON.parse(
  fs.readFileSync("./trackingdata/accounts.json", {
    encoding: "utf8",
    flag: "r",
  })
);

let accIndex = maxWorkers - 1;

let curAccBrowser = Array.from(Array(maxWorkers)).map((_, i) => i + 1);

let test = false; // short loop, no delay, if react of post > 20 : ban acc and switch to another until nothing left
let testBanned = false; //test switch acc if banned
let getErr = true; // console.log error from catch

const UserIdRegEx = /...*[?](?:id=\w*|)/;

export function randomNum(minNum, maxNum) {
  // delay paging, selecting
  minNum = Math.ceil(minNum);
  maxNum = Math.floor(maxNum);
  const result = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
  if (test) {
    return 500;
  } else {
    return result;
  }
}

export async function createCookies(accounts) {
  let isUpdate = 0;
  for (let item of accounts) {
    if (!item.cookie.length) {
      const browser = await puppeteer.launch({
        headless: false,
      });
      const page = await browser.newPage();
      console.log(`Getting ${item.user} cookies from accounts.json`);
      await page.goto("https://mbasic.facebook.com/");
      await page.type("#m_login_email", item.user);
      await page.type("input[name=pass]", item.pass);
      const submitBtn = "input[type=submit]";
      await page.waitForSelector(submitBtn);
      await page.click(submitBtn);
      let currentCookie = await page.cookies();
      item.cookie = currentCookie;
      item.status = "Waiting";
      isUpdate = 1;
      browser.close();
    }
  }
  if (isUpdate) {
    fs.writeFileSync("./trackingdata/accounts.json", JSON.stringify(accounts));
  }
}

export function nextAcc() {
  try {
    accIndex++; //global variable - prevent multi cluster accessing same acc
    if (accounts[accIndex].status === "Waiting") {
      console.log(`logging to ${accounts[accIndex].user}`);
      return accounts[accIndex];
    } else {
      if (accounts.some((item) => item.status === "Waiting")) {
        accIndex = accounts.length ? maxWorkers : accIndex;
        nextAcc();
      } else {
        throw error;
      }
    }
  } catch (error) {
    getErr ? console.log("nextAcc", error) : "";
    console.log("nextAcc", "no account left");
    throw error; // === return error - make parent function catch the error
  }
}

export async function checkBanned(page, i) {
  try {
    console.log(`${curAccBrowser[i].user} checking if banned...`);
    let checkStatus = await page.$eval(
      "#objects_container div",
      (value) => value.title
    );
    if (checkStatus === "You’re Temporarily Blocked" || testBanned) {
      await page.deleteCookie(...curAccBrowser[i].cookie);
      curAccBrowser[i].status = "banned";
      curAccBrowser[i].cookie = "";
      accounts[curAccBrowser[i].ID] = curAccBrowser[i];
      console.log(`${curAccBrowser[i].user} has been banned`);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    getErr ? console.log("checkBanned", error) : "";
    throw error;
  }
}

export async function clickNext(
  page,
  querrySelector,
  loopFunction,
  paginating
) {
  let nextButtonDisplay = false;
  try {
    //Check if querryable
    let nextButton = await page.$eval(querrySelector, (i) => {
      return i.href;
    });
    nextButtonDisplay = true;
  } catch (error) {
    nextButtonDisplay = false;
  }
}

export const getComtID = async (totalCommenters, page, i) => {
  console.log(
    `${curAccBrowser[i].user} get UserCmts in post... Total:${totalCommenters.length}`
  );
  try {
    const queryCmts =
      "div[id^=ufi_] > div > div:nth-child(5) > div > div > h3 > a";
    let comments = await page.$$eval(queryCmts, (i) =>
      i.map((item) => {
        let shortLink = item.href.match(/...*[?](?:id=\w*|)/)[0];
        return { Fbname: item.innerText, Url: shortLink };
      })
    );

    //On Banned: comments = []
    if (!comments.length || testBanned) throw "Can't querry selector";

    totalCommenters = [...totalCommenters, ...comments];

    let moreCmt = false;
    try {
      const moreCmtBtn = await page.$eval('div[id^="see_next"] a', (i) => {
        return i.textContent;
      });
      moreCmt = true;
    } catch (error) {
      moreCmt = false;
    }

    if (moreCmt) {
      await page.waitForSelector('div[id^="see_next"] > a');
      await page.click('div[id^="see_next"] > a');
      await page.waitForTimeout(randomNum(500, 1500));
      totalCommenters = await getComtID(totalCommenters, page, i);
    }
  } catch (error) {
    getErr ? console.error("getComtID", error) : "";

    if (await checkBanned(page, i)) {
      curAccBrowser[i] = nextAcc();
      await page.setCookie(...curAccBrowser[i].cookie);
      await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
      totalCommenters = await getComtID(totalCommenters, page, i);
    }
  }
  return totalCommenters;
};

export const scrapeReactID = async (curReactData, page, i) => {
  try {
    let curReactPage = await page.$$eval("ul header > h3 > a", (i) =>
      i.map((item) => {
        let shortLink = item.href.match(/...*[?](?:id=\w*|)/)[0];
        return { Name: item.textContent, Url: shortLink };
      })
    );

    //On Banned: curReactPage = []
    if ((!curReactPage.length && (await checkBanned(page, i))) || testBanned) {
      curAccBrowser[i] = nextAcc();
      await page.setCookie(...curAccBrowser[i].cookie);
      await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
    }

    curReactData = [...curReactData, ...curReactPage];

    console.log(
      `${curAccBrowser[i].user} Current total reactUser ${curReactData.length}`
    );

    if (test && curReactData.length > 200) {
      testBanned = true;
      throw "testBann";
    }

    let xemthemStatus = false;
    try {
      const xemthem = await page.$eval(
        "ul li:last-child div a",
        (i) => i.textContent
      );
      xemthemStatus = true;
    } catch (error) {
      // console.log("xemthem", error);
      xemthemStatus = false;
    }

    if (xemthemStatus) {
      await page.waitForSelector("ul li:last-child a");
      await page.click("ul li:last-child a");
      await page.waitForTimeout(randomNum(1000, 1500));
      curReactData = await scrapeReactID(curReactData, page, i);
    }
  } catch (error) {
    getErr ? console.log("scrapeReactID", error) : "";
    if (await checkBanned(page, i)) {
      curAccBrowser[i] = nextAcc();
      await page.setCookie(...curAccBrowser[i].cookie);
      await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
      curReactData = await scrapeReactID(curReactData, page, i);
    }
    throw error; //=== return error, make parent function execute catch
  }
  return curReactData;
};

export const getReact = async (page, i) => {
  console.log(`${curAccBrowser[i].user} Getting reactUserID... `);
  let data = [];
  try {
    let queryReact =
      "#m_story_permalink_view > div:nth-child(2) > div > div:nth-child(3) > a";
    await page.waitForSelector(queryReact);
    await page.click(queryReact);
    await page.waitForTimeout(randomNum(1500, 2000));
    let reactTypes = await page.$$eval(
      "#root > table > tbody > tr > td > div > div > a",
      (arr) => {
        const subArr = [];
        //For loop
        for (let i = 0; i < arr.length; i++) {
          try {
            subArr.push({
              type: arr[i].children[0].alt,
              url: arr[i].href,
            });
          } catch {
            console.log("0 type reaction");
          }
        }
        return subArr;
      }
    );

    for (let index = 0; index < reactTypes.length; index++) {
      try {
        let reactData = {};
        let curReactData = [];
        await page.goto(reactTypes[index].url);
        await page.waitForTimeout(randomNum(500, 1500));

        reactData[reactTypes[index].type] = await scrapeReactID(
          curReactData,
          page,
          i
        );

        console.log(
          `${curAccBrowser[i].user} Crawled UserID react ${
            reactTypes[index].type
          } - total ${reactData[reactTypes[index].type].length}`
        );
        data.push(reactData);
      } catch (error) {
        getErr ? console.log("getReactForLoop", error) : "";
        break; //break func if accBanned or unable to click xemthem
      }
    }
  } catch (error) {
    if (await checkBanned(page, i)) {
      curAccBrowser[i] = nextAcc();
      await page.setCookie(...curAccBrowser[i].cookie);
      await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
      return await getReact(page, i);
    }

    getErr ? console.log("getReact", error) : "";
    throw error; // make parent function execute catch
  }
  return data;
};

export const scrapePage = async (page, paginating, counter, totalPost, i) => {
  try {
    let groupName = await page.$eval("header > table div", (i) => {
      return i.textContent;
    });
    let postUrl = await page.$$eval(
      "#m_group_stories_container section > article",
      (arr) => {
        const subArr = [];
        let url = "https://mbasic.facebook.com/";
        for (let i = 0; i < arr.length; i++) {
          subArr.push({
            postOwner:
              url +
              JSON.parse(arr[i].getAttribute("data-ft"))[
                "content_owner_id_new"
              ],
            postUrl:
              url +
              JSON.parse(arr[i].getAttribute("data-ft"))["top_level_post_id"],
          });
        }
        return subArr;
      }
    );
    let postCmt = await page.$$eval(
      "#m_group_stories_container section > article footer > div:nth-child(2) > a:nth-child(3)",
      (i) => {
        return i.map((i) => i.innerText);
      }
    );
    let postReact = await page.$$eval(
      "#m_group_stories_container section > article > footer > div:nth-child(2) a:first-child",
      (i) => {
        return i.map((i) => i.getAttribute("aria-label"));
      }
    );

    postUrl.forEach((_, index) => {
      let obj = {};

      obj["FbGroup"] = groupName;
      obj["PostOwner"] = postUrl[index].postOwner;
      obj["PostUrl"] = postUrl[index].postUrl;

      obj["totalCmt"] = postCmt[index] !== "Comment" ? postCmt[index] : "none";
      obj["totalReact"] = postReact[index] !== null ? postReact[index] : "none";

      totalPost.push(obj);
    });

    // Enroll more post
    // if (counter < paginating && test === false) {
    //   // i for looptest
    //   counter++;
    //   console.log(`${curAccBrowser[i]} Current groupPage ${counter}...max Paginating${paginating}`);
    //   await clickNext(
    //     page,
    //     "#m_group_stories_container > div:last-child > a",
    //     scrapePage,
    //     paginating
    //   );
    // }

    let nextButtonDisplay = false;
    let querrySelector = "#m_group_stories_container > div:last-child > a";
    try {
      //Check if querryable
      let nextButton = await page.$eval(querrySelector, (i) => {
        return i.href;
      });
      nextButtonDisplay = true;
    } catch (error) {
      nextButtonDisplay = false;
    }

    if (nextButtonDisplay && counter < paginating && test === false) {
      counter++;
      console.log(
        `${groupName} current groupPage ${counter}...max ${paginating}`
      );
      await page.waitForSelector(querrySelector);
      await page.click(querrySelector);
      // await page.waitForTimeout(randomNum(250, 500));
      return await scrapePage(page, paginating, counter, totalPost, i); //Looping scrape in current page
    }

    return totalPost;
  } catch (error) {
    getErr ? console.error("scrapePage", error) : "";
  }
};

export const scrapePost = async (page, i, scrapedData) => {
  curAccBrowser[i] = accounts[i];
  await page.setCookie(...curAccBrowser[i].cookie);
  //Check if acc Banned
  if (await checkBanned(page, i)) {
    curAccBrowser[i] = nextAcc();
    await page.setCookie(...curAccBrowser[i].cookie);
    await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
  }
  while (scrapedData.length) {
    try {
      let scrapedDataLength;
      console.log(`${curAccBrowser[i].user} scraping post...`);
      test ? (scrapedDataLength = 1) : (scrapedDataLength = scrapedData.length);
      for (let index = 0; index < scrapedDataLength; index++) {
        try {
          if (
            !scrapedData[index].CmtUser?.length ||
            !scrapedData[index].ReactUser?.length
          ) {
            let totalPostReact = [];
            let totalCommenters = [];

            console.log(
              `${curAccBrowser[i].user} going to post link: ${
                scrapedData[index].PostUrl
              } at ${index + 1}/${scrapedData.length}`
            );

            await page.goto(scrapedData[index].PostUrl);
            await page.waitForTimeout(randomNum(1000, 2500));

            //check if url got banned/deleted
            let checkPost = await page.$eval(
              "#objects_container span",
              (node) => node.textContent.slice(0, 42)
            );
            const FbPostErr = "The page you requested cannot be displayed";
            if (checkPost === FbPostErr || testBanned) {
              console.log(
                `${scrapedData[index].PostUrl} has been banned/deleted`
              );
              scrapedData.splice(index, 1);
              await scrapePost(page, i, scrapedData);
            }

            if (scrapedData[index].totalCmt === "none") {
              scrapedData[index].CmtUser = "none";
            } else if (!scrapedData[index].CmtUser?.length) {
              totalCommenters = await getComtID(totalCommenters, page, i);
              scrapedData[index].CmtUser = totalCommenters;
            }

            if (scrapedData[index].totalReact === "none") {
              scrapedData[index].ReactUser = "none";
            } else if (!scrapedData[index].ReactUser?.length) {
              totalPostReact = await getReact(page, i);
              scrapedData[index].ReactUser = totalPostReact;
            }
          }
        } catch (error) {
          throw error; // === return error to parrent Function to execute catch instead of try
        }
      }
    } catch (error) {
      getErr ? console.log("ScrapeGroupPhase2", error) : "";
      break;
    }
  }
  //Write Json and to break whileLoop
  scrapedData = filterScrapedData(scrapedData, i);
};

export function filterScrapedData(data, i) {
  try {
    let browserData = JSON.parse(
      fs.readFileSync(`./resultData.json`, {
        encoding: "utf8",
        flag: "r",
      })
    );

    let resultData = data.filter(
      (item) => item.CmtUser?.length && item.ReactUser?.length
    );

    browserData = [...browserData, ...resultData];

    test
      ? ""
      : fs.writeFileSync(`./resultData.json`, JSON.stringify(browserData));

    //rewrite scrapedData - filter resulted
    let filteredScrapedData = data.filter((item) => !resultData.includes(item));

    fs.writeFileSync(
      `./browser${i + 1}data/scrapedData.json`,
      JSON.stringify(filteredScrapedData)
    );
    console.log(
      `${curAccBrowser[i].user} Phase 2 completed, view at browser${
        i + 1
      }data/scrapedData.json`
    );
    return filteredScrapedData;
  } catch (error) {
    getErr ? console.log("filterScrapedData", error) : "";
  }
}

export function upsert(array1, obj, key) {
  const index = array1.findIndex((item) => item[`${key}`] === obj[`${key}`]);
  index > -1 ? (array1[index] = obj) : array1.push(obj);
}

//-------------------------main Func-------------------------

export const scrapeGroup = async (
  page,
  // startAccount,
  paginating,
  i,
  counter
) => {
  let scrapedData = JSON.parse(
    fs.readFileSync(`./browser${i + 1}data/scrapedData.json`, {
      encoding: "utf8",
      flag: "r",
    })
  );

  //Phase 1 data
  if (!scrapedData.length) {
    console.log(`Scraping page...`);
    let groupPostData = [];
    groupPostData = await scrapePage(
      page,
      paginating,
      counter,
      groupPostData,
      i
    );
    fs.writeFileSync(
      `./browser${i + 1}data/scrapedData.json`,
      JSON.stringify(groupPostData)
    );
    console.log(
      `Phase 1 completed, view at browser${i + 1}data/scrapedData.json`
    );

    scrapedData = groupPostData;
  }

  //Crawl until no postUrl left from phase1, prevent cluster.task moving to another FbGroupUrl
  await scrapePost(page, i, scrapedData);
};
