import 'dotenv/config';
import {SlashCommandBuilder} from 'discord.js';
import {InteractionContextType} from 'discord-api-types/v10';
import {setCommands, Link, getErrorEmbed} from './utils.js'
import {CCDeckCheck, getCardLegalityEmbed} from './casualchallenge.js';
import {ScryfallCardRequest, ScryfallDeckRequest} from './scryfall.js';

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
            const normalizedCardName = new Link(scry.scryfall_uri).getNormalizedCardName();
            try {
                const cardEmbed = await getCardLegalityEmbed(normalizedCardName);
                await interaction.editReply({embeds: [cardEmbed]});
            } catch (err) {
                await interaction.editReply({embeds:[getErrorEmbed(err)]});
            }

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
            let link = new Link(interaction.options.getString('decklink'));
            if (link.isScryfallDeck() === false) {
                await interaction.editReply({
                    embeds: [{
                        title: `No deck found. Please provide a valid Scryfall Link.`,
                        color: 0xff0000,
                    }]
                });
                return;
            }
            const scry = await ScryfallDeckRequest(link);
            const deck = await CCDeckCheck(scry);
            let title = deck.name;
            let fields = [];
            const legal = deck.checkLegality();
            let legality = 'legal';
            let color = 0x00ff00;
            if (!legal.main) {
                legality = 'illegal';
                color = 0xff0000;
                fields.push({
                    name: 'Main Deck',
                    value: 'Your deck has less than 60 cards in it.',
                });
            }
            if (!legal.side) {
                legality = 'illegal';
                color = 0xff0000;
                fields.push({
                    name: 'Sideboard',
                    value: 'Your sideboard has more than 15 cards in it.',
                });
            }
            if (!legal.budget) {
                legality = 'illegal';
                color = 0xff0000;
                fields.push({
                    name: 'Budget',
                    value: `Your deck costs **${deck.getTotalBP()}** BP and is over 2500.`,
                });
            } else {
                fields.push({
                    name: 'Budget',
                    value: `Your deck costs **${deck.getTotalBP()}** BP.`,
                });
            }
            if (!legal.bans) {
                legality = 'illegal';
                color = 0xff0000;
                let a = {};
                a.name = 'Illegal Cards:';
                let list = '';
                deck.getIllegalCards().map((c) => c.card.name).forEach((card) => {
                    list = list.concat(card).concat('\n');
                });
                a.value = `\`\`\`${list}\`\`\``;
                fields.push(a);
            }
            if (deck.missingCards.length > 0) {
                color = 0xff7000;
                fields.unshift({
                    name: 'Cards we couldn\'t find',
                    value: deck.missingCards.join('\n'),
                });
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

const spells = [
    'Counterspell',
    'Force of Will pitching Brainstorm',
    'Mental Misstep',
    'Force of Negation pitching Force of Will',
    'Mana Leak',
    'Guttural Response',
    'Mana Tithe',
    'Dash Hopes'
];
const randomCounterSpell = function () {
    const a = Math.random() * spells.length;
    return spells[Math.floor(a)];
};

setCommands();
