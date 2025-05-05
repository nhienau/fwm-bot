// const { scheduleRenewalReminders } = require("../utils/renewalReminder");

// For development only
// Some orders won't be sent corresponding reminders if use !remind manually
// due to the timestamp this command is executed
module.exports = async function (message) {
  // const { client } = message;
  // if (client.reminders.length > 0) {
  //   client.reminders.forEach((task) => task.cronJob.stop());
  // }
  // await scheduleRenewalReminders(client);
};
