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

function getConfig(key) {
  const fileContent = fs.readFileSync(CONFIG_FILE_PATH);
  const config = JSON.parse(fileContent);
  return config[key];
}

module.exports = {
  formatDate,
  formatDateTime,
  commafy,
  random,
  isValidAmount,
  getConfig,
};
