const fs = require("node:fs");
const { Events, MessageFlags } = require("discord.js");
const { formatDateTime } = require("../utils/helpers");
const wait = require("node:timers/promises").setTimeout;

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isModalSubmit()) {
      const modalId = interaction.customId;

      const handler = interaction.client.modalHandlers.get(modalId);
      if (!handler) {
        console.error(`No modal ID matching ${modalId} was found.`);
        return;
      }
      try {
        await handler(interaction);
      } catch (error) {
        const errorTime = Date.now();
        const { channelId, user } = interaction;
        const logMessage = `${formatDateTime(
          errorTime
        )} [modal ID: ${modalId}, channel: ${channelId}, user: ${user.id}] ${
          error.message
        }\n`;
        console.log(logMessage);
        console.error(error);
        fs.appendFileSync("./assets/error.log", logMessage);

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      return;
    }

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
    const cooldownAmount =
      (command.cooldown ?? defaultCooldownDuration) * 1_000;

    if (cooldowns.has(userId)) {
      const { timestamp, cooldownDuration } = cooldowns.get(userId);
      const expirationTime = timestamp + cooldownDuration;
      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1_000);
        const secondsRemaining = Math.round((expirationTime - now) / 1_000);
        await interaction.reply({
          content: `Slow down and try the command again <t:${expiredTimestamp}:R>.`,
          flags: MessageFlags.Ephemeral,
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
      const errorTime = Date.now();
      console.error(error);
      const { user, commandName, channelId } = interaction;
      const logMessage = `${formatDateTime(
        errorTime
      )} [command: ${commandName}, channel: ${channelId}, user: ${user.id}] ${
        error.message
      }\n`;
      fs.appendFileSync("./assets/error.log", logMessage);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
