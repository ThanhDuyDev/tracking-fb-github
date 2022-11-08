import { Cluster } from "puppeteer-cluster";
import fs from 'fs';

let articles = JSON.parse(fs.readFileSync('./json/articles.json'));
let cookies = JSON.parse(fs.readFileSync('./json/cookies.json'));

let avIndex = 0;
let currentIndex = 0;
const maxTabs = 3;
const myTimeout = 500;

async function checkBan(page, index) {
    try {
        const query = await page.$('div[title$=Blocked]');
        if (query !== null) {
            cookies[index].isBanned = 1;
            index = avIndex;
            await page.setCookie(...cookies[index].cookies);
            await page.reload({ waitUntil: ['domcontentloaded', "networkidle0"] });
            if (avIndex === cookies.length) {
                throw new err('out of cookies');
            }
            avIndex++;
            return [1, index];
        }
        return [0, index];
    } catch (error) {
        console.log('err when check ban', error);
    }
}

async function setStartCookies(page) {
    let index;
    if (avIndex < maxTabs) {
        index = avIndex;
        avIndex++;
    } else {
        index = currentIndex;
    }
    await page.setCookie(...cookies[index].cookies);
    return index;
}

async function getComments({ page, data: article }) {
    try {
        let index = await setStartCookies(page);
        await page.waitForTimeout(myTimeout);
        await page.goto('https://mbasic.facebook.com/' + article.articleId);
        const isBanned = await checkBan(page, index);
        if (isBanned[0]) {
            index = isBanned[1];
            console.log('cookies banned, change cookies');
        }
        const query = await page.$('#m_story_permalink_view');
        let comments = [];
        if (query !== null) {
            article.isDeleted = 0;
            while (true) {
                const newComments = await page.$$eval(
                    'div[id^=ufi_] > div > div:nth-child(5) > div h3 > a',
                    arr => arr.map(item => item.href));
                if (newComments.length) {
                    comments = [...comments, ...newComments];
                } else {
                    const isBanned = await checkBan(page, index);
                    if (isBanned[0]) {
                        index = isBanned[1];
                    } else {
                        break;
                    }
                }
                const nextPage = await page.$('div[id^=see_next_]');
                if (nextPage !== null) {
                    const nextPageLink = await page.$eval('div[id^=see_next_] a', item => item.href);
                    await page.waitForTimeout(myTimeout);
                    await page.goto(nextPageLink);
                } else {
                    break;
                }
            }
            if (comments) {
                article.commentsDetail = [...new Set(comments)];
            } else {
                article.commentsDetail = 'none';
            }
            console.log('get ', article.commentsDetail.length, ' comments');
        } else article.isDeleted = 1;

        currentIndex = index;
    } catch (error) {
        console.log('err when get comments ', error);
    }
}

async function getReacts({ page, data: article }) {
    try {
        let index = await setStartCookies(page);
        await page.waitForTimeout(myTimeout);
        await page.goto('https://mbasic.facebook.com/' + article.articleId);
        const isBanned = await checkBan(page, index);
        if (isBanned[0]) {
            index = isBanned[1];
            console.log('cookies banned, change cookies');
        }
        const query = await page.$('#m_story_permalink_view');
        let reacts = [];
        if (query !== null) {
            article.isDeleted = 0;
            const reactsLink = await page.$eval('div[id^=sentence_] > a', item => item.href);
            await page.waitForTimeout(myTimeout);
            await page.goto(reactsLink);

            //take react types
            const reactTypes = await page.$$eval(
                '#root > table > tbody > tr > td > div > div a',
                arr => {
                    const newArr = [];
                    arr.forEach(item => {
                        try {
                            newArr.push({ name: item.children[0].alt, link: item.href })
                        } catch (error) {
                            console.log('err when get types reacts');
                        }
                    })
                    console.log('-----------------new arr', newArr);
                    return newArr;
                })

            //update data reacts
            if (reactTypes.length) {
                for (let type of reactTypes) {
                    await page.waitForTimeout(myTimeout);
                    await page.goto(type.link);
                    const isBanned = await checkBan(page, index);
                    if (isBanned[0]) {
                        index = isBanned[1];
                        console.log('cookies banned, change cookies');
                    }
                    const data = await getOneTypeReact(page, type, index);
                    reacts.push(data[0]);
                    index = data[1];
                }
            }
            if (reacts.length) {
                article.reactsDetail = reacts;
                console.log('article id: ', article.articleId, ' get ', article.reactsDetail, ' reacts');
            } else {
                article.reactsDetail = 'none'
            }
        } else {
            console.log('article is deleted id: ', article.articleId);
            article.isDeleted = 1;
        }
        if (reacts) {
            article.reactsDetail = reacts;
        } else article.reactsDetail = 'none';
        currentIndex = index;
    } catch (error) {
        console.log('err when get reacts ', error);
    }
}

async function getOneTypeReact(page, type, index) {
    try {
        let obj = {};
        let data = []
        while (true) {
            const newReacts = await page.$$eval('#root ul > li h3 > a', arr => arr.map(item => item.href));
            if (newReacts.length) {
                data = [...data, ...newReacts];
            } else {
                const isBanned = await checkBan(page, index);
                if (isBanned[0]) {
                    index = isBanned[1]
                    console.log('account is banned, change account');
                } else {
                    break;
                }
            }
            //move to next page
            const query = await page.$('#root ul > li a span');
            if (query !== null) {
                const nextPageLink = await page.$eval('#root ul > li:last-child a', item => item.href);
                await page.waitForTimeout(myTimeout);
                await page.goto(nextPageLink);
            } else {
                break;
            }

        }
        obj[type.name] = data;
        return [obj, index]
    } catch (error) {
        console.log('err when get one type react', error);
    }
}

export async function phase2() {
    try {
        console.log('------------start phase2: get article details---------------');
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: maxTabs,
            // timeout: 4000000,
        })

        for (let article of articles) {
            cluster.queue(article, getComments);
            cluster.queue(article, getReacts);
        }

        await cluster.idle();
        await cluster.close();
        fs.writeFileSync('./data.json', JSON.stringify(articles));
        fs.writeFileSync('./cookies.json', JSON.stringify(cookies));
        console.log('------------end phase2: get article details---------------');
    } catch (error) {
        console.log('err in phase2: ', error);
        fs.writeFileSync('./data.json', JSON.stringify(articles));
        fs.writeFileSync('./cookies.json', JSON.stringify(cookies));
    }
}