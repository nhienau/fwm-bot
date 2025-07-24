const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require("discord.js");
const {
  EMBED_COLOR,
  EMBED_COLOR_DANGER,
  INTERACTION_VALID_TIME,
  INTERACTION_INACTIVE_MSG,
  INTERACTION_NOT_ALLOWED_MSG,
  MISSING_ARGS_MSG,
  INVALID_DISCORD_UID_MSG,
} = require("../utils/constant");

module.exports = async function (message) {
  // Extract neccessary message info
  const {
    author: { id: senderId },
    client,
    channelId,
    content: messageContent,
  } = message;
  const channel = client.channels.cache.get(channelId);

  const embed = new EmbedBuilder().setTitle("Thêm đơn hàng mới");

  const instruction =
    `Các tham số: [ID]\n` +
    `ID: ID Discord của người mua\n` +
    `Ví dụ: \`!add 123123123123123123\``;

  // Extract message args
  const args = messageContent
    .trim()
    .split(" ")
    .slice(1)
    .filter((word) => word !== "");

  // Validation
  if (args.length < 1) {
    embed
      .setColor(EMBED_COLOR_DANGER)
      .setDescription(`**${MISSING_ARGS_MSG}**\n` + instruction);
    channel.send({ embeds: [embed] });
    return;
  }
  const [userId] = args;

  // Check if user exists
  try {
    await client.users.fetch(userId);
  } catch (err) {
    embed
      .setColor(EMBED_COLOR_DANGER)
      .setDescription(
        `**${INVALID_DISCORD_UID_MSG} (${userId}).**\n` + instruction
      );
    channel.send({ embeds: [embed] });
    return;
  }

  embed
    .setColor(EMBED_COLOR)
    .addFields({ name: "Người dùng", value: `<@${userId}>` });

  const btnModal = new ButtonBuilder()
    .setCustomId("continue")
    .setLabel("Tiếp tục")
    .setStyle(ButtonStyle.Primary);
  const btnCancel = new ButtonBuilder()
    .setCustomId("cancel")
    .setLabel("Huỷ")
    .setStyle(ButtonStyle.Secondary);

  const actionRow = new ActionRowBuilder().addComponents(btnModal, btnCancel);

  // Send embed and listen to action
  const response = await channel.send({
    embeds: [embed],
    components: [actionRow],
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: INTERACTION_VALID_TIME,
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== senderId) {
      await i.reply({
        content: INTERACTION_NOT_ALLOWED_MSG,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (i.customId === "cancel") {
      await i.deferUpdate();

      btnModal.setDisabled(true);
      btnCancel.setDisabled(true);

      const description = "Yêu cầu thêm đơn hàng đã được huỷ bỏ.";
      embed.setDescription(description);
      await response.edit({ embeds: [embed], components: [actionRow] });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId("formAdd")
      .setTitle("Thông tin đơn hàng");

    const inputItemName = new TextInputBuilder()
      .setCustomId("itemName")
      .setLabel("Tên mặt hàng")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    const inputPlatform = new TextInputBuilder()
      .setCustomId("platform")
      .setLabel("Tên nền tảng (ví dụ: youtube, netflix)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);
    const inputAmount = new TextInputBuilder()
      .setCustomId("amount")
      .setLabel("Số tiền (ví dụ: 30000, 30k)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    const inputDaysOfUse = new TextInputBuilder()
      .setCustomId("days")
      .setLabel("Số ngày sử dụng (ví dụ: 7, 30, 60, 180, 365)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);
    const inputEmail = new TextInputBuilder()
      .setCustomId("email")
      .setLabel("Email")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const actionRowItemName = new ActionRowBuilder().addComponents(
      inputItemName
    );
    const actionRowPlatform = new ActionRowBuilder().addComponents(
      inputPlatform
    );
    const actionRowAmount = new ActionRowBuilder().addComponents(inputAmount);
    const actionRowDaysOfUse = new ActionRowBuilder().addComponents(
      inputDaysOfUse
    );
    const actionRowEmail = new ActionRowBuilder().addComponents(inputEmail);

    modal.addComponents(
      actionRowItemName,
      actionRowPlatform,
      actionRowAmount,
      actionRowDaysOfUse,
      actionRowEmail
    );

    await i.showModal(modal);
  });

  collector.on("end", async () => {
    try {
      await response.edit(INTERACTION_INACTIVE_MSG);
    } catch (err) {
      if (err.code === 10008) return;
      console.error(err);
    }
  });
};
