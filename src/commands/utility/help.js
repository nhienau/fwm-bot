const {
  EmbedBuilder,
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");
const { LIST_COMMANDS, EMBED_COLOR } = require("../../utils/constant.js");

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Danh sách các lệnh"),
  async execute(interaction) {
    const message = LIST_COMMANDS.map(
      (command) => `\`/${command.name}\` - ${command.description}\n`
    ).join("");
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setDescription(message);
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
