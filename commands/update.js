const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const isOwnerOrSudo = require('../lib/isOwner');

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
            resolve((stdout || '').toString());
        });
    });
}

async function hasGitRepo() {
    const gitDir = path.join(process.cwd(), '.git');
    if (!fs.existsSync(gitDir)) return false;
    try {
        await run('git --version');
        return true;
    } catch {
        return false;
    }
}

// TMP FOLDER AUTO (antidelete error rokne ke liye)
function ensureTmpFolder() {
    try {
        const tmpPath = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpPath)) {
            fs.mkdirSync(tmpPath, { recursive: true });
        }
    } catch (e) {}
}

// AUTO GIT SETUP + VERSION REFLECT
async function setupGitRepo(sock, chatId, message) {
    await sock.sendMessage(chatId, { text: '⚙️ Git repo setup kar raha hun...' }, { quoted: message });
    
    await run('git init');
    await run('git remote add origin https://github.com/Biharkebahubali/CODE-BREAKER-BOT.git');
    await run('git fetch --all --prune');
    await run('git reset --hard origin/main');
    await run('git clean -fd');
    ensureTmpFolder();
    
    await sock.sendMessage(chatId, { text: '✅ Git setup ho gaya! Ab latest version pull kar raha hun...' }, { quoted: message });
}

async function updateViaGit() {
    await run('git fetch --all --prune');
    const newRev = (await run('git rev-parse origin/main')).trim();
    
    await run(`git reset --hard ${newRev}`);
    await run('git clean -fd');
    ensureTmpFolder();

    // 🔥 VERSION CHANGE REFLECT (cache clear)
    delete require.cache[require.resolve('../settings')];
    
    return newRev;
}

async function updateCommand(sock, chatId, message) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
    
    if (!message.key.fromMe && !isOwner) {
        await sock.sendMessage(chatId, { text: '❌ Sirf owner ya sudo use kar sakta hai' }, { quoted: message });
        return;
    }

    try {
        await sock.sendMessage(chatId, { text: '🔄 Updating the bot, please wait…' }, { quoted: message });

        ensureTmpFolder();

        if (!(await hasGitRepo())) {
            await setupGitRepo(sock, chatId, message);
        }

        const newRev = await updateViaGit();
        await run('npm install --no-audit --no-fund');

        // New version load karo (GitHub se aaya hua)
        const newVersion = require('../settings').version || `git-${newRev.substring(0,7)}`;

        await sock.sendMessage(chatId, { 
            text: `✅ Bot successfully updated!\nNew Version: ${newVersion}\n\nRestarting... .ping daal ke check kar lena` 
        }, { quoted: message });

        await run('pm2 restart all').catch(() => {});
        setTimeout(() => process.exit(1), 2000);

    } catch (err) {
        await sock.sendMessage(chatId, { 
            text: `❌ Update failed:\n${String(err.message).substring(0, 300)}` 
        }, { quoted: message });
    }
}

module.exports = updateCommand;e to flush.
    setTimeout(() => {
        process.exit(1);
    }, 3000);
}

async function updateCommand(sock, chatId, message, zipOverride) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
    
    if (!message.key.fromMe && !isOwner) {
        await sock.sendMessage(chatId, { text: 'Only bot owner or sudo can use .update' }, { quoted: message });
        return;
    }
    try {
        // Minimal UX
        await sock.sendMessage(chatId, { text: '🔄 Updating the bot, please wait…' }, { quoted: message });
        if (await hasGitRepo()) {
            // silent
            const { oldRev, newRev, alreadyUpToDate, commits, files } = await updateViaGit();
            // Short message only: version info
            const summary = alreadyUpToDate ? `✅ Already up to date: ${newRev}` : `✅ Updated to ${newRev}`;
            console.log('[update] summary generated');
            // silent
            await run('npm install --no-audit --no-fund');
        } else {
            const { copiedFiles } = await updateViaZip(sock, chatId, message, zipOverride);
            // silent
        }
        try {
            const v = require('../settings').version || '';
            await sock.sendMessage(chatId, { text: `✅ Update done. Restarting…` }, { quoted: message });
        } catch {
            await sock.sendMessage(chatId, { text: '✅ Restared Successfully\n Type .ping to check latest version.' }, { quoted: message });
        }
        await restartProcess(sock, chatId, message);
    } catch (err) {
        console.error('Update failed:', err);
        await sock.sendMessage(chatId, { text: `❌ Update failed:\n${String(err.message || err)}` }, { quoted: message });
    }
}

module.exports = updateCommand;


