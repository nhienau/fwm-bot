const { EmbedBuilder } = require("@discordjs/builders");
const { formatDateTime, getContentByTopic } = require("../utils/helpers");
const { AttachmentBuilder } = require("discord.js");
const { EMBED_COLOR_DANGER, EMBED_COLOR } = require("../utils/constant");

module.exports = async function (message) {
  const {
    member: { user },
    channelId,
    client,
    content,
  } = message;
  const userAvatarUrl = user.displayAvatarURL();
  const botAvatarUrl = client.user.displayAvatarURL();
  const channel = client.channels.cache.get(channelId);

  const itemName = content
    .trim()
    .split(" ")
    .slice(1)
    .filter((word) => word !== "")
    .join(" ")
    .toLowerCase();

  if (!itemName.length) {
    const embed = new EmbedBuilder()
      .setTitle("Thông tin mặt hàng")
      .setColor(EMBED_COLOR_DANGER)
      .setDescription("Hãy nhập tên mặt hàng (ví dụ: `!info netflix`)");
    await channel.send({ embeds: [embed] });
    return;
  }

  const infoContent = getContentByTopic("info");
  if (!infoContent || infoContent.length === 0) {
    const embed = new EmbedBuilder().setDescription("Chưa có dữ liệu.");
    await channel.send({ embeds: [embed] });
    return;
  }

  const embedContent = infoContent.find((i) => i.content.startsWith(itemName));

  if (!embedContent) {
    const embed = new EmbedBuilder()
      .setTitle("Thông tin mặt hàng")
      .setColor(EMBED_COLOR_DANGER)
      .setDescription(`Không tìm thấy thông tin mặt hàng \`${itemName}\`.`);
    await channel.send({ embeds: [embed] });
    return;
  }

  const { content: text, attachment } = embedContent;

  const contentArr = text.split("\n").slice(1);
  const title = contentArr[0];
  const description = contentArr.slice(1).join("\n");

  if (attachment && attachment.contentType.startsWith("video")) {
    const video = new AttachmentBuilder(attachment.url);
    await channel.send({ content: `${title}\n${description}`, files: [video] });
    return;
  }

  const embed = {
    color: EMBED_COLOR,
    title: title || "Thông tin mặt hàng",
    description: description || "Chưa có mô tả",
    thumbnail: {
      url: userAvatarUrl,
    },
    ...(attachment &&
      attachment.contentType.startsWith("image") && {
        image: { url: attachment.url },
      }),
    footer: {
      text: `FwM Store • ${formatDateTime(new Date())}`,
      iconURL: botAvatarUrl,
    },
  };

  await channel.send({ embeds: [embed] });
};
