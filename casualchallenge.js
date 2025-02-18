import {Card, Deck} from './utils.js';

async function checkCard (cardName) {
    const url = 'https://api.casualchallenge.gg/v1/cards?names=' + encodeURIComponent(cardName);

    const res = await fetch(url, {
        headers: {
            'User-Agent': 'CCDiscordBotTest/1.0.0',
            'Authorization':'Bearer '+ process.env.CC_API_TOKEN
        }
    });

    if (!res.ok) {
        const data = await res.json();
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    return await res.json();
}

function getUniqueCards(list) {
    let cards = [];
    list.main.map((card)=> card.name).forEach(cardName => cards.push(cardName));
    list.side.map((card)=> card.name).forEach(cardName => cards.push(cardName));
    return cards.filter((value, index,array)=> array.indexOf(value) === index);
}

export async function CCDeckCheck (list) {
    let uniqueCards = getUniqueCards(list);
    let payload = '';

    uniqueCards.forEach(card=> payload.push(card.concat(';')));

    const url = 'https://api.casualchallenge.gg/v1/cards?names=' + payload;

    const res = await fetch(url, {
        headers: {
            'User-Agent': 'CCDiscordBotTest/1.0.0',
            'Authorization':'Bearer '+ process.env.CC_API_TOKEN
        }
    });

    if (!res.ok) {
        console.log(res.toString())
        throw new Error(res.toString());
    }

    const data = await res.json();
    console.log(data);

    let deck = new Deck(list.name);
    for (let i=0; i<list.main.length; i++){
        const a = data.found.find((card)=> card.name === list.main[i].name);
        if(a !== undefined) {
            deck.addCardToDeck(new Card(list.main[i].name, a.budgetPoints,a.legality === 'LEGAL'), list.main[i].amount);
        }
    }
    for (let i=0; i<list.side.length; i++){
        const a = data.found.find((card)=> card.name === list.side[i].name);
        if(a !== undefined) {
            deck.addCardToDeck(new Card(list.side[i].name, a.budgetPoints,a.legality === 'LEGAL'), list.side[i].amount, false);
        }
    }

    return deck;
}

export async function getCardLegalityEmbed (cardName){
    const cc = await checkCard(cardName);
    if(cc.found.length === 0){
        return;
    }
    const card = cc.found[0];
    console.log(card);
    let color = 0x00ff00;
    let text = `It costs **${card.budgetPoints}** BP`;
    if(card.legality === 'BANNED'){
        color = 0xff0000;
        if(card.reason.appliedRules[0] === "PAPER_BAN"){
            text = text.concat(`\nIt is banned because it is also banned in ${card.reason.bannedIn[0].toLowerCase()}`);
        } else if (card.reason.appliedRules[0] === "TOURNAMENT_STAPLE"){
            text = text.concat(`\nIt is banned because of its high play rate in ${Object.getOwnPropertyNames(card.reason.metaShares).join(', ').toLowerCase()}`);
        }
    } else {
        text = text.concat(` and is legal.`);
    }
    return {
            title:`${cardName}`,
            description: text,
            color: color,
        };
}