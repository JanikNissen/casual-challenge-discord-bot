import * as cheerio from 'cheerio';
import {setTimeout} from 'timers/promises';

export async function ScryfallCardRequest(cardName) {
    const url = 'https://api.scryfall.com/cards/named?exact=' + cardName.replaceAll(' ', '+');

    const res = await fetch(url, {
        headers: {
            'User-Agent': 'CCDiscordBotTest/1.0.0',
            'Accept':'*/*'
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

export async function ScryfallDeckRequest(deckURL) {
    const res = await fetch(deckURL, {
        headers: {
            'User-Agent': 'CCDiscordBotTest/1.0.0',
            'Accept':'text/html'
        }
    });
    if (!res.ok) {
        const data = await res;
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    const data = await res.text();
    const $ = cheerio.load(data);



    const cards = {name: '', main:[], side:[]};

    cards.name= $('.deck-details-title').text();

    let b = $('div.deck-list').children('div.deck-list-section');
    for (let i = 0; i < b.length; i++) {
        //add to correct number
        let title = $(b[i]).find('.deck-list-section-title').text();
        let c = $(b[i]).find('ul').children('li')
        for (let j = 0; j < c.length; j++) {
            let amount = parseInt($(c[j]).find('.deck-list-entry-count').text());
            const scryfallLinkName=$(c[j]).find('.deck-list-entry-name a').attr('href').split('/').pop();
            let cardName=$(c[j]).find('.deck-list-entry-name').text();
            //We have to check if the displayed name is the full card name and if not, need to search for that card in the API
            if(scryfallLinkName.split('-').length <= cardName.trim().split(' ').length) {
                await setTimeout(50);
                const card = await ScryfallCardRequest(cardName.replace('✶','').trim().replaceAll('\n', ''));
                cardName = card.name;
            }
            if(new RegExp('Sideboard', 'g').test(title)) {
                cards.side.push({name: cardName.replace('✶','').trim().replaceAll('\n', ''),amount: amount})
            } else {
                cards.main.push({name: cardName.replace('✶','').trim().replaceAll('\n', ''),amount: amount})
            }
        }
    }
    return cards
}

