const { Events } = require("discord.js");
const cron = require("cron");
const { formatDateTime, updateResources } = require("../utils/helpers");
const { scheduleRenewalReminders } = require("../utils/renewalReminder");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.updateResources = cron.CronJob.from({
      cronTime: "0 30 7,19 * * *",
      onTick: updateResources.bind(null, client),
      start: true,
      timeZone: "Asia/Bangkok",
    });

    client.scheduleRenewalReminders = cron.CronJob.from({
      cronTime: "0 0 7 * * *",
      onTick: scheduleRenewalReminders.bind(null, client),
      start: true,
      timeZone: "Asia/Bangkok",
    });

    console.log(
      `[${formatDateTime(new Date())}] ${client.user.tag} is online.`
    );
  },
};
