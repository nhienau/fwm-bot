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
const { getConfig } = require("../utils/helpers");
const {
  EMBED_COLOR,
  EMBED_COLOR_DANGER,
  INTERACTION_VALID_TIME,
  INTERACTION_INACTIVE_MSG,
  INTERACTION_NOT_ALLOWED_MSG,
  MISSING_ARGS_MSG,
  INVALID_DISCORD_UID_MSG,
  DELETE_MESSAGE_DELAY,
} = require("../utils/constant");

module.exports = async function (message) {
  async function sendEmbed({ embed, content, color, channel }) {
    embed.setColor(color).setDescription(content);
    await channel.send({ embeds: [embed] });
  }

  async function deleteOriginalMessage(message) {
    setTimeout(async () => {
      await message.delete();
    }, DELETE_MESSAGE_DELAY);
  }

  const {
    author: { id: senderId },
    client,
    channelId,
    content: messageContent,
  } = message;
  const channel = client.channels.cache.get(channelId);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle("Hoàn tất đơn hàng");

  const instruction =
    `Tham số: [ID]\n` +
    `ID: ID Discord của người mua\n` +
    `Ví dụ: \`!done 123123123123123123\``;

  const args = messageContent
    .trim()
    .split(" ")
    .slice(1)
    .filter((word) => word !== "");

  // Validation
  if (args.length < 1) {
    await sendEmbed({
      embed,
      content: `**${MISSING_ARGS_MSG}**\n` + instruction,
      color: EMBED_COLOR_DANGER,
      channel,
    });
    await deleteOriginalMessage(message);
    return;
  }

  const [userId] = args;

  // Check if user exists
  let user;
  try {
    user = await client.users.fetch(userId);
  } catch (err) {
    await sendEmbed({
      embed,
      content: `**${INVALID_DISCORD_UID_MSG} (${userId}).**\n` + instruction,
      color: EMBED_COLOR_DANGER,
      channel,
    });
    await deleteOriginalMessage(message);
    return;
  }

  const legitChannelId = getConfig("legitChannelId");
  if (!legitChannelId) {
    embed
      .setColor(EMBED_COLOR_DANGER)
      .setDescription("Chưa chỉ định kênh legit.");
    await channel.send({ embeds: [embed] });
    return;
  }

  try {
    await message.guild.channels.fetch(legitChannelId);
  } catch (err) {
    embed
      .setColor(EMBED_COLOR_DANGER)
      .setDescription("Không tìm thấy kênh legit.");
    await channel.send({ embeds: [embed] });
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

      description = "Yêu cầu hoàn tất đơn hàng đã được huỷ bỏ.";
      embed.setDescription(description);
      await response.edit({ embeds: [embed], components: [actionRow] });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId("formDm")
      .setTitle("Thông tin đơn hàng");

    const inputItemName = new TextInputBuilder()
      .setCustomId("itemName")
      .setLabel("Tên mặt hàng")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    const inputUsername = new TextInputBuilder()
      .setCustomId("username")
      .setLabel("Tài khoản")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);
    const inputPassword = new TextInputBuilder()
      .setCustomId("password")
      .setLabel("Mật khẩu")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const actionRowItemName = new ActionRowBuilder().addComponents(
      inputItemName
    );
    const actionRowUsername = new ActionRowBuilder().addComponents(
      inputUsername
    );
    const actionRowPassword = new ActionRowBuilder().addComponents(
      inputPassword
    );

    modal.addComponents(
      actionRowItemName,
      actionRowUsername,
      actionRowPassword
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
