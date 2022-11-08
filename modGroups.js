import { Cluster } from "puppeteer-cluster";
import fs from 'fs';

let groupLinks = JSON.parse('./json/groupLinks.json');
const groups = [];

export async function modGroups() {
    try {
        console.log('------------start mod groups----------');
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: 50,
            retryLimit: 2
        })

        await cluster.task( async({page, data: {groupLink, i}}) => {
            let obj = {};
            await page.goto(groupLink);
            const json = await page.$eval('article', item => item.getAttribute('data-ft'));
            const groupId = JSON.parse(json).page_id;
            const name = await page.$eval('#root h1', item => item.innerText);
            obj.id = i;
            obj.groupId = groupId;
            obj.name = name;
            groups.push(obj)
            console.log('mod complete group: ', i);
        }) 

        for (let i in groupLinks) {
            cluster.queue({groupLink: groupLinks[i], i});
        }

        await cluster.idle();
        await cluster.close();
        fs.writeFileSync('./json/groups.json', JSON.stringify(groups));
        console.log('----------end mod groups------------');
    } catch (error) {
        console.log('_______err when modGroup: ', error);
    }
}