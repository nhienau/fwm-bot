const { SlashCommandBuilder } = require("discord.js");
const { getOrdersByPlatformAndEmail } = require("../../services/apiOrders.js");
const generatePaginatedEmbed = require("../../utils/generatePaginatedEmbed.js");
const { NO_ORDERS_FOUND_MSG } = require("../../utils/constant.js");
const {
  formatDate,
  commafy,
  formatDateTime,
  isValidEmail,
} = require("../../utils/helpers.js");

module.exports = {
  cooldown: 15,
  data: new SlashCommandBuilder()
    .setName("check")
    .setDescription("Kiểm tra thời hạn sử dụng")
    .addStringOption((option) =>
      option
        .setName("platform")
        .setDescription("Nền tảng")
        .setRequired(true)
        .addChoices(
          { name: "YouTube", value: "youtube" },
          { name: "Netflix", value: "netflix" },
          { name: "Adobe", value: "adobe" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("email")
        .setDescription("Email đăng nhập")
        .setRequired(false)
    ),
  async execute(interaction) {
    const platform = interaction.options.getString("platform");
    const emailValue = interaction.options.getString("email");
    if (emailValue != null && !isValidEmail(emailValue.trim())) {
      await interaction.reply({
        content: `Email không hợp lệ (\`${emailValue}\`)`,
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    const {
      user: { id },
    } = interaction;

    async function fetchFn(pageNo) {
      const result = await getOrdersByPlatformAndEmail(
        { id, platform, ...(emailValue && { email: emailValue.trim() }) },
        pageNo
      );
      const { data, totalElements } = result;
      const now = Date.now();
      let message =
        "Kiểm tra thời hạn sử dụng\n" + `Nền tảng: \`${platform}\`\n`;
      message +=
        emailValue != null ? `Email: \`${emailValue.trim()}\`\n\n` : "\n";

      message +=
        totalElements === 0
          ? NO_ORDERS_FOUND_MSG
          : data
              .map((o) => {
                const expireTimestamp = new Date(o.expires_at);
                const expired = expireTimestamp.getTime() < now;
                return (
                  `\`${formatDate(new Date(o.created_at))}\` **${
                    o.item_name
                  }** ${commafy(o.amount)}₫\n` +
                  `HSD: ${formatDateTime(new Date(o.expires_at))} ${
                    expired ? " (Hết hạn)" : ""
                  }`
                );
              })
              .join("\n");

      return { result, message };
    }
    await generatePaginatedEmbed(interaction, fetchFn);
  },
};
