import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const CHECK_CARD_COMMAND = {
  name: 'checkcard',
  description: 'Check the legality and BP of a card',
  options: [
    {
      type: 3,
      name: 'cardname',
      description: 'Which card to check',
      required: true,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};

const CONFIRM_DECK_LEGALITY_COMMAND = {
  name: 'deckcheck',
  description: 'Check the legality and BP of a card',
  options: [
    {
      type: 3,
      name: 'decklink',
      description: 'Scryfall link to the deck',
      required: true,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};


const ALL_COMMANDS = [TEST_COMMAND, CHECK_CARD_COMMAND, CONFIRM_DECK_LEGALITY_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
