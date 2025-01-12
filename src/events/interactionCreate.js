const { Events } = require("discord.js");
const wait = require("node:timers/promises").setTimeout;

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    const { cooldowns } = interaction.client;
    const userId = interaction.user.id;

    const now = Date.now();
    const defaultCooldownDuration = 5;
    const extraCooldown = userId === process.env.HUY_KHANH_ID ? 5 : 0;
    const cooldownAmount =
      ((command.cooldown ?? defaultCooldownDuration) + extraCooldown) * 1_000;

    if (cooldowns.has(userId)) {
      const { timestamp, cooldownDuration } = cooldowns.get(userId);
      const expirationTime = timestamp + cooldownDuration;
      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1_000);
        const secondsRemaining = Math.round((expirationTime - now) / 1_000);
        await interaction.reply({
          content: `Slow down and try the command again <t:${expiredTimestamp}:R>.`,
          ephemeral: true,
        });
        await wait((secondsRemaining - 1) * 1000);
        await interaction.deleteReply();
        return;
      }
    } else {
      cooldowns.set(userId, {
        timestamp: now,
        cooldownDuration: cooldownAmount,
      });
      setTimeout(() => cooldowns.delete(userId), cooldownAmount);
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  },
};
