import * as cheerio from 'cheerio';
import {constants, Link} from './utils.js';

/**
 * @param {string} cardName
 */
export async function ScryfallCardRequest(cardName) {
    const url = 'https://api.scryfall.com/cards/named?exact=' + encodeURI(cardName);

    const res = await fetch(url, {
        headers: {
            'User-Agent': constants.USER_AGENT,
            'Accept': '*/*'
        }
    });
    // throw API errors
    if (!res.ok) {
        const data = await res.json();
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    return await res.json();
}

/**
 * @param {Link} deckLink
 */
export async function ScryfallDeckRequest(deckLink) {
    const tidyURL = deckLink.asURL();
    tidyURL.search = 'as=list';
    const res = await fetch(tidyURL, {
        headers: {
            'User-Agent': constants.USER_AGENT,
            'Accept': 'text/html'
        }
    });
    if (!res.ok) {
        const data = await res;
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    const data = await res.text();
    const $ = cheerio.load(data);


    const cards = {name: '', main: [], side: []};

    cards.name = $('.deck-details-title').text();

    let b = $('div.deck-list').children('div.deck-list-section');
    for (let i = 0; i < b.length; i++) {
        //add to correct number
        let title = $(b[i]).find('.deck-list-section-title').text();
        let c = $(b[i]).find('ul').children('li');
        for (let j = 0; j < c.length; j++) {
            let amount = parseInt($(c[j]).find('.deck-list-entry-count').text());
            const scryfallLinkName = $(c[j]).find('.deck-list-entry-name a').attr('href').split('/').pop();

            if (new RegExp('Sideboard', 'g').test(title)) {
                cards.side.push({name: scryfallLinkName, amount: amount});
            } else {
                cards.main.push({name: scryfallLinkName, amount: amount});
            }
        }
    }
    return cards;
}
