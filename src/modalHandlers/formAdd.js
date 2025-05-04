const { EmbedBuilder } = require("discord.js");
const { addOrder } = require("../services/apiOrders");
const { getUserTotalAmount } = require("../services/apiUsers");
const {
  EMBED_COLOR,
  INVALID_DISCORD_UID_MSG,
  EMBED_COLOR_SUCCESS,
  EMBED_COLOR_DANGER,
  BUYER_ROLE_ID_NOT_FOUND_MSG,
  RICH_BUYER_ROLE_ID_NOT_FOUND_MSG,
} = require("../utils/constant");
const {
  getConfig,
  formatDateTime,
  isValidAmount,
  isNumber,
  addDays,
  commafy,
  isValidEmail,
} = require("../utils/helpers");
const { addRole } = require("../utils/role");

module.exports = async function (interaction) {
  const { message, client, guildId } = interaction;
  const {
    embeds: [messageEmbed],
  } = message;
  const guild = client.guilds.cache.get(guildId);

  const [userField] = messageEmbed.data.fields;
  const { value: userIdString } = userField;
  const userId = userIdString.slice(2, -1);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle("Thêm đơn hàng mới");

  const itemNameValue = interaction.fields.getTextInputValue("itemName");
  const platformValue = interaction.fields.getTextInputValue("platform");
  const amountValue = interaction.fields.getTextInputValue("amount");
  const daysValue = interaction.fields.getTextInputValue("days");
  const emailValue = interaction.fields.getTextInputValue("email");

  // Check if user exists
  let user;
  try {
    user = await client.users.fetch(userId);
  } catch (err) {
    await interaction.reply({
      content: `${INVALID_DISCORD_UID_MSG} (${userId}).`,
      ephemeral: true,
    });
    return;
  }

  if (!isValidAmount(amountValue)) {
    await interaction.reply({
      content: `Số tiền không hợp lệ (\`${amountValue}\`).`,
      ephemeral: true,
    });
    return;
  }
  if (daysValue.trim().length > 0 && !isNumber(daysValue.trim())) {
    await interaction.reply({
      content: `Số ngày không hợp lệ (\`${daysValue}\`).`,
      ephemeral: true,
    });
    return;
  }
  if (emailValue.trim().length > 0 && !isValidEmail(emailValue.trim())) {
    await interaction.reply({
      content: `Email không hợp lệ (\`${emailValue}\`).`,
      ephemeral: true,
    });
    return;
  }

  // Parse arguments
  const amount = amountValue.endsWith("k")
    ? parseInt(amountValue) * 1000
    : parseInt(amountValue);
  const days = daysValue.trim().length > 0 ? parseInt(daysValue.trim()) : 0;
  const email = emailValue.trim() || null;

  const order = {
    itemName: itemNameValue.trim(),
    amount,
    ...(platformValue && { platform: platformValue.trim().toLowerCase() }),
    expiresAt: days > 0 ? addDays(Date.now(), days) : null,
    email,
  };

  // Add order, edit message
  let id;
  try {
    const result = await addOrder(userId, order);
    description =
      `Người dùng: <@${userId}>\n` +
      `Mặt hàng: ${result.item_name}\n` +
      `Số tiền: ${commafy(result.amount)}₫\n` +
      `${
        result.expires_at
          ? `Ngày hết hạn: ${formatDateTime(new Date(result.expires_at))}\n`
          : ""
      }` +
      "\n" +
      ":white_check_mark: **Thêm đơn hàng mới thành công**";
    embed.setColor(EMBED_COLOR_SUCCESS);
    id = result.user_id;
    await interaction.reply("Thêm đơn hàng mới thành công.");
  } catch (err) {
    description = "Có lỗi xảy ra khi thêm một đơn hàng mới, vui lòng thử lại.";
    embed.setColor(EMBED_COLOR_DANGER);
    await interaction.reply(description);
    return;
  } finally {
    embed.setDescription(description);
    await message.edit({ embeds: [embed], components: [] });
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
    await message.edit({ embeds: [embed], components: [] });
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
    await message.edit({ embeds: [embed], components: [] });
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
    await message.edit({ embeds: [embed], components: [] });
  }
};
