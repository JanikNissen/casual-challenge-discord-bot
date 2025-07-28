import {Card, constants, Deck} from './utils.js';
import {Card, Deck, constants, readSecret} from './utils.js';

let bearerToken = '';


async function checkCard(cardName) {
    const url = 'https://api.casualchallenge.gg/v1/cards?names=' + cardName;

    if(bearerToken.length === 0){
        bearerToken = readSecret('cc_api_token');
    }


    const res = await fetch(url, {
        headers: {
            'User-Agent': constants.USER_AGENT,
            'Authorization': 'Bearer ' + bearerToken
        }
    });

    if (!res.ok) {
        console.log(await res.text());
        const data = await res.json();
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    return await res.json();
}

function getUniqueCards(list) {
    let cards = [];
    list.main.map((card) => card.name).forEach(cardName => cards.push(cardName));
    list.side.map((card) => card.name).forEach(cardName => cards.push(cardName));
    return cards.filter((value, index, array) => array.indexOf(value) === index);
}

export async function CCDeckCheck(list) {
    let uniqueCards = getUniqueCards(list);
    let payload = uniqueCards.join(';');

    if(bearerToken.length === 0){
        bearerToken = readSecret('cc_api_token');
    }

    const url = 'https://api.casualchallenge.gg/v1/cards?names=' + payload;

    const res = await fetch(url, {
        headers: {
            'User-Agent': constants.USER_AGENT,
            'Authorization': 'Bearer ' + bearerToken
        }
    }).catch(err => console.log(err));

    if (!res.ok) {
        console.log(res.status);
        console.log(res.statusText);
        console.log(res);
        throw new Error(`api.casualchallenge.gg returned ${res.status} (${res.statusText})`);
    }

    const data = await res.json();

    let deck = new Deck(list.name);
    for (let i = 0; i < list.main.length; i++) {
        const a = data.found.find((card) => card.normalizedName === list.main[i].name);
        if (a !== undefined) {
            deck.addCardToDeck(new Card(a.name, a.budgetPoints, a.legality === 'LEGAL'), list.main[i].amount);
        }
    }
    for (let i = 0; i < list.side.length; i++) {
        const a = data.found.find((card) => card.normalizedName === list.side[i].name);
        if (a !== undefined) {
            deck.addCardToDeck(new Card(a.name, a.budgetPoints, a.legality === 'LEGAL'), list.side[i].amount, false);
        }
    }

    deck.missingCards = data.missing;
    return deck;
}

export async function getCardLegalityEmbed(cardName) {
    try {
        const cc = await checkCard(cardName);

        let card;
        let foundCard = cc.found.length === 1;
        if (foundCard) {
            card = cc.found[0];
        } else {
            card = cc.missing[0];
        }
        let text = '';
        let color = 0x00ff00;

        if (foundCard === false) {
            color = 0xff0000;
            text = 'We couldn\'t find this card. Sorry...';
            return {
                title: card.replaceAll("'", "\'"),
                description: text,
                color: color,
            };
        }

        text += `It costs **${card.budgetPoints} ** BP`;

        if (card.legality === 'BANNED') {
            color = 0xff0000;
            if (card.reason.appliedRules[0] === "PAPER_BAN") {
                text += `\nIt is banned because it is also banned in ${card.reason.bannedIn[0].toLowerCase()}`;
            } else if (card.reason.appliedRules[0] === "TOURNAMENT_STAPLE") {
                text += `\nIt is banned because of its high play rate in ${Object.getOwnPropertyNames(card.reason.metaShares).join(', ').toLowerCase()}`;
            }
        } else {
            text += ' and is legal.';
        }
        return {
            title: card.name,
            description: text,
            color: color,
        };
    } catch (err) {
        console.error(err);
    }
}
