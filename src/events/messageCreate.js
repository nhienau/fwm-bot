const { Events, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    const content = message.content.trim().toLowerCase();
    if (!content.startsWith("!")) return;

    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      if (!content.startsWith("!info")) return;
    }

    const commandName = content.slice(1).split(" ")[0];

    const { client } = message;
    const handler = client.messageHandlers.get(commandName);

    if (!handler) return;

    try {
      await handler(message);
    } catch (e) {
      console.error(e);
    }
  },
};
