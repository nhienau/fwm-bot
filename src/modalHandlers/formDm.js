const { EmbedBuilder } = require("discord.js");
const {
  EMBED_COLOR,
  INVALID_DISCORD_UID_MSG,
  EMBED_COLOR_SUCCESS,
  DISCORD_SERVER_URL,
  EMBED_COLOR_DANGER,
} = require("../utils/constant");
const { getConfig, formatDateTime } = require("../utils/helpers");

module.exports = async function (interaction) {
  const { message, client, channelId } = interaction;
  const {
    embeds: [messageEmbed],
  } = message;
  const avatarUrl = client.user.displayAvatarURL();

  const [userField] = messageEmbed.data.fields;
  const { value: userIdString } = userField;
  const userId = userIdString.slice(2, -1);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle("Hoàn tất đơn hàng");

  const itemName = interaction.fields.getTextInputValue("itemName");
  const username = interaction.fields.getTextInputValue("username");
  const password = interaction.fields.getTextInputValue("password");

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

  if (
    (username.trim().length > 0 && !password.trim().length) ||
    (!username.trim().length && password.trim().length > 0)
  ) {
    await interaction.reply({
      content: "Hãy nhập đủ tài khoản và mật khẩu (nếu có)",
      ephemeral: true,
    });
    return;
  }

  if (password.includes("`") || password.includes("|")) {
    await interaction.reply({
      content:
        "Không thể gửi tin nhắn kèm tài khoản vì mật khẩu có chứa kí tự gây lỗi format khi gửi tin nhắn đến người dùng ('`', '|'). Hãy bỏ trống tài khoản và mật khẩu, sau đó gửi riêng tài khoản đến người dùng sau.",
      ephemeral: true,
    });
    return;
  }

  const accountString =
    username.trim().length > 0 && password.trim().length > 0
      ? `**Tài khoản**\n` +
        `||\`${username.trim()}\`||\n` +
        `**Mật khẩu**\n` +
        `||\`${password}\`||\n\n`
      : "";

  const legitChannelId = getConfig("legitChannelId");

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
        accountString +
        `Để đảm bảo mọi quyền lợi bảo hành, hãy gửi 1 legit tại <#${legitChannelId}>.\n` +
        "Cám ơn bạn đã mua hàng tại FwM Store."
    )
    .setFooter({ text: formatDateTime(new Date()) });

  try {
    await user.send({ embeds: [dmEmbed] });
    embed
      .setColor(EMBED_COLOR_SUCCESS)
      .setDescription(`Tin nhắn đã được gửi đến <@${userId}>.`);
  } catch (err) {
    embed
      .setColor(EMBED_COLOR_DANGER)
      .setDescription(`Không thể gửi tin nhắn đến <@${userId}>.`);
  } finally {
    await message.edit({ embeds: [embed], components: [] });
    await interaction.reply({
      content: `Tin nhắn đã được gửi đến <@${userId}>.`,
      allowedMentions: {
        parse: ["roles"],
        roles: [],
      },
      ephemeral: true,
    });
  }
};
