console.log('beep beep');
require('dotenv').config();

const Discord = require('discord.js');
const Canvas = require('canvas');
const urban = require('urban');
const client = new Discord.Client();

const fetch = require('node-fetch');

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

var channeled = '803104515976855573';

client.on('message', gotmessage);

async function gotmessage(msg) {
    if (msg.content.substring(0, 4) === '+gif') {
        if (!msg.content.substring(4, 5) === ' ') {
            msg.channel.send('that\'s not a command');
        } else {
            let searchTerm = msg.content.substring(5);
            let url = `https://api.tenor.com/v1/search?q=${searchTerm}&key=${process.env.TENORKEY}&limit=8`;
            let response = await fetch(url);
            let json = await response.json();
            let ind = Math.floor(Math.random() * json.results.length);
            msg.channel.send(json.results[ind].url);
        }
    }
    if (msg.content.substring(0, 8) === '+weather') {
        if (!msg.content.substring(8, 9) === ' ') {
            msg.channel.send('that\'s not a command');
        } else {
            let city = msg.content.substring(9);
            let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${process.env.WEATHERKEY}&lang=en`;
            let response = await fetch(url);
            let json = await response.json();
            if (json.message === 'city not found') {
                msg.channel.send(`${city} not found`);
            } else {
                var iconurl = `http://openweathermap.org/img/w/${json.weather[0].icon}.png`;
                let location = `${json.coord.lat},${json.coord.lon}`;
                let epoch = Math.floor(new Date().getTime() / 1000.0);
                let timeURL = `https://maps.googleapis.com/maps/api/timezone/json?location=${location}&timestamp=${epoch}&key=${process.env.TIMEKEY}`;
                let response2 = await fetch(timeURL);
                let json2 = await response2.json();
                let localEpoch = json2.dstOffset + json2.rawOffset + epoch + 21600;
                const weatherEmbed = new Discord.MessageEmbed()
                    .setTitle(`${json.name} Weather Report ( CityID: ${json.id} )`)
                    .setThumbnail(iconurl)
                    .setDescription(`Status: ${json.weather[0].description}`)
                    .setColor('#00ff00')
                    .addFields({
                        name: 'Current temperature: ',
                        value: `${json.main.temp}°C ( ${json.main.temp_min}°C to ${json.main.temp_max}°C )`,
                    }, {
                        name: 'Humidity: ',
                        value: `${json.main.humidity}%`,
                    }, {
                        name: 'Wind: ',
                        value: `${json.wind.speed}m/s ${windDirection(Math.floor(json.wind.deg))}`
                    }, {
                        name: 'Cloudiness: ',
                        value: `${json.clouds.all}%`
                    })
                    .setFooter(`Local time: ${epochConverter(localEpoch).toTimeString()} ${epochConverter(localEpoch).toDateString()}`);
                msg.channel.send(weatherEmbed);
            }
        }
    }
    if (msg.content.substring(0, 5) === '+wiki') {
        if (!msg.content.charAt(5) === ' ') {
            msg.channel.send('that\'s not a command');
        } else {
            let searchTerm = msg.content.substring(6);
            var url = "https://en.wikipedia.org/w/api.php";
            var params = {
                action: "query",
                generator: "search",
                format: "json",
                gsrsearch: `${searchTerm}`,
                gsrlimit: "5",
                prop: "pageimages|extracts",
                exchars: '400',
                exlimit: "max"
            };
            url = url + "?origin=*";
            Object.keys(params).forEach(function(key) {
                url += "&" + key + "=" + params[key];
            });
            url = url + "&exintro&explaintext";
            const processedURL = encodeURI(url);
            let response = await fetch(processedURL);
            let json = await response.json();
            if (json == undefined) {
                msg.channel.send('Unable to find results');
                return;
            }
            if (typeof json.query.pages === 'undefined' || json.query.pages === null) {
                msg.channel.send('Invalid search, please try again');
            }
            try {
                var searchNum = 0,
                    mainTitle = '',
                    desc = '',
                    mainImg = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png',
                    mainLink = '',
                    extraLinks = [],
                    extraTitles = [],
                    width = 0,
                    height = 0,
                    hasPic = false;
                if (json.hasOwnProperty('query')) {
                    Object.keys(json.query.pages).forEach(key => {
                        const id = key;
                        const title2 = json.query.pages[key].title;
                        if (searchNum == 0) {
                            mainTitle = title2;
                            mainLink = `https://en.wikipedia.org/?curid=${id}`;
                            if (json.query.pages[key].hasOwnProperty('thumbnail')) {
                                mainImg = `${json.query.pages[key].thumbnail.source}`;
                                width = json.query.pages[key].thumbnail.width * 3;
                                height = json.query.pages[key].thumbnail.height * 3;
                                hasPic = true;
                            }
                            if (!desc.includes('refer to:...')) {
                                desc = json.query.pages[key].extract;
                            }
                        }
                        if (searchNum > 0 && searchNum <= 4) {
                            extraTitles[searchNum - 1] = title2;
                            extraLinks[searchNum - 1] = `https://en.wikipedia.org/?curid=${id}`;
                        }
                        searchNum++;
                    })
                    const wikiEmbed = new Discord.MessageEmbed()
                        .setColor('#ff00ff')
                        .setTitle(mainTitle)
                        .setURL(mainLink)
                        .setDescription(desc)
                        .addField('Other related search terms: ', `[${extraTitles[0]}](${extraLinks[0]}), [${extraTitles[1]}](${extraLinks[1]}), [${extraTitles[2]}](${extraLinks[2]}), [${extraTitles[3]}](${extraLinks[3]})`);
                    msg.channel.send(wikiEmbed);
                    if (hasPic == true) {
                        const canvas = Canvas.createCanvas(parseInt(width), parseInt(height));
                        const ctx = canvas.getContext('2d');
                        const background = await Canvas.loadImage(`${mainImg}`);
                        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
                        const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'wikipedia-result.png');
                        msg.channel.send(attachment);
                    }
                }
            } catch (err) {
                msg.channel.send('Oops, It\'s Lewis\'s trash code again');
                console.log(err);
            }
        }
    }
    if (msg.content.substring(0, 6) === '+urban') {
        if (!msg.content.charAt(5) === ' ') {
            msg.channel.send('that\'s not a command');
            return;
        }
        let search = msg.content.substring(7);
        var url = urban(search);
        try {
            url.first(function(json) {
                if (json == undefined) {
                    msg.channel.send('Unable to find results');
                    return;
                }
                const urbanEmbed = new Discord.MessageEmbed()
                    .setColor('#00ffff')
                    .setTitle(json.word === '' ? 'none' : `${json.word}`)
                    .setURL(json.permalink === '' ? 'none' : `${json.permalink}`)
                    .setDescription(json.definition === '' ? 'none' : removeChars(json.definition))
                    .addFields({
                        name: '👍 ',
                        value: json.thumbs_up === '' ? 'none' : `${json.thumbs_up}`,
                        inline: true
                    }, {
                        name: '👎 ',
                        value: json.thumbs_down === '' ? 'none' : `${json.thumbs_down}`,
                        inline: true
                    }, {
                        name: 'Examples: ',
                        value: json.example === '' ? 'none' : removeChars(json.example)
                    })
                    .setFooter(json.written_on === '' ? 'none' : `${json.written_on}`);
                msg.channel.send(urbanEmbed);
            });
        } catch (err) {
            msg.channel.send('Oops, It\'s Lewis\'s trash code again');
            console.log(err);
        }

    }
    if (msg.content.substring(0, 7) === '+locate') {
        let search = msg.content.substring(8);
        var url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?`;
        var params = {
            input: `${search}`,
            inputtype: 'textquery',
            fields: 'business_status,formatted_address,geometry,icon,name,photos,place_id',
            APIkey: `${process.env.MAPKEY}`
        };
        Object.keys(params).forEach(function(key) {
            url += "&" + key + "=" + params[key];
        });
        let response = await fetch(url);
        let json = await response.json();
        try {
            msg.channel.send('success');
            console.log(json);
        } catch (err) {
            console.log(err);
        }
    }
}

client.on('guildMemberAdd', async member => {
    const channel = member.guild.channels.cache.find(ch => ch.name === 'verify');
    if (!channel) return;
    const canvas = Canvas.createCanvas(1400, 500);
    const ctx = canvas.getContext('2d');
    const background = await Canvas.loadImage('https://i1.wp.com/doblu.com/wp-content/uploads/2013/08/greatgatsby3006.jpg?fit=1920%2C1080');
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');
    channel.send(`
                Welcome to the server,
                $ { member }!`, attachment);
});

function removeChars(str) {
    var temp = "",
        i = 0;
    for (i; i < str.length; i++) {
        if (!(str[i] === '[' || str[i] === ']')) {
            temp += str[i];
        }
    }
    return temp;
}

function epochConverter(ts) {
    return new Date(ts * 1000);
}

function getColor() {
    return ("#" + Math.random().toString(16).slice(2, 8));
}

function windDirection(deg) {
    if (deg == 0) {
        return 'North';
    }
    if (deg == 90) {
        return 'East';
    }
    if (deg == 180) {
        return 'South';
    }
    if (deg == 270) {
        return 'West';
    }
    if (deg > 0 && deg < 90) {
        return 'North east';
    }
    if (deg > 90 && deg < 180) {
        return 'South east';
    }
    if (deg > 180 && deg < 270) {
        return 'South west';
    }
    if (deg > 270) {
        return 'North west';
    }
}

client.login(process.env.BOTTOKEN);