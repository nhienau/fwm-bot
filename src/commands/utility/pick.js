const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { random } = require("../../utils/helpers");

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("pick")
    .setDescription("Pick")
    .addStringOption((option) =>
      option
        .setName("choices")
        .setDescription('Các lựa chọn, ngăn cách bằng dấu phẩy (",")')
        .setMaxLength(200)
        .setRequired(true)
    ),
  async execute(interaction) {
    const message = interaction.options.getString("choices");
    const choices = message.split(",").filter((c) => c.trim() !== "");
    if (choices.length === 0) {
      await interaction.reply({
        content: "Các lựa chọn không hợp lệ",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const randomIndex = random(0, choices.length - 1);
    await interaction.reply(choices[randomIndex].trim());
  },
};
