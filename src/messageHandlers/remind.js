const { scheduleRenewalReminders } = require("../utils/renewalReminder");

module.exports = async function (message) {
  const { client } = message;
  if (client.reminders.length > 0) {
    client.reminders.forEach((task) => task.cronJob.stop());
  }
  await scheduleRenewalReminders(client);
};
