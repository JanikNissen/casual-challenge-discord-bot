import {Client, Collection, Events, MessageFlags} from 'discord.js';
import {GatewayIntentBits} from 'discord-api-types/v10';
import {GetCanonicalCardNameFromScryfallLink, IsScryfallCardLink} from './utils.js';
import {commands} from './commands.js';

import 'dotenv/config';
import {ScryfallCardRequest} from './scryfall.js';
import {getCardLegalityEmbed} from './casualchallenge.js'

const token = process.env.DISCORD_TOKEN

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});
client.commands = new Collection();
commands.forEach(command => {
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command)
    }
});

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`)
});
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    try {
        await interaction.deferReply();
        await command.execute(interaction);
    } catch (error) {
        console.log(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral
            });
        } else {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral
            });
        }
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.id !== process.env.SCRYFALL_DISCORD_BOT_ID) {
        return;
    }
    if (!IsScryfallCardLink(message.content)) {
        return;
    }

    await message.reply({embeds: [await getCardLegalityEmbed(GetCanonicalCardNameFromScryfallLink(message.content))]});
});

client.login(token);