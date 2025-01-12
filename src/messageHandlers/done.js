const { EmbedBuilder } = require("discord.js");
const {
  EMBED_COLOR_DANGER,
  EMBED_COLOR,
  EMBED_COLOR_SUCCESS,
  MISSING_ARGS_MSG,
  INVALID_DISCORD_UID_MSG,
  DISCORD_SERVER_URL,
  DELETE_MESSAGE_DELAY,
} = require("../utils/constant");
const { getConfig, formatDateTime } = require("../utils/helpers");

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

  const { client, channelId, content: messageContent } = message;
  const channel = client.channels.cache.get(channelId);
  const avatarUrl = client.user.displayAvatarURL();

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle("Hoàn tất đơn hàng");

  const instruction =
    `Tham số: [ID] [Tên mặt hàng]\n` +
    `ID: ID Discord của người mua\n` +
    `Ví dụ: \`!done 123123123123123123 Nitro 1 tháng\``;

  const args = messageContent
    .trim()
    .split(" ")
    .slice(1)
    .filter((word) => word !== "");

  // Validation
  if (args.length < 2) {
    await sendEmbed({
      embed,
      content: `**${MISSING_ARGS_MSG}**\n` + instruction,
      color: EMBED_COLOR_DANGER,
      channel,
    });
    await deleteOriginalMessage(message);
    return;
  }

  const [userId, ...itemNameArr] = args;

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

  const itemName = itemNameArr.join(" ");

  const dmEmbed = new EmbedBuilder()
    .setColor(EMBED_COLOR_SUCCESS)
    .setAuthor({
      name: "FwM Store",
      iconURL: avatarUrl,
      url: DISCORD_SERVER_URL,
    })
    .setTitle("Đơn hàng tại FwM Store của bạn đã hoàn tất.")
    .setDescription(
      `Mặt hàng: **${itemName}**\n` +
        `Ticket: <#${channelId}>\n\n` +
        `Nếu bạn cảm thấy hài lòng với dịch vụ của chúng tôi, hãy gửi 1 legit tại <#${legitChannelId}>.\n` +
        "Cám ơn bạn đã mua hàng tại FwM Store."
    )
    .setFooter({ text: formatDateTime(new Date()) });
  try {
    await user.send({ embeds: [dmEmbed] });

    await sendEmbed({
      embed,
      content: `Tin nhắn đã được gửi đến <@${userId}>.`,
      color: EMBED_COLOR_SUCCESS,
      channel,
    });
    await deleteOriginalMessage(message);
  } catch (err) {
    await sendEmbed({
      embed,
      content: `Không thể gửi tin nhắn đến <@${userId}>.`,
      color: EMBED_COLOR_DANGER,
      channel,
    });
    await deleteOriginalMessage(message);
  }
};
