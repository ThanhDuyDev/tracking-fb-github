import fs from "fs";
import { Cluster } from "puppeteer-cluster";

let users = JSON.parse(fs.readFileSync('./users.json'));
const cookies = [];

export async function createCookies() {
    try {
        console.log('----------start create cookies--------------');
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: 50,
            retryLimit: 5,
        })

        await cluster.task(async ({ page, data: user }) => {
            await page.goto('https://mbasic.facebook.com/');
            await page.type('#m_login_email', user.username);
            await page.type('input[name=pass]', user.pass);
            const submitBtn = 'input[type=submit]';
            await page.waitForSelector(submitBtn);
            await page.click(submitBtn);
            let currentCookie = await page.cookies();
            cookies.push({
                id: user.id,
                isBanned: 0,
                cookies: currentCookie
            });
        })

        for (let user of users) {
            cluster.queue(user)
        }

        await cluster.idle();
        await cluster.close();
        fs.writeFileSync('./json/cookies.json', JSON.stringify(cookies));
        console.log('----------end create cookies--------------');
    } catch (error) {
        console.log('err when create cookies: ', error);
    }
}