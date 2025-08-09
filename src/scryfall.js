import * as cheerio from 'cheerio';
import {constants, fetchRequest, JSONfetchRequest, Link} from './utils.js';

/**
 * @param {string} cardName
 */
export async function ScryfallCardRequest(cardName) {
    const url = 'https://api.scryfall.com/cards/named?exact=' + encodeURI(cardName);

    const header  = {
        'User-Agent': constants.USER_AGENT,
        'Accept': '*/*'
    };

    return await JSONfetchRequest(url, header);
}

/**
 * @param {Link} deckLink
 */
export async function ScryfallDeckRequest(deckLink) {
    const tidyURL = deckLink.asURL();
    tidyURL.search = 'as=list';
    const header =  {
        'User-Agent': constants.USER_AGENT,
            'Accept': 'text/html'
    };
    const res = await fetchRequest(tidyURL, header);
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
