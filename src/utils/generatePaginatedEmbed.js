const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
  ComponentType,
  ChatInputCommandInteraction,
} = require("discord.js");
const {
  INTERACTION_VALID_TIME,
  INTERACTION_INACTIVE_MSG,
  INTERACTION_NOT_ALLOWED_MSG,
  EMBED_COLOR,
  PAGES_TO_SKIP,
} = require("./constant");

module.exports = async function (event, fetchFn) {
  const isInteraction = event instanceof ChatInputCommandInteraction;
  // isInteraction == false => event is a Message

  let userId, displayName, avatarUrl, channel;

  if (isInteraction) {
    const {
      user: { id, globalName },
      member: { nickname, user },
    } = event;
    displayName = nickname ?? globalName;
    avatarUrl = user.displayAvatarURL();
    userId = id;
  } else {
    const {
      member: { nickname, user, id },
      channelId,
      client,
    } = event;
    displayName = nickname ?? user.globalName;
    avatarUrl = user.displayAvatarURL();
    channel = client.channels.cache.get(channelId);
    userId = id;
  }

  let currentPage = 1;
  let currentTotalPages = 1;

  const { result: paginatedResult, message } = await fetchFn(currentPage);
  const { pageNo, totalElements, totalPages } = paginatedResult;
  currentTotalPages = totalPages;

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setAuthor({ name: displayName, iconURL: avatarUrl })
    .setDescription(message);

  if (totalElements === 0) {
    if (isInteraction) {
      await event.editReply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await channel.send({
        embeds: [embed],
      });
    }
    return;
  }

  embed.setFooter({
    text: `Trang ${pageNo}/${totalPages}`,
  });

  const btnJumpBack = new ButtonBuilder()
    .setCustomId("jumpback")
    .setEmoji({ name: "⏪" })
    .setStyle(ButtonStyle.Primary)
    .setDisabled(pageNo === 1);

  const btnPrev = new ButtonBuilder()
    .setCustomId("prev")
    .setEmoji({ name: "⬅️" })
    .setStyle(ButtonStyle.Primary)
    .setDisabled(pageNo === 1);

  const btnNext = new ButtonBuilder()
    .setCustomId("next")
    .setEmoji({ name: "➡" })
    .setStyle(ButtonStyle.Primary)
    .setDisabled(pageNo === totalPages);

  const btnJumpForward = new ButtonBuilder()
    .setCustomId("jumpforward")
    .setEmoji({ name: "⏩" })
    .setStyle(ButtonStyle.Primary)
    .setDisabled(pageNo === totalPages);

  const actionRow = new ActionRowBuilder().addComponents(
    btnJumpBack,
    btnPrev,
    btnNext,
    btnJumpForward
  );

  const response = isInteraction
    ? await event.editReply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
        components: [actionRow],
      })
    : await channel.send({
        embeds: [embed],
        components: [actionRow],
      });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: INTERACTION_VALID_TIME,
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== userId) {
      await i.reply({
        content: INTERACTION_NOT_ALLOWED_MSG,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await i.deferUpdate();

    if (i.customId === "jumpback") {
      currentPage =
        currentPage - PAGES_TO_SKIP >= 1 ? currentPage - PAGES_TO_SKIP : 1;
    } else if (i.customId === "prev") {
      currentPage--;
    } else if (i.customId === "next") {
      currentPage++;
    } else if (i.customId === "jumpforward") {
      currentPage =
        currentPage + PAGES_TO_SKIP <= currentTotalPages
          ? currentPage + PAGES_TO_SKIP
          : currentTotalPages;
    }
    const { result: paginatedResult, message } = await fetchFn(currentPage);
    const { pageNo, totalPages } = paginatedResult;
    currentTotalPages = totalPages;

    embed.setDescription(message);
    embed.setFooter({
      text: `Trang ${pageNo}/${totalPages}`,
    });
    btnJumpBack.setDisabled(pageNo === 1);
    btnPrev.setDisabled(pageNo === 1);
    btnNext.setDisabled(pageNo === totalPages);
    btnJumpForward.setDisabled(pageNo === totalPages);

    if (isInteraction) {
      await event.editReply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
        components: [actionRow],
      });
    } else {
      await response.edit({
        embeds: [embed],
        components: [actionRow],
      });
    }
  });

  collector.on("end", async () => {
    try {
      if (isInteraction) {
        await event.editReply(INTERACTION_INACTIVE_MSG);
      } else {
        await response.edit(INTERACTION_INACTIVE_MSG);
      }
    } catch (err) {
      if (err.code === 10008) return;
      console.error(err);
    }
  });
};
