//This is main file
import puppeteer from "puppeteer";
import {
  clickNext,
  scrapePost,
  getComtID,
  setCookies,
  randomNum,
  scrapeReactID,
} from "./crawFunc.js";
import fs from "fs";
import { pushDatabase } from "./mongodb.js";
import curUrl from "./currentUrl.json" assert { type: "json" }; //Continue scrape from last stopped
// let totalCommenters = [];
let groupPostData = [];
let i = 0;

(async () => {
  let url = curUrl
    ? curUrl
    : "https://mbasic.facebook.com/groups/377562787016149";
  const browser = await puppeteer.launch({ headless: false });
  const homePage = await browser.newPage();
  await homePage.goto(url);

  await setCookies(homePage, url);

  const scrapePage = async (homePage) => {
    try {
      let groupName = await homePage.$eval("header > table div", (i) => {
        return i.textContent;
      });
      let postUrl = await homePage.$$eval(
        "#m_group_stories_container article > footer > div:nth-child(2) > a:nth-child(7)",
        (i) => {
          return i.map((i) => i.href);
        }
      );

      //Loop every post in current page
      for (let index = 0; index < postUrl.length; index++) {
        let totalCmtUsers = [];
        let totalPostReact = [];
        let obj = {};
        const postPage = await browser.newPage();
        await postPage.goto(postUrl[index]);

        totalCmtUsers = await getComtID(totalCmtUsers, postPage);

        //ReactPage
        try {
          await postPage.click(
            "#m_story_permalink_view > div:nth-child(2) > div > div:nth-child(3) > a"
          );
          await postPage.waitForTimeout(500);
          let reactTypes = await postPage.$$eval(
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

          // console.log("reactTypes", reactTypes)
          for (let index = 0; index < reactTypes.length; index++) {
            let reactData = {};
            let curReactData = [];

            let reactPage = await browser.newPage();
            await reactPage.goto(reactTypes[index].url);
            await reactPage.waitForTimeout(randomNum(500, 1500));

            reactData[reactTypes[index].type] = await scrapeReactID(
              curReactData,
              reactPage
            );

            await reactPage.close();
            totalPostReact.push(reactData);
          }
        } catch {
          postPage.close();
        }

        obj["FbGroup"] = groupName;
        obj["PostUrl"] = postUrl[index];

        if (totalCmtUsers.length) {
          obj["CmtUsers"] = totalCmtUsers;
        } else {
          obj["TotalCmt"] = "none";
        }

        if (totalPostReact.length) {
          obj["ReactUsers"] = totalPostReact;
        } else {
          obj["Reactions"] = "none";
        }
        await postPage.close();
        groupPostData.push(obj);
      }

      //Enroll more post
      // await clickNext(
      //   homePage,
      //   "#m_group_stories_container > div:last-child > a",
      //   scrapePage(homePage)
      // );

      let nextButtonDisplay = false;

      try {
        //Check if querryable
        let nextButton = await homePage.$eval(
          "#m_group_stories_container > div:last-child",
          (i) => {
            return i.textContent;
          }
        );
        nextButtonDisplay = true;
      } catch (error) {
        nextButtonDisplay = false;
      }

      //go to next page
      if (nextButtonDisplay) {
        // i++; //to stop paginating
        await homePage.click("#m_group_stories_container > div:last-child > a");
        await homePage.waitForTimeout(randomNum(1000, 2000));
        return await scrapePage(homePage); //Looping scrape in current page
      }
    } catch (error) {
      console.error("scrapePage", error);
    }
  };

  console.log("scraping page....");
  await scrapePage(homePage);
  console.log("Stopped at: ", homePage.url());
  fs.writeFileSync("./currentUrl.json", JSON.stringify(homePage.url()));
  fs.writeFileSync("./data.json", JSON.stringify(groupPostData));
  console.log("file written success view at data.json");

  console.log("Pushing to mongoDB...");
  await pushDatabase().catch(console.error);
  console.log("All sequence completed!");
})();
