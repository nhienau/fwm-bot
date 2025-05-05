const { EmbedBuilder, MessageFlags } = require("discord.js");
const cron = require("cron");
const {
  getOrderById,
  updateOrder,
  getNearlyExpiredOrders,
} = require("../services/apiOrders");
const { formatDateTime, addDays, getConfig, formatDate } = require("./helpers");
const { EMBED_COLOR_DANGER } = require("./constant");

// from nearly expired orders, create cronjobs to send renewal DMs
async function scheduleRenewalReminders(client) {
  const orders = await getNearlyExpiredOrders();
  const reminders = orders.map((o) => {
    const expiresAt = new Date(o.expires_at);
    const sendDmAt = addDays(expiresAt, -1);

    return {
      ...o,
      sendDmAt,
      cronJob: cron.CronJob.from({
        cronTime: sendDmAt,
        onTick: sendRenewalReminder.bind(null, { client, orderId: o.id }),
        start: true,
      }),
    };
  });

  client.reminders = reminders;

  const now = new Date();
  const tomorrow = addDays(now, 1);

  const reminderLogChannelId = getConfig("reminderLogChannelId");
  if (reminderLogChannelId) {
    const logChannel = await client.channels.fetch(reminderLogChannelId);
    await logChannel.send({
      content: `[${formatDate(now)}] Có ${
        reminders.length
      } đơn hàng sắp hết hạn vào ngày ${formatDate(tomorrow)}.`,
    });
  }
  return reminders;
}

async function sendRenewalReminder({ client, orderId }) {
  try {
    const order = await getOrderById(orderId);

    if (!order) {
      throw new Error(`Order #\`${orderId}\` not found`);
    }

    const { item_name, created_at, expires_at, email, user } = order;
    const { discord_uid } = user;

    // Check if user exists
    let discordUser;
    try {
      discordUser = await client.users.fetch(discord_uid);
    } catch (err) {
      throw new Error(`User not found (${discord_uid})`);
    }

    const strCreatedAt = formatDateTime(new Date(created_at));
    const strExpiresAt = formatDateTime(new Date(expires_at));

    const ticketChannelId = getConfig("ticketChannelId");

    const description =
      `Mặt hàng **${item_name}** của bạn sẽ hết hạn vào ${strExpiresAt}. Chi tiết:\n\n` +
      `Mặt hàng: **${item_name}**\n` +
      `${email ? `Email: \`${email}\`\n` : ""}` +
      `Ngày mua: ${strCreatedAt}\n` +
      `Ngày hết hạn: ${strExpiresAt}\n\n` +
      "Vui lòng gia hạn hoặc xử lý đơn hàng trong thời gian sớm nhất để đảm bảo không gián đoạn dịch vụ.\n" +
      `Nếu cần hỗ trợ, vui lòng tạo ticket tại FwM Store${
        ticketChannelId ? `: <#${ticketChannelId}>` : ""
      }.`;

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLOR_DANGER)
      .setTitle(":bell: Thông báo hết hạn")
      .setDescription(description)
      .setFooter({ text: formatDateTime(new Date()) });

    const result = await discordUser.send({ embeds: [embed] });
    if (result) {
      const updateResult = await updateOrder(orderId, {
        renewal_reminded: true,
      });

      if (!updateResult.renewal_reminded) {
        throw new Error("Error updating order");
      }

      const reminderLogChannelId = getConfig("reminderLogChannelId");
      if (reminderLogChannelId) {
        const logChannel = await client.channels.fetch(reminderLogChannelId);
        await logChannel.send({
          content: `Thông báo hết hạn đã được gửi tới <@${discord_uid}>.${
            ticketChannelId ? "" : " (Cảnh báo: thiếu ID kênh ticket)"
          }`,
          allowedMentions: {
            parse: ["roles"],
            roles: [],
          },
        });
      }
    } else {
      throw new Error("Failed to send DM to user");
    }
  } catch (err) {
    const reminderLogChannelId = getConfig("reminderLogChannelId");
    if (reminderLogChannelId) {
      const logChannel = await client.channels.fetch(reminderLogChannelId);
      await logChannel.send({
        content: `[#${orderId}] Có lỗi xảy ra: ${err.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}

module.exports = { scheduleRenewalReminders, sendRenewalReminder };
