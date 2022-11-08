import fs from 'fs'
import { Cluster } from 'puppeteer-cluster'

let articles = JSON.parse(fs.readFileSync('./json/articles1.json'));
let groups = JSON.parse(fs.readFileSync('./json/groups.json'));

export async function phase1() {
    try {
        console.log('------------start phase1: get article links-----------------');
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: 50,
            timeout: 4000000,
            retryLimit: 4
        })
    
        await cluster.task(async ({ page, data: group }) => {
            try {
                let i = 0;
                if (group.link === '') {
                    await page.goto('https://mbasic.facebook.com/' + group.groupId);
                } else {
                    await page.goto(group.link);
                }
                while (true) {
                    i++;
                    if (i % 10 === 0 ) {
                        console.log('group ' + group.id + '----------crawl ', i, ' articles');
                    }
                    const newArticles = await page.$$eval(
                        'div[id=m_group_stories_container] > section > article',
                        arr => arr.map(
                            item => {
                                let data = JSON.parse(item.getAttribute('data-ft'));
                                let obj = {};
                                obj.groupId = group.id;
                                obj.groupName = group.name;
                                obj.articleId = data.top_level_post_id;
                                obj.ownerId = data.content_owner_id_new;
                                return obj;
                            }
                        )
                    )
                    articles = [...articles, ...newArticles];
                    const seeMore = await page.$('#m_group_stories_container > div:nth-child(2) a');
                    if (seeMore !==  null) {
                        const seeMoreLink = await page.$eval('#m_group_stories_container > div:nth-child(2) a', item => item.href);
                        await page.goto(seeMoreLink);
                    } else {
                        group.isDone = 1;
                        console.log('complete group: ', group.id);
                        break;
                    }
                }
            } catch (error) {
                group.link = page.url();
                console.log('err when get link of group: ', group.id, '--------- ', error);
            }
        })
    
        for (let group of groups) {
            cluster.queue(group);
        }
    
        await cluster.idle();
        await cluster.close();
        fs.writeFileSync('./json/articles1.json', JSON.stringify(articles));
        console.log('------------end phase1: get article links-----------------');
    } catch (error) {
        console.log('err in phase 1: ', error);
        fs.writeFileSync('./json/articles1.json', JSON.stringify(articles));
    }
}