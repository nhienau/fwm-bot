const { Events } = require("discord.js");
const { formatDateTime } = require("../utils/helpers");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(
      `[${formatDateTime(new Date())}] ${client.user.tag} is online.`
    );
  },
};
