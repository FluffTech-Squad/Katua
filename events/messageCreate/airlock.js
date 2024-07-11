const { Message, ChannelType } = require("discord.js");
const { collections } = require("../../utils/mongodb");
const { guildEmbed } = require("../../utils/embedFactory");

/**
 * @param {Message} message
 */
module.exports = async (message) => {
  if (message.author.bot) return;

  let guildData = await collections.guilds.findOne({
    guild_id: message.guild.id,
  });

  if (
    guildData &&
    guildData.enabled &&
    guildData.enabled.includes("verification-airlock")
  ) {
    if (guildData.airlock_channel_id) {
      let airlockChannel = await message.guild.channels.fetch(
        guildData.airlock_channel_id
      );

      if (airlockChannel && airlockChannel.isTextBased()) {
        if (message.channel.id === airlockChannel.id) {
          if (guildData.airlock_role_id) {
            if (message.author.bot) return;
            if (message.author.id === message.guild.ownerId) return;

            let member = await message.guild.members.fetch(message.author.id);

            if (
              member.permissions.has("ManageMessages") ||
              member.permissions.has("Administrator") ||
              member.permissions.has("ManageGuild")
            )
              return;

            let messages = await message.channel.messages.fetch({
              limit: 100,
            });

            let verifyingMessages = messages.filter(
              (m) => m.author.id === message.author.id
            );

            if (verifyingMessages.toJSON().length > 1) return;

            let verifiedRole = await message.guild.roles.fetch(
              guildData.airlock_role_id
            );

            if (verifiedRole) {
              await message.react("✅");
              await message.react("❌");

              let collector = message.createReactionCollector();

              collector.on("collect", async (reaction, user) => {
                if (user.bot) return;

                let member = await message.guild.members.fetch(user.id);

                if (
                  member.permissions.has("ManageMessages") ||
                  member.permissions.has("Administrator") ||
                  member.permissions.has("ManageGuild") ||
                  member.user.id === "505832674217295875"
                ) {
                  let verifyingMember = await message.guild.members.fetch(
                    message.author.id
                  );

                  let messages = await reaction.message.channel.messages.fetch({
                    limit: 100,
                  });

                  let verifyingMessages = messages.filter(
                    (m) => m.author.id === message.author.id
                  );

                  if (reaction.message.channel.type !== ChannelType.GuildText)
                    return;

                  if (reaction.emoji.name === "✅") {
                    verifyingMessages.forEach(async (m) => {
                      await m.delete();
                    });

                    await verifyingMember.roles.add(verifiedRole);

                    if (guildData.airlock_roles) {
                      for (let role_id of guildData.airlock_roles) {
                        try {
                          let r = await message.guild.roles.fetch(role_id);

                          if (r) {
                            await verifyingMember.roles.add(r);
                          }
                        } catch {}
                      }
                    }

                    // Send embed to user that they have been verified

                    let embed = guildEmbed(message.guild)
                      .setTitle("Verification")
                      .setDescription(
                        `You have been verified in ${message.guild.name}.`
                      )
                      .setColor("Green");

                    try {
                      await verifyingMember.user.send({ embeds: [embed] });
                    } catch {}
                  }

                  if (reaction.emoji.name === "❌") {
                    verifyingMessages.forEach(async (m) => {
                      await m.delete();
                    });

                    let embed = guildEmbed(message.guild)
                      .setTitle("Verification")
                      .setDescription(
                        `You have been kicked from ${message.guild.name} because you didn't get accepted.`
                      )
                      .setColor("Red");

                    try {
                      await verifyingMember.send({ embeds: [embed] });
                    } catch {}
                  }
                } else {
                  await reaction.users.remove(user);
                }
              });
            }
          }
        }
      }
    }
  }
};
