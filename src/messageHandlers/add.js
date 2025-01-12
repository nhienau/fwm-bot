const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} = require("discord.js");
const { addOrder } = require("../services/apiOrders");
const { getUserTotalAmount } = require("../services/apiUsers");
const {
  isValidAmount,
  commafy,
  formatDateTime,
  getConfig,
} = require("../utils/helpers");
const {
  EMBED_COLOR,
  EMBED_COLOR_DANGER,
  EMBED_COLOR_SUCCESS,
  INTERACTION_VALID_TIME,
  INTERACTION_INACTIVE_MSG,
  INTERACTION_NOT_ALLOWED_MSG,
  MISSING_ARGS_MSG,
  INVALID_DISCORD_UID_MSG,
  BUYER_ROLE_ID_NOT_FOUND_MSG,
  RICH_BUYER_ROLE_ID_NOT_FOUND_MSG,
} = require("../utils/constant");
const { addRole } = require("../utils/role");

module.exports = async function (message) {
  // Extract neccessary message info
  const {
    author: { id: senderId },
    client,
    channelId,
    guildId,
    content: messageContent,
  } = message;
  const channel = client.channels.cache.get(channelId);
  const guild = client.guilds.cache.get(guildId);

  const embed = new EmbedBuilder().setTitle("Thêm đơn hàng mới");

  const instruction =
    `Các tham số: [ID] [Số tiền] [Tên mặt hàng]\n` +
    `ID: ID Discord của người mua\n` +
    `Số tiền (ví dụ: 30000 hoặc 30k)\n` +
    `Ví dụ: \`!add 123123123123123123 80000 Nitro 1 tháng\`\n` +
    `Ví dụ: \`!add 123123123123123123 80k YouTube Premium 1 tháng\``;

  // Extract message args
  const args = messageContent
    .trim()
    .split(" ")
    .slice(1)
    .filter((word) => word !== "");

  // Validation
  if (args.length < 3) {
    embed
      .setColor(EMBED_COLOR_DANGER)
      .setDescription(`**${MISSING_ARGS_MSG}**\n` + instruction);
    channel.send({ embeds: [embed] });
    return;
  }
  const [userId, amountStr, ...itemNameArr] = args;

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

  if (!isValidAmount(amountStr)) {
    embed
      .setColor(EMBED_COLOR_DANGER)
      .setDescription(
        `**Số tiền không hợp lệ (\`${amountStr}\`).**\n` + instruction
      );
    channel.send({ embeds: [embed] });
    return;
  }

  // Parse arguments
  const amount = amountStr.endsWith("k")
    ? parseInt(amountStr) * 1000
    : parseInt(amountStr);

  const itemName = itemNameArr.join(" ");

  // Create confirmation embed
  let description =
    `Người dùng: <@${userId}>\n` +
    `Mặt hàng: ${itemName}\n` +
    `Số tiền: ${commafy(amount)}₫\n`;

  embed.setColor(EMBED_COLOR).setDescription(description);

  const btnConfirm = new ButtonBuilder()
    .setCustomId("proceed")
    .setLabel("Xác nhận")
    .setStyle(ButtonStyle.Primary);
  const btnCancel = new ButtonBuilder()
    .setCustomId("cancel")
    .setLabel("Huỷ")
    .setStyle(ButtonStyle.Secondary);

  const actionRow = new ActionRowBuilder().addComponents(btnConfirm, btnCancel);

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
        ephemeral: true,
      });
      return;
    }
    await i.deferUpdate();

    btnConfirm.setDisabled(true);
    btnCancel.setDisabled(true);

    if (i.customId === "cancel") {
      description = "Yêu cầu thêm đơn hàng đã được huỷ bỏ.";
      embed.setDescription(description);
      await response.edit({ embeds: [embed], components: [actionRow] });
      return;
    }

    // Add order, edit message
    let id;
    try {
      const result = await addOrder(userId, itemName, amount);
      description =
        `Người dùng: <@${userId}>\n` +
        `Mặt hàng: ${result.item_name}\n` +
        `Số tiền: ${commafy(result.amount)}₫\n` +
        `Thời gian: ${formatDateTime(new Date(result.created_at))}\n\n` +
        ":white_check_mark: **Thêm đơn hàng mới thành công**";
      embed.setColor(EMBED_COLOR_SUCCESS);
      id = result.user_id;
    } catch (err) {
      description =
        "Có lỗi xảy ra khi thêm một đơn hàng mới, vui lòng thử lại.";
      embed.setColor(EMBED_COLOR_DANGER);
      return;
    } finally {
      embed.setDescription(description);
      await response.edit({ embeds: [embed], components: [actionRow] });
    }

    // Check if user is a guild member
    let cachedMember, member;
    try {
      cachedMember = await guild.members.fetch(userId);
      member = await cachedMember.fetch();
    } catch (err) {
      description +=
        "\n" +
        `:information_source: **<@${userId}> không phải là thành viên của server, không thêm role.**`;
      embed.setDescription(description);
      await response.edit({ embeds: [embed], components: [actionRow] });
      return;
    }
    // Add buyer role
    try {
      const buyerRoleId = getConfig("buyerRoleId");
      if (!buyerRoleId) {
        throw new Error(BUYER_ROLE_ID_NOT_FOUND_MSG);
      }

      const added = await addRole(message.guild, member, buyerRoleId, "buyer");
      if (added) {
        description +=
          "\n" + `:tada: **<@${userId}> đã trở thành <@&${buyerRoleId}>**`;
      }
    } catch (err) {
      description += "\n" + `:cross_mark: **${err.message}**`;
    } finally {
      embed.setDescription(description);
      await response.edit({ embeds: [embed], components: [actionRow] });
    }

    // Add rich buyer role
    try {
      const { total_amount: totalAmount } = await getUserTotalAmount(id);
      if (totalAmount < 300000) return;

      const richBuyerRoleId = getConfig("richBuyerRoleId");
      if (!richBuyerRoleId) {
        throw new Error(RICH_BUYER_ROLE_ID_NOT_FOUND_MSG);
      }

      const added = await addRole(
        message.guild,
        member,
        richBuyerRoleId,
        "rich buyer"
      );
      if (added) {
        description +=
          "\n" + `:tada: **<@${userId}> đã trở thành <@&${richBuyerRoleId}>**`;
      }
    } catch (err) {
      description += "\n" + `:cross_mark: **${err.message}**`;
    } finally {
      embed.setDescription(description);
      await response.edit({ embeds: [embed], components: [actionRow] });
    }
  });

  collector.on("end", async () => {
    await response.edit(INTERACTION_INACTIVE_MSG);
  });
};
