const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const config = require('./config.json');
const quotes = require('./quotes.json');

const cooldowns = {};

if (!config.token || !config.clientId) {
    console.log('Token or clientId not set.');
    process.exit();
}

// Register slash commands
const commands = [
    new SlashCommandBuilder().setName('servercount').setDescription('Get the number of servers the bot is in'),
    new SlashCommandBuilder().setName('why').setDescription('Find out... why')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}, in ${client.guilds.cache.size} ${client.guilds.cache.size === 1 ? 'guild' : 'guilds'}`);
});

client.on('guildCreate', (guild) => {
    console.log(`Bot joined guild: ${guild.name}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'servercount') {
        await interaction.reply(`This bot is in ${client.guilds.cache.size} ${client.guilds.cache.size === 1 ? 'guild' : 'guilds'}`);
    } else if (interaction.commandName === 'why') {
        await interaction.reply('why not');
    }
});

client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    for (const keyword of config.keywords) {
        if (msg.content.toLowerCase().includes(keyword) || msg.content === `<@!${client.user.id}>`) {
            const now = Date.now();
            const lastUsed = cooldowns[msg.author.id] || 0;

            if (now - lastUsed > config.cooldown) {
                if (config.log) console.log(`${msg.guild.name} (#${msg.guild.id}) by ${msg.author.tag} (#${msg.author.id})`);
                try {
                    await msg.channel.send(quotes.length > 0 ? getRandomQuote() : 'Hello!');
                    cooldowns[msg.author.id] = now;
                } catch (err) {
                    console.error(err);
                }
            } else {
                const remaining = (config.cooldown / 1000 - (now - lastUsed) / 1000).toFixed(1);
                if (config.log) console.log(`${msg.guild.name} (#${msg.guild.id}) by ${msg.author.tag} (#${msg.author.id}) - COOLDOWN`);
                try {
                    await msg.channel.send(config.cooldownMessage.replace('%seconds%', remaining));
                } catch (err) {
                    console.error(err);
                }
            }
            return;
        }
    }
});

client.login(config.token);

function getRandomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)];
}
