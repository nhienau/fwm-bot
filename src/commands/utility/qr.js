const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const {
  INVALID_ITEM_NAME_MSG,
  BANK_INFO,
  EMBED_COLOR,
  DISCORD_SERVER_URL,
} = require("../../utils/constant");
const { commafy } = require("../../utils/helpers");

module.exports = {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName("qr")
    .setDescription("Tạo QR thanh toán đơn hàng")
    .addStringOption((option) =>
      option
        .setName("seller")
        .setDescription("Chọn người bán")
        .setRequired(true)
        .addChoices(
          { name: "Minh", value: "minh" },
          { name: "Phong", value: "phong" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("itemname")
        .setDescription(
          "Nhập tên mặt hàng: viết liền, không dấu (ví dụ: owo5m, nitro1thang)"
        )
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Nhập số tiền")
        .setRequired(true)
        .setMinValue(1000)
    ),
  async execute(interaction) {
    const sellerName = interaction.options.getString("seller");
    const itemName = interaction.options.getString("itemname").trim();
    const amount = interaction.options.getInteger("amount");

    const {
      user: { globalName },
      member: { nickname, user },
    } = interaction;
    const displayName = nickname ?? globalName;
    const avatarUrl = user.displayAvatarURL();

    const encodedItemName = encodeURIComponent(itemName);
    if (encodedItemName !== itemName) {
      await interaction.reply({
        content: INVALID_ITEM_NAME_MSG,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const bankInfo = BANK_INFO[sellerName];
    const { bankId, bankName, accountNumber, accountName } = bankInfo;

    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNumber}-qr_only.png?amount=${amount}&addInfo=Thanh%Toan%Tien%${encodedItemName}&accountName=${encodeURIComponent(
      accountName
    )}`;

    const embed = {
      color: EMBED_COLOR,
      title: "Thanh toán mặt hàng",
      author: {
        name: displayName,
        iconURL: avatarUrl,
      },
      fields: [
        {
          name: "Số tài khoản",
          value: accountNumber,
          inline: true,
        },
        {
          name: "Ngân hàng",
          value: bankName,
          inline: true,
        },
        {
          name: "Người nhận",
          value: accountName,
          inline: true,
        },
        {
          name: "Số tiền",
          value: `${commafy(amount)}₫`,
          inline: true,
        },
        {
          name: "Nội dung",
          value: `ThanhToanTien${encodedItemName}`,
        },
      ],
      image: {
        url: qrUrl,
      },
      footer: {
        text: DISCORD_SERVER_URL,
      },
    };

    await interaction.reply({ embeds: [embed] });
  },
};
