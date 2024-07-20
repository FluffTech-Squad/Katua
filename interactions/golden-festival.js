const {
  ChatInputCommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} = require("discord.js");

const langs = require("../utils/langs.js");
const { guildEmbed, userEmbed } = require("../utils/embedFactory.js");
const { collections } = require("../utils/mongodb.js");
const goldShardsToTime = require("../utils/goldShardsToTime.js");
const dayjs = require("dayjs");
var duration = require("dayjs/plugin/duration");
dayjs.extend(duration);
const isPremium = require("../utils/isPremium.js");
const givePremium = require("../utils/givePremium.js");

let { users } = collections;
/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */
module.exports = async (interaction) => {
  let guild = interaction.guild;
  if (!guild) return;

  // shards subcommand

  if (await isPremium(interaction.guild)) {
    return interaction.editReply(
      `> :x: ${guild.name} already has premium, wait before it expires!`
    );
  }

  let userData = await users.findOne({ user_id: interaction.user.id });

  if (userData) {
    let count = userData.gold_shards;
    let hours = goldShardsToTime(count);

    let formatPremiumTimeStr = dayjs
      .duration(hours, "hours")
      .format(`D [days] [and] H [hours]`);

    let embed = guildEmbed(interaction.guild)
      .setTitle("Your Golden Shards")
      .addFields(
        {
          name: "Gold Shards",
          value: `You have ${count} gold shard${count > 1 ? "s" : ""}.`,
        },
        {
          name: "Premium",
          value: `You can now give premium for ${formatPremiumTimeStr}.`,
        }
      );

    let buttonPremium = new ButtonBuilder()
      .setCustomId("golden-festival-btn")
      .setLabel(`Give premium to this guild`)
      .setEmoji("👑")
      .setStyle(ButtonStyle.Secondary);

    let message = await interaction.editReply({
      embeds: [embed],
      components: [new ActionRowBuilder(buttonPremium)],
    });

    let collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === interaction.user.id,
      time: 10 * 1000,
    });

    collector.on("collect", async (i) => {
      await i.reply({
        content: `> :white_check_mark: You successfully gave premium for ${formatPremiumTimeStr} to ${guild.name}`,
        ephemeral: true,
      });

      let dayjsexpire = dayjs(new Date()).add(count, "hours");

      await givePremium(
        guild,
        Date.now(),
        dayjsexpire.toDate().valueOf(),
        interaction.user
      );

      collector.stop();
      await message.delete();
    });
  }
};
