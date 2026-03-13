const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs').promises; // async file read
const path = require('path');

async function githubCommand(sock, chatId, message) {
  try {
    const res = await fetch('https://api.github.com/repos/Biharkebahubali/CODE-BREAKER-BOT');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();

    let txt = `*乂  CODE_BREAKER BOT 乂*\n\n`;
    txt += `✩  *Name* : ${json.name}\n`;
    txt += `✩  *Watchers* : ${json.watchers_count}\n`;
    txt += `✩  *Size* : ${(json.size / 1024).toFixed(2)} MB\n`;
    txt += `✩  *Last Updated* : ${moment(json.updated_at).format('DD/MM/YY - HH:mm:ss')}\n`;
    txt += `✩  *URL* : ${json.html_url}\n`;
    txt += `✩  *Forks* : ${json.forks_count}\n`;
    txt += `✩  *Stars* : ${json.stargazers_count}\n\n`;
    txt += `💥 *CODE_BREAKER*`;

    const imgPath = path.join(__dirname, '../assets/bot_image.jpg');
    const imgBuffer = await fs.readFile(imgPath); // async

    await sock.sendMessage(chatId, { image: imgBuffer, caption: txt }, { quoted: message });
  } catch (error) {
    console.error('GitHub command error:', error);
    await sock.sendMessage(chatId, { text: '❌ जानकारी प्राप्त करने में त्रुटि हुई।' }, { quoted: message });
  }
}

module.exports = githubCommand;