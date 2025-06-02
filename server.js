const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const config = require('./config.json');
const quotes = require('./quotes.json');

const cooldowns = {};

if (!config.token) {
    console.log('Token not set.');
    process.exit();
} else if (!config.keywords) {
    console.log('Keywords not set.');
    process.exit();
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}, in ${client.guilds.cache.size} guilds`);
});

client.on('guildCreate', (guild) => {
    console.log(`Bot joined guild: ${guild.name}`);
});

client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    if ((config.cmdUserWhitelist || []).includes(msg.author.id)) {
        if (msg.content === '!serverCount') {
            await msg.reply(`This bot is in ${client.guilds.cache.size} guilds`);
            return;
        } else if (msg.content === '!why') {
            await msg.reply('why not');
            return;
        }
    }

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
