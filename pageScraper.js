const cookies = require("./currentcookies.json");
const fs = require("fs");

const scraperObject = {
  url: "https://mbasic.facebook.com/groups/377562787016149",
  async scraper(browser) {
    let homePage = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);
    // await homePage.goto(this.url); //skip login phase

    if (Object.keys(cookies).length) {
      await homePage.setCookie(...cookies);

      await homePage.goto(this.url);
    } else {
      await homePage.goto(this.url);

      const likeButton = "article footer div:nth-child(2) a:last-child";
      await homePage.waitForSelector(likeButton);
      await homePage.click(likeButton);
      await homePage.type("#m_login_email", "nguyenhaitan001@yahoo.com.vn");
      await homePage.type("input[name=pass]", "Tan00245698");

      const loginButton = "input[type=submit]";
      await homePage.waitForSelector(loginButton);
      await homePage.click(loginButton);

      let currentCookies = await homePage.cookies();
      fs.writeFileSync("./currentcookies.json", JSON.stringify(currentCookies));
    }

    const postDatas = [];

    async function scrapePage() {
      //querry scrapeLinks
      let postUrl = await homePage.$$eval(
        "footer > div:nth-child(2) > a:nth-child(5)",
        (i) => {
          return i.map((i) => i.href);
        }
      );
      let scrapePost = async (link) => {
        let dataObj = {};
        let postPage = await browser.newPage();
        await postPage.goto(link);
        await postPage.waitForTimeout(5000);
        dataObj["Group"] = await postPage.$eval(
          "div.bl > header > table > tbody > tr > td.bq.br",
          (i) => {
            return i.textContent;
          }
        );
        dataObj["Post url"] = `${link}`;
        dataObj["Post content"] = await postPage.$eval(
          "#m_story_permalink_view > div:first-child",
          (i) => {
            return i.textContent;
          }
        );
        dataObj["Likes"] = await homePage.$eval(
          "footer > div:nth-child(2) > span > a",
          (i) => {
            return i.getAttribute("aria-label");
          }
        );

        try {
          dataObj["Comments"] = await homePage.$eval(
            "footer > div:nth-child(2) > a:nth-child(3)",
            (i) => {
              return i.textContent;
            }
          );
        } catch {
          dataObj["Comments"] = "none";
        }

        await postPage.close();
        return dataObj;
      };

      //Loop all post link
      for (link in postUrl) {
        let dataCurPage = await scrapePost(postUrl[link]);
        console.log("dataCurPage", dataCurPage);
        postDatas.push(dataCurPage);
      }

      //Enroll more post
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

      //scraped test 1page
      let i = 1;
      if (nextButtonDisplay && i < 1) {
        i ++
        await homePage.click("#m_group_stories_container > div:last-child > a");
        return await scrapePage(); //Looping scrape every post in current page
      }
      await homePage.close();
      return postDatas;
    }
    let data = scrapePage();
    return data;
  },
};

module.exports = scraperObject;
