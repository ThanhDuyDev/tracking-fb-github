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
        i++;
        await homePage.click("#m_group_stories_container > div:last-child > a");
        return await scrapePage(); //Looping scrape every post in current page
      }
      await homePage.close();
      return postDatas;
