const fs = require("node:fs");
const { formatDateTime } = require("../utils/helpers");

module.exports = async function (message) {
  const { client, content: messageContent } = message;

  const args = messageContent
    .trim()
    .toLowerCase()
    .split(" ")
    .slice(1)
    .filter((word) => word !== "");
  if (args.length < 3) {
    console.log(
      `[${formatDateTime(
        new Date()
      )}] !updatecfg: Missing argument, required 3 arguments: [command] [add/remove] [channelId]`
    );
    return;
  }

  // [command] [add/remove] [channelId]
  const [command, action, channelId] = args;
  if (action !== "add" && action !== "remove") {
    console.log(
      `[${formatDateTime(
        new Date()
      )}] !updatecfg: Invalid action, should be either "add"/"remove"`
    );
    return;
  }
  try {
    const channel = await client.channels.fetch(channelId);
    const fileContent = fs.readFileSync("./assets/resourcesConfig.json");
    const config = JSON.parse(fileContent);

    const commandConfig = config.find((cmd) => cmd.command === command);
    if (action === "add") {
      if (!commandConfig) {
        config.push({
          command,
          channels: [channelId],
        });
      } else {
        if (!commandConfig.channels.includes(channelId)) {
          commandConfig.channels.push(channelId);
        }
      }
    } else {
      // Remove
      if (commandConfig) {
        commandConfig.channels = commandConfig.channels.filter(
          (id) => id !== channelId
        );
        if (commandConfig.channels.length === 0) {
          config = config.filter((cmd) => cmd.command !== command);
        }
      }
    }
    const filePath = `./assets/resourcesConfig.json`;
    try {
      fs.writeFileSync(filePath, JSON.stringify(config));
    } catch (e) {
      console.error(e);
    }
  } catch (e) {
    console.log(
      `[${formatDateTime(new Date())}] !updatecfg: Channel ID not found`
    );
    return;
  }
};
