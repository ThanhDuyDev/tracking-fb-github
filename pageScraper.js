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
      await homePage.type("#m_login_email", "hrngocmi12@gmail.com");
      await homePage.waitForTimeout(5000);
      await homePage.type("input[name=pass]", "mom01235");
      await homePage.waitForTimeout(2000);
      const loginButton = "input[type=submit]";
      await homePage.waitForSelector(loginButton);
      await homePage.click(loginButton);

      let currentCookies = await homePage.cookies();
      fs.writeFileSync("./currentcookies.json", JSON.stringify(currentCookies));
    }

    const groupPostData = [];
    const totalPostData = [];
    const totalCommenters = [];

    let i = 3;

    async function scrapePage() {
      //querry scrapeLinks
      let groupName = await homePage.$eval("header > table div", (i) => {
        return i.textContent;
      });
      let postUrl = await homePage.$$eval(
        "#m_group_stories_container article > footer > div:nth-child(2) > a:nth-child(7)",
        (i) => {
          return i.map((i) => i.href);
        }
      );

      let postCmt = await homePage.$$eval(
        "#m_group_stories_container article footer > div:nth-child(2) > a:nth-child(3)",
        (i) => {
          return i.map((i) => i.innerText);
        }
      );

      let postReact = await homePage.$$eval(
        "#m_group_stories_container article > footer > div:nth-child(2) a:first-child",
        (i) => {
          return i.map((i) => i.getAttribute("aria-label"));
        }
      );

      postUrl.forEach((link, index) => {
        let obj = {};

        obj["FB group"] = groupName;
        obj["Url"] = link;

        let postReactConvert = postReact[index] ? postReact[index] : "none";
        obj["Reactions"] = postReactConvert;

        let postTotalCommentsConvert =
          postCmt[index].lenght > 10 ? postCmt[index] : "none";
        obj["Total comments"] = postTotalCommentsConvert;

        groupPostData.push(obj);
      });

      //Scrape post

      async function scrapePost(link) {
        let postPage = await browser.newPage();
        await postPage.goto(link);
        await postPage.waitForTimeout(5000);

        //scrape cmt: ID, href
        async function getComtID() {
          let comments = await postPage.$$eval(
            "div[id^=ufi_] > div > div:nth-child(5) > div > div > h3 > a",
            (i) => {
              return i.map((item) => ({
                Fbname: item.innerText,
                Url: item.href,
              }));
            }
          );
        }

        let moreCmt = false;

        try {
          const moreCmtBtn = await postPage.$eval(
            'div[id^="see_next"] a',
            (i) => {
              return i.textContent;
            }
          );
          console.log(moreCmtBtn);
          moreCmt = true;
        } catch (error) {
          moreCmt = false;
        }

        if (moreCmt) {
          await postPage.click('div[id^="see_next"] > a');
          await postPage.waitForTimeout(2000);
          curPageCommenters = await getComtID();
          totalCommenters.push(curPageCommenters);
        } else {
          return totalCommenters;
        }

        console.log(totalCommenters);

        //scrape reactions: like, haha, etc...
        //querry reactions url:
        // try {
        //   await postPage.click(
        //     "#m_story_permalink_view > div:nth-child(2) > div > div:nth-child(3) > a"
        //   );
        //   reactUrl = await postPage.$$eval(
        //     "#root > table > tbody > tr > td > div > div > a",
        //     (i) => {
        //       return i.href;
        //     }
        //   );

        //   reactText = await postPage.$$eval(
        //     "#root > table > tbody > tr > td > div > div > a > img",
        //     (i) => {
        //       return i.getAttribute("alt");
        //     }
        //   );
        //   console.log(reactText, reactUrl);
        //   // //loop every react
        //   // for (let i = 1; i < reactUrl.lenght; i++ ) {
        //   //   reactData = await scrapeReactID();
        //   //   totalReact.push(reactData);
        //   // }
        //   //Haha
        // } catch {
        //   (reactUrl = "none"), (reactText = "none");
        // }

        // scrapeReactID = async () => {
        //   let data = {};
        //   data[""];
        // };
      }
      //looping every url in postUrl
      for (link in postUrl) {
        let postData = await scrapePost(postUrl[link]);
        totalPostData.push(postData);
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

      //scraped
      if (nextButtonDisplay && i < 3) {
        i++;
        await homePage.click("#m_group_stories_container > div:last-child > a");
        await homePage.waitForTimeout(2000);
        return await scrapePage(); //Looping scrape in current page
      }
    }

    //Output data:
    await scrapePage();
    fs.writeFile(
      "postOverall.json",
      JSON.stringify(groupPostData),
      "utf8",
      function (err) {
        if (err) {
          return console.log(err);
        }
        console.log(
          "The data has been scraped and saved successfully! View it at './postOverall.json'"
        );
      }
    );
  },
};

module.exports = scraperObject;
