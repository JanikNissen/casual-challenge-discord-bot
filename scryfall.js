import * as cheerio from 'cheerio';
export async function ScryfallCardRequest(cardname) {
    // append endpoint to root API URL
    const url = 'https://api.scryfall.com/cards/named?exact=' + cardname.replaceAll(' ', '+');
    // Use fetch to make requests
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
    const data = await res.json();
    console.log(data)
    // return original response
    return data;
}

export async function ScryfallDeckRequest(deckurl) {
    // Use fetch to make requests
    const res = await fetch(deckurl, {
        headers: {
            'User-Agent': 'CCDiscordBotTest/1.0.0',
            'Accept':'text/html'
        }
    });
    // throw API errors
    if (!res.ok) {
        const data = await res;
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    const data = await res.text();
    const $ = cheerio.load(data);
    const cards = [];
    let b = $('div.deck-list').children('div.deck-list-section');
    for (let i = 0; i < b.length; i++) {
        let c = $(b[i]).find('ul').children('li')
        for (let j = 0; j < c.length; j++) {
            console.log($(c[j]).html())
            let amount = parseInt($(c[j]).find('.deck-list-entry-count').text());
            for (let k = 0; k < amount; k++) {
                cards.push($(c[j]).find('.deck-list-entry-name').text().replaceAll(' ', '').replaceAll('\n', ''));
            }
        }
    }
    return cards
}

