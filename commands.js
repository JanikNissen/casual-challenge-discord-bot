import 'dotenv/config';
import {SlashCommandBuilder} from 'discord.js';
import {InteractionContextType} from 'discord-api-types/v10';
import {setCommands, IsScryfallDeckLink, GetCanonicalCardNameFromScryfallLink} from './utils.js'
import {CCDeckCheck, getCardLegalityEmbed} from "./casualchallenge.js";
import {ScryfallCardRequest, ScryfallDeckRequest} from "./scryfall.js";

export const commands = [
    {
        data: new SlashCommandBuilder()
            .setName('castaspell')
            .setDescription('Ping-pong command for testing')
            .setContexts([InteractionContextType.Guild]),
        async execute(interaction) {
            await interaction.editReply(`In response: ${randomCounterSpell()}`);
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('cardcheck')
            .setDescription('Check a card for it\'s BP and legality')
            .setContexts([InteractionContextType.Guild])
            .addStringOption(option => option
                .setName('cardname')
                .setDescription('Card to be checked')
                .setRequired(true)),
        async execute(interaction) {
            const scry = await ScryfallCardRequest(interaction.options.getString('cardname'));
            const canonicalCardName = GetCanonicalCardNameFromScryfallLink(scry.scryfall_uri);
            await interaction.editReply({embeds: [await getCardLegalityEmbed(canonicalCardName)]});
        }

    },
    {
        data: new SlashCommandBuilder()
            .setName('deckcheck')
            .setDescription('Check a deck for it\'s legality')
            .setContexts([InteractionContextType.Guild])
            .addStringOption(option => option
                .setName('decklink')
                .setDescription('Link to the deck on Scryfall')
                .setRequired(true)),
        async execute(interaction) {
            if (IsScryfallDeckLink(interaction.options.getString('decklink')) === false) {
                await interaction.editReply({
                    embeds: [{
                        title: `No deck found. Please provide a valid Scryfall Link.`,
                        color: 0xff0000,
                    }]
                });
                return;
            }
            const scry = await ScryfallDeckRequest(interaction.options.getString('decklink'));
            const deck = await CCDeckCheck(scry);
            let color = 0x00ff00;
            let title = deck.name;
            let fields = [];
            const legal = deck.checkLegality();
            let legality = 'legal';
            if (!legal.main) {
                color = 0xff0000;
                legality = 'illegal';
                let a = {}
                a.name = "Main Deck";
                a.value = "Your deck has less than 60 cards in it.";
                fields.push(a);
            }
            if (!legal.side) {
                legality = 'illegal';
                color = 0xff0000;
                let a = {};
                a.name = "Sideboard";
                a.value = "Your sideboard more than 15 cards in it.";
                fields.push(a);
            }
            if (!legal.budget) {
                legality = 'illegal';
                color = 0xff0000;
                let a = {};
                a.name = "Budget";
                a.value = `Your deck costs **${deck.getTotalBP()}** BP and is over 2500`;
                fields.push(a);
            } else {
                let a = {};
                a.name = "Budget";
                a.value = `Your deck costs **${deck.getTotalBP()}** BP`;
                fields.push(a);
            }
            if (!legal.bans) {
                legality = 'illegal';
                color = 0xff0000;
                let a = {};
                a.name = "Illegal Cards:";
                let list = '';
                deck.getIllegalCards().map((c) => c.card.name).forEach((card) => {
                    list = list.concat(card).concat('\n')
                });
                a.value = `\`\`\`${list}\`\`\``;
                fields.push(a);
            } if(deck.missingCards.length > 0) {
                color = 0xff7000;
                let a = {};
                a.name = "Cards we couldn't find";
                a.value = `${deck.missingCards.join("\n")}`
                fields.unshift(a);
            }

            await interaction.editReply({
                embeds: [{
                    title: `${title} is ${legality}`,
                    fields: fields,
                    color: color,
                }]
            });
        }
    }
];

const randomCounterSpell = function () {
    const spells = ['Counterspell', 'Force of Will pitching Brainstorm', 'Mental Misstep', 'Force of Negation pitching Force of Will', 'Mana Leak', 'Guttural Response', 'Mana Tithe', 'Dash Hopes']
    const a = Math.random() * spells.length;
    return spells [Math.floor(a)]
}

setCommands();