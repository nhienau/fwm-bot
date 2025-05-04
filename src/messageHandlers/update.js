const { updateResources } = require("../utils/helpers");

module.exports = async function (message) {
  const { client } = message;
  updateResources(client);
};
