import { phase1 } from "./getArtilceLinks.js";
import { phase2 } from "./getArticleDetails.js";
import { modGroups } from "./modGroups.js";
import { createCookies } from "./createCookies.js";

async function scrape() {
    //before run need file groupLinks.json and users.json
    try {
        // write file groups.json
        await modGroups();
        // write file articles.json
        await phase1();
        // write file cookies.json
        await createCookies();
        // update file articles.json
        await phase2();
    } catch (error) {
     console.log('______err when scrape: ', error);   
    }
}

scrape();