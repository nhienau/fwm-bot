const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { getOrdersByDiscordUserId } = require("../../services/apiOrders.js");
const generatePaginatedEmbed = require("../../utils/generatePaginatedEmbed.js");
const { NO_ORDERS_FOUND_MSG } = require("../../utils/constant.js");
const { formatDate, commafy } = require("../../utils/helpers.js");

module.exports = {
  cooldown: 15,
  data: new SlashCommandBuilder()
    .setName("history")
    .setDescription("Lịch sử mua hàng"),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const {
      user: { id },
    } = interaction;

    async function fetchFn(pageNo) {
      const result = await getOrdersByDiscordUserId(id, pageNo);
      const { data, totalElements } = result;

      const message =
        totalElements === 0
          ? NO_ORDERS_FOUND_MSG
          : data
              .map(
                (o) =>
                  `\`${formatDate(new Date(o.created_at))}\` **${
                    o.item_name
                  }** ${commafy(o.amount)}₫`
              )
              .join("\n");
      return { result, message };
    }

    await generatePaginatedEmbed(interaction, fetchFn);
  },
};
