const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ BOT CONNECTÉ À WHATSAPP !");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log("❌ Connexion fermée.");

      if (shouldReconnect) {
        startBot();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const command = text.trim().toLowerCase();

    if (command === "/ping") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🏓 Pong ! Le bot fonctionne."
      });
    }

    if (command === "/menu") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
`🤖 *MENU DU BOT*

/ping — Tester le bot
/menu — Afficher le menu
/help — Aide

🚧 D'autres commandes seront ajoutées bientôt.`
      });
    }

    if (command === "/help") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "ℹ️ Utilise /menu pour voir les commandes disponibles."
      });
    }
  });
}

startBot();
