const { getOrders } = require("../services/apiOrders");
const { NO_ORDERS_FOUND_MSG } = require("../utils/constant");
const generatePaginatedEmbed = require("../utils/generatePaginatedEmbed");
const { formatDate, commafy } = require("../utils/helpers");

module.exports = async function (message) {
  async function fetchFn(pageNo) {
    const result = await getOrders(pageNo);
    const { data, totalElements } = result;

    const message =
      totalElements === 0
        ? NO_ORDERS_FOUND_MSG
        : data
            .map(
              (o) =>
                `\`${o.id}\` \`${formatDate(new Date(o.created_at))}\` <@${
                  o.user.discord_uid
                }> **${o.item_name}** ${commafy(o.amount)}₫`
            )
            .join("\n");
    return { result, message };
  }

  await generatePaginatedEmbed(message, fetchFn);
};
