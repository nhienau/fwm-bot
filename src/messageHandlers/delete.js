const { EmbedBuilder } = require("discord.js");
const { deleteOrder } = require("../services/apiOrders");
const {
  EMBED_COLOR,
  EMBED_COLOR_DANGER,
  EMBED_COLOR_SUCCESS,
  MISSING_ARGS_MSG,
  BUYER_ROLE_ID_NOT_FOUND_MSG,
  RICH_BUYER_ROLE_ID_NOT_FOUND_MSG,
} = require("../utils/constant");
const { commafy, formatDateTime, getConfig } = require("../utils/helpers");
const { removeRole } = require("../utils/role");
const { getUserTotalAmount } = require("../services/apiUsers");

module.exports = async function (message) {
  const { client, channelId, guildId, content: messageContent } = message;
  const channel = client.channels.cache.get(channelId);
  const guild = client.guilds.cache.get(guildId);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle("Xoá đơn hàng");

  const instruction =
    `Tham số: [mã đơn hàng]\n` +
    `Tra cứu mã đơn hàng bằng \`!list\`\n` +
    `Ví dụ: \`!delete 23\``;

  // Extract message args
  const args = messageContent
    .trim()
    .split(" ")
    .slice(1)
    .filter((word) => word !== "");

  // Validation
  if (args.length === 0) {
    embed
      .setColor(EMBED_COLOR_DANGER)
      .setDescription(`**${MISSING_ARGS_MSG}**\n` + instruction);
    await channel.send({ embeds: [embed] });
    return;
  }

  if (!isFinite(args[0])) {
    embed
      .setColor(EMBED_COLOR_DANGER)
      .setDescription(
        `**Mã đơn hàng không hợp lệ (\`${args[0]}\`)**\n` + instruction
      );
    await channel.send({ embeds: [embed] });
    return;
  }

  const id = parseInt(args[0]);
  let description = "";
  let discordUserId, userId, response;
  try {
    const order = await deleteOrder(id);
    if (!order) {
      description = `Không tìm thấy đơn hàng \`${id}\``;
      return;
    }

    const {
      item_name,
      amount,
      created_at,
      user: { id: uid, discord_uid },
    } = order;
    description =
      `Người dùng: <@${discord_uid}>\n` +
      `Mặt hàng: ${item_name}\n` +
      `Số tiền: ${commafy(amount)}₫\n` +
      `Thời gian: ${formatDateTime(new Date(created_at))}\n\n` +
      ":white_check_mark: **Xoá đơn hàng thành công**";
    discordUserId = discord_uid;
    userId = uid;
    embed.setColor(EMBED_COLOR_SUCCESS);
  } catch (err) {
    embed.setColor(EMBED_COLOR_DANGER);
    description = "Có lỗi xảy ra khi xoá đơn hàng, vui lòng thử lại.";
    return;
  } finally {
    embed.setDescription(description);
    response = await channel.send({ embeds: [embed] });
  }

  // Check if user exists
  try {
    await client.users.fetch(discordUserId);
  } catch (err) {
    return;
  }

  // Check if user is a guild member
  let cachedMember, member;
  try {
    cachedMember = await guild.members.fetch(discordUserId);
    member = await cachedMember.fetch();
  } catch (err) {
    description +=
      "\n" +
      `:information_source: **<@${discordUserId}> không phải là thành viên của server, không xoá role.**`;
    embed.setDescription(description);
    await response.edit({ embeds: [embed] });
    return;
  }

  try {
    const { total_amount: totalAmount } = await getUserTotalAmount(userId);
    if (totalAmount >= 300000) return;
    if (totalAmount >= 0 && totalAmount < 300000) {
      const richBuyerRoleId = getConfig("richBuyerRoleId");
      if (!richBuyerRoleId) {
        throw new Error(RICH_BUYER_ROLE_ID_NOT_FOUND_MSG);
      }

      const removed = await removeRole(message.guild, member, richBuyerRoleId);
      if (removed) {
        description +=
          "\n" +
          `:information_source: **<@${discordUserId}> không còn là <@&${richBuyerRoleId}>**`;
      }
    }
    if (totalAmount === 0) {
      const buyerRoleId = getConfig("buyerRoleId");
      if (!buyerRoleId) {
        throw new Error(BUYER_ROLE_ID_NOT_FOUND_MSG);
      }

      const removed = await removeRole(message.guild, member, buyerRoleId);
      if (removed) {
        description +=
          "\n" +
          `:information_source: **<@${discordUserId}> không còn là <@&${buyerRoleId}>**`;
      }
    }
  } catch (err) {
    description += "\n" + `:cross_mark: **${err.message}**`;
  } finally {
    embed.setDescription(description);
    await response.edit({ embeds: [embed] });
  }
};
