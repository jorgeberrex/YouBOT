const Discord = require("discord.js");
const client = new Discord.Client();

const config = require('./config.json');
var quotes = require('./quotes.json')

var cooldowns = {};

if (!config.token) {
    console.log('Token not set.');
    process.exit();
} else if (!config.keyword) {
    console.log('Keyword not set.');
    process.exit();
}

client.on('message', msg => {
    if (msg.content.toLowerCase().includes(config.keyword) ||
        msg.content.includes(`<@${client.user.id}>`)) {
        if (!cooldowns.hasOwnProperty(msg.author) || cooldowns.hasOwnProperty(msg.author) && new Date().getTime() - cooldowns[msg.author] > 4000) {
            msg.channel.send(quotes.length > 0 ? getRandomQuote() : "Hello!");
            addCooldown(msg.author);
        } else {
            msg.channel.send("You really like me, don't you... Well, you gotta wait " + (4-(new Date().getTime() - cooldowns[msg.author])/1000) + " seconds ¯\\\_(ツ)\_/¯");
        }
    }
});

client.on('ready', () => {
    console.log(`Bot is in ${client.guilds.array().length} guilds`);
});

client.on('guildCreate', (guild) => {
    console.log(`Bot joined guild: ${guild.name}`)
})

function addCooldown(author) {
    var date = new Date().getTime();
    for (var id in cooldowns) if (date - cooldowns[id] > 4000) delete cooldowns[id];
    cooldowns[author] = date;
}

client.login(config.token);

function getRandomQuote() {
    return quotes[rand(quotes.length)];    
}

function rand(max) {
    return Math.round(Math.random() * max);
}
