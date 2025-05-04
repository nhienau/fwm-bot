const fs = require("node:fs");
const { CONFIG_FILE_PATH } = require("./constant");

function formatDate(date) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "numeric",
    hourCycle: "h23",
  }).format(date);
}

function commafy(num) {
  const str = num.toString().split(".");
  if (str[0].length >= 3) {
    str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, "$1,");
  }
  return str.join(".");
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isValidAmount(s) {
  return /^(?:\d+|\d+k)$/.test(s);
}

function isNumber(s) {
  return /^\d+$/.test(s);
}

function isValidEmail(s) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(s);
}

function getConfig(key) {
  const fileContent = fs.readFileSync(CONFIG_FILE_PATH);
  const config = JSON.parse(fileContent);
  return config[key];
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function updateResources(client) {
  const fileContent = fs.readFileSync("./assets/resourcesConfig.json");
  const config = JSON.parse(fileContent);

  config.forEach(async (cmd) => {
    const content = [];
    for (const channelId of cmd.channels) {
      const result = await fetchMessages(client, channelId);
      if (result.length === 0) {
        continue;
      } else {
        content.push(...result);
      }
    }
    const filePath = `./assets/${cmd.command}.json`;
    fs.writeFileSync(filePath, JSON.stringify(content));
  });
}

async function fetchMessages(client, channelId) {
  const channel = await client.channels.fetch(channelId);
  const messages = await channel.messages.fetch({ limit: 100 });
  return messages
    .filter((message) => !message.system)
    .map((message) => {
      const { content, attachments } = message;
      const attachmentEntries = Array.from(attachments.values());

      return attachmentEntries.length === 0
        ? { content }
        : attachmentEntries.map((att) => {
            const { attachment: url, size, contentType } = att;

            return {
              content,
              attachment: {
                url,
                size,
                contentType,
              },
            };
          });
    })
    .flat();
}

function getContentByTopic(keyword) {
  try {
    const filePath = `./assets/${keyword}.json`;
    const fileContent = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContent);
  } catch (e) {
    return null;
  }
}

module.exports = {
  formatDate,
  formatDateTime,
  commafy,
  random,
  isValidAmount,
  isNumber,
  isValidEmail,
  getConfig,
  addDays,
  updateResources,
  getContentByTopic,
};
