import cookies from "./curcookies.json" assert { type: "json" };
import fs from "fs";

export function randomNum(minNum, maxNum) {
  // delay paging, selecting
  minNum = Math.ceil(minNum);
  maxNum = Math.floor(maxNum);
  return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
}

export async function setCookies(page, url) {
  if (Object.keys(cookies).length) {
    await page.setCookie(...cookies);

    await page.goto(url);
  } else {
    await page.goto("https://mbasic.facebook.com/");

    console.log("typing email");
    await page.type("#m_login_email", "nerbabi7@gmail.com");
    await page.waitForTimeout(5000);
    console.log("typing password");
    await page.type("input[name=pass]", "Tan01267765660");
    await page.waitForTimeout(2000);
    const loginButton = "input[type=submit]";
    await page.waitForSelector(loginButton);
    await page.click(loginButton);

    let currentCookies = await page.cookies();
    fs.writeFileSync("./curcookies.json", JSON.stringify(currentCookies));

    await page.goto(url);
  }
}

export async function clickNext(page, querrySelector, loopFunction) {
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

  //scraped
  if (nextButtonDisplay) {
    await page.waitForSelector(querrySelector);
    await page.click(querrySelector);
    await page.waitForTimeout(2000);
    return await loopFunction; //Looping scrape in current page
  }
}

export const getComtID = async (totalCommenters, postPage) => {
  try {
    let comments = await postPage.$$eval(
      "div[id^=ufi_] > div > div:nth-child(5) > div > div > h3 > a",
      (i) => {
        return i.map((item) => ({
          Fbname: item.innerText,
          Url: item.href,
        }));
      }
    );
    totalCommenters = [...totalCommenters, ...comments];

    let moreCmt = false;
    try {
      const moreCmtBtn = await postPage.$eval('div[id^="see_next"] a', (i) => {
        return i.textContent;
      });
      moreCmt = true;
    } catch (error) {
      moreCmt = false;
    }

    if (moreCmt) {
      await postPage.click('div[id^="see_next"] > a');
      await postPage.waitForTimeout(randomNum(1500, 2500));
      return await getComtID(totalCommenters, postPage);
    }

    return totalCommenters;
  } catch (error) {
    console.error("getComtID", error);
    console.log("more Cmt not found");
  }
};

export const scrapeReactID = async (curReactData, reactPage) => {
  // console.log("reactText", reactText);
  try {
    let curPageData = await reactPage.$$eval("ul header > h3 > a", (i) =>
      i.map((item) => ({
        Name: item.textContent,
        Url: item.href,
      }))
    );
    curReactData = [...curReactData, ...curPageData];

    let xemthemStatus = false;
    try {
      const xemthem = await reactPage.$eval(
        "ul li:last-child div a",
        (i) => i.textContent
      );
      xemthemStatus = true;
    } catch (error) {
      // console.log("xemthem", error);
      xemthemStatus = false;
    }

    if (xemthemStatus) {
      await reactPage.click("ul li:last-child a");
      await reactPage.waitForTimeout(1000);
      return await scrapeReactID(curReactData, reactPage);
    }
  } catch (error) {
    console.log("scrapeReactID", error);
  }
  return curReactData;
};

export async function scrapePost(link, browser) {
  let totalPostReact = [];
  let totalCommenters = [];
  let postPage = await browser.newPage();
  await postPage.goto(link);
  await postPage.waitForTimeout(randomNum(1000, 2000));

  totalCommenters = await getComtID(postPage);
  // totalPostReact = await getReact();

  return [...totalCommenters, ...totalPostReact];
}
