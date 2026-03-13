// Yeh function har incoming message pe automatically run hoga
async function autoNewsletterDetector(sock, message, chatId) {
    try {
        if (!message?.message) return;

        const msg = message.message;

        const mediaTypes = [
            msg.imageMessage,
            msg.videoMessage,
            msg.documentMessage,
            msg.extendedTextMessage,
            msg.conversation
        ];

        for (const media of mediaTypes) {

            const info = media?.contextInfo?.forwardedNewsletterMessageInfo;

            if (info) {

                const newsletterJid = info.newsletterJid;
                const newsletterName = info.newsletterName || "Unknown Channel";

                const response =
`╭─━━━━━━━━━━━━─╮
│  📢 *CHANNEL DETECTED*
╰─━━━━━━━━━━━━─╯

📌 *Channel:* ${newsletterName}
🆔 *Newsletter ID:* \`${newsletterJid}\`

🔗 *Link:*
https://whatsapp.com/channel/${newsletterJid.split("@")[0]}

🤖 _Auto detected by Bot_`;

                await sock.sendMessage(
                    chatId,
                    { text: response },
                    { quoted: message }
                );

                return;
            }
        }

    } catch (error) {
        console.log("Auto Newsletter Error:", error);
    }
}