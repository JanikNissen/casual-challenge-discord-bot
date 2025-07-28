import 'dotenv/config';
import {REST} from 'discord.js';
import {Routes} from 'discord-api-types/v10';
import {commands} from './commands.js';
import fs from 'fs';

export const constants = {
    USER_AGENT: 'CCDiscordBotTest/1.0.0',
};

export function setCommands() {
    const c = [];
    commands.forEach(command => {
        c.push(command.data.toJSON());
    })
    const rest = new REST().setToken(readSecret('discord_token'));

    (async () => {
        try {
            console.log(`Started refreshing ${c.length} application (/) commands`);

            const data = await rest.put(
                Routes.applicationCommands(readSecret('app_id')),
                {body: c},
            );

            console.log(`Successfully reloaded ${data.length} application (/) commands`);

        } catch (error) {
            console.error(error);
        }
    })();
}

export function readSecret(secretName) {
    return fs.readFileSync(`./env/${secretName}.txt`, 'utf8');
}
export class Link {
    constructor(rawUrl) {
        this.rawUrl = rawUrl;
        this.url = new URL(rawUrl);

        let isScryfall = this.url.hostname === 'scryfall.com';
        this.pathParts = this.url.pathname.split('/');

        this._isScryfallCard = isScryfall && this.pathParts.length >= 2 && this.pathParts[0] === 'cards';
        this._isScryfallDeck = isScryfall && this.pathParts.length >= 2 && this.pathParts[1] === 'decks';
    }

    isScryfallCard() {
        return this._isScryfallCard;
    }

    isScryfallDeck() {
        return this._isScryfallDeck;
    }

    getNormalizedCardName() {
        return this.pathParts[this.pathParts.length - 1];
    }

    asURL() {
        return this.url;
    }

    toString() {
        return this.rawUrl;
    }
}

export class Card {
    constructor(name, bp, legal) {
        this.name = name;
        this.bp = bp;
        this.legal = legal;
    }
}

export class Deck {
    constructor(name) {
        this.name = name;
        this.mainBoard = [];
        this.sideBoard = [];
        this.missingCards = [];
    }

    addCardToDeck(card, amount, isMainBoard = true) {
        if (isMainBoard) {
            this.mainBoard.push({card: card, amount: amount});
        } else {
            this.sideBoard.push({card: card, amount: amount});
        }
    }

    getMainBoardSize() {
        return this.getBoardSize(this.mainBoard);
    }

    getSideBoardSize() {
        return this.getBoardSize(this.sideBoard);
    }

    getBoardSize(board) {
        let amount = 0;
        for (let i = 0; i < board.length; i++) {
            amount += board[i].amount;
        }
        return amount;
    }

    getTotalBP() {
        let bp = 0;
        for (let i = 0; i < this.mainBoard.length; i++) {
            bp += this.mainBoard[i].card.bp * this.mainBoard[i].amount;
        }
        for (let i = 0; i < this.sideBoard.length; i++) {
            bp += this.sideBoard[i].card.bp * this.sideBoard[i].amount;
        }
        return bp;
    }

    getIllegalCards() {
        let offenders = [];
        offenders = offenders.concat(this.mainBoard.filter((c) => c.card.legal === false));
        offenders = offenders.concat(this.sideBoard.filter((c) => c.card.legal === false));
        return offenders;
    }

    checkLegality() {
        return {
            main: this.getMainBoardSize() >= 60,
            side: this.getSideBoardSize() <= 15,
            bans: this.getIllegalCards().length === 0,
            budget: this.getTotalBP() <= 2500
        };
    }
}
