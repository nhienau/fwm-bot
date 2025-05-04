const { Events } = require("discord.js");
const cron = require("cron");
const { formatDateTime, updateResources } = require("../utils/helpers");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(
      `[${formatDateTime(new Date())}] ${client.user.tag} is online.`
    );

    client.updateResources = cron.CronJob.from({
      cronTime: "0 30 7,19 * * *",
      onTick: updateResources.bind(null, client),
      start: true,
      timeZone: "Asia/Bangkok",
    });
  },
};
