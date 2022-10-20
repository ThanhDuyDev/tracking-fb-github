const pageScraper = require("./pageScraper");
const fs = require("fs");

async function scrapeAll(browserInstance) {
  let browser;
  try {
    browser = await browserInstance;
    scrapedData = await pageScraper.scraper(browser);
    fs.writeFile(
      "scrapedData.json",
      JSON.stringify(scrapedData),
      "utf8",
      function (err) {
        if (err) {
          return console.log(err);
        }
        console.log(
          "The data has been scraped and saved successfully! View it at './scrapedData.json'"
        );
      }
    );
  } catch (err) {
    console.log("Could not resolve the browser instance => ", err);
  }
}

module.exports = (browserInstance) => scrapeAll(browserInstance);
