
const cookies = require('./cookies.json');
const fs = require('fs');

const clickByText = async (page, text) => {
    const escapedText = escapeXpathString(text);
    const linkHandlers = await page.$x(`//a[contains(text(), ${escapedText})]`);

    if (linkHandlers.length > 0) {
        await linkHandlers[0].click();
    } else {
        throw new Error(`Link not found: ${text}`);
    }
};

const scraperObject = {
    url: 'https://mbasic.facebook.com/groups/377562787016149',
    async scraper(browser) {
        const page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);



        if (Object.keys(cookies).length) {
            await page.setCookie(...cookies);

            await page.goto(this.url);
        } else {
            await page.goto(this.url);

            const likeButton = "article footer div:nth-child(2) a:last-child";
            await page.waitForSelector(likeButton)
            await page.click(likeButton)
            await page.type('#m_login_email', 'dangphuocloc482k@gmail.com');
            await page.type('input[name=pass]', 'dpl04082000');

            const loginButton = "input[type=submit]";
            await page.waitForSelector(loginButton)
            await page.click(loginButton)

            let currentCookies = await page.cookies();
            fs.writeFileSync('./cookies.json', JSON.stringify(currentCookies));
        }

        // let items = document.querySelectorAll("article");
        // console.log("items", items);
        // const resultsSelector = 'article';

        // const links = await page.evaluate(resultsSelector => {
        //     return [...document.querySelectorAll(resultsSelector)].map(anchor => {
        //         const title = anchor.textContent.split('|')[0].trim();
        //         return `${title} - ${anchor.href}`;
        //     });
        // }, resultsSelector);


        const seeFullButton = "article footer div:nth-child(2) a:nth-child(7)";
        await page.waitForSelector(seeFullButton)
        await page.click(seeFullButton)

        // -------view post content
        // const fullPost = await page.evaluate(async () => {
        //     const content = [];
        //     let item = document.querySelector(".bj");
        //     content.push(item.innerText);
        //     return content;
        // });

        // console.log("full post", fullPost);

        const allLike = ".dl a";
        await page.waitForSelector(allLike)
        await page.click(allLike)

        const like = await page.evaluate(async () => {
            const reactionData = [];
            let item = document.querySelector(`#root > table > tbody > tr > td > div > div > a:nth-child(3)`)
            item.click(() => {
                console.log("");

            }); 
            // for (var i = 1; i <= 3; i++) {
            //     let item = document.querySelector(`#root > table > tbody > tr > td > div > div > a:nth-child(${i})`)
            //     if (item !== null) {
            //         console.log("new item", item);
            //         item.click(() => {
            //             let a = document.querySelector("tr");
            //             console.log(a);
            //         });              
            //     }
            // }
            return reactionData;
        });

        console.log(like);

        // for ( var i=2; i<=9; i++) {
        //     // console.log(i);


        //     // if (like !== false) {
        //     //     await page.waitForSelector(like)
        //     //     await page.click(like)
        //     // }
        //     console.log(like);
        // }






        // console.log(document.querySelector(`#root > table > tbody > tr > td > div > div > a:nth-child(3)`));


        // for (var i = 2; i < 9; i++) {
        //     // const like = `#root > table > tbody > tr > td > div > div > a:nth-child(${i})`;
        //     console.log(document.querySelector(`#root > table > tbody > tr > td > div > div > a:nth-child(${i})`)   );
        // }



        // const emo = await page.evaluate(async () => {
        //     const emo = [];
        //     for(let i=1; i<=5; i++) {
        //         const like = `#root > table > tbody > tr > td > div > div > a:nth-child(${i})`
        //         await page.waitForSelector(like)
        //         await page.click(like)

        //         let items = document.querySelectorAll("#root > table > tbody > tr > td > div > ul > li");
        //         items.forEach((item) => {
        //             emo.push({
        //                 icon: i,
        //                 name: item.innerText
        //             })
        //         })
        //     }

        //     return emo;
        // })

        // console.log("all emo", emo);



        // const posts = await page.evaluate(async () => {
        //     const links = [];
        //     let items = document.querySelectorAll("article");
        //     console.log('selector', items);
        //     // const title = document.querySelector(".bu")
        //     items.forEach((item) => {
        //         console.log("item", item);
        //         links.push({
        //             title: item.innerText,
        //             url: item.getAttribute("href")
        //         });
        //     });

        //     return links;
        // });
        // console.log("post list", posts);


        // for (let post of posts) {
        //     // await page.goto(post.url);
        //     // let lyric = await page.evaluate(() => {
        //     //     let lyric = document
        //     //         .getElementsByClassName("pd_lyric trans")[0]
        //     //         .innerHTML.replace(/\<br\>/g, "");
        //     //     return lyric;
        //     // });
        //     // console.log(song.title);
        //     // console.log("..............................");
        //     // console.log(lyric);
        // }
        // posts.forEach(post => {
        // });
        // page.click("a[contains(., 'Full Story')]");
    }
}

module.exports = scraperObject;
