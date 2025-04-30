const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {
  EMBED_COLOR,
  LEADERBOARD_TITLE,
  DISCORD_SERVER_SHORT_URL,
} = require("../../utils/constant.js");
const { commafy, formatDateTime } = require("../../utils/helpers.js");
const { getTopBuyers } = require("../../services/apiUsers.js");

module.exports = {
  cooldown: 15,
  data: new SlashCommandBuilder()
    .setName("top")
    .setDescription("Bảng xếp hạng"),
  async execute(interaction) {
    await interaction.deferReply();
    const result = await getTopBuyers();

    const message = result
      .map(
        (b, index) =>
          `${index === 0 ? ":crown:" : `\`#${index + 1}\``}  <@${
            b.discord_uid
          }> ${commafy(b.total_amount)}₫`
      )
      .join("\n");

    const embed = new EmbedBuilder()
      .setTitle(LEADERBOARD_TITLE)
      .setColor(EMBED_COLOR)
      .setDescription(message)
      .setFooter({
        text: `${formatDateTime(new Date())} - ${DISCORD_SERVER_SHORT_URL}`,
      });
    await interaction.editReply({ embeds: [embed] });
  },
};
