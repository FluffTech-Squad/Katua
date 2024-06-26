# FluffyMod | Anti-Troll Moderation

**Warning: most of the essential features require premium, so, contact the owner by DMing the bot, you're server will get especially premium if validated.**

- Don't be pessimist! If you vote for the bot, you get 1 or 2 gold shards, gold shards can give temporary access to the guild of your choice. 2 shards = 12 hours and 1 extra shards adds 6 hours, it's like Nitro but free! The Golden Festival will start July 15th 2024 (undetermined date), so gain the max of golden shards to give your _(favorite)_ guild the premium features it needs a max of time!

## Commands

### `analyse`

Analyse a suspicious user's profile.

> This is a premium feature

**Usages:**
`/analyse <@user>`

![demo](https://i.imgur.com/nDhBqon.png)

### `config`

Configure the bot for your guild.

**Usages:**

> Analysing joining members to send a report in the log-channel (and inform members for potential in public-channel) is a premium feature. However, the NSFW filter is free and enabled by default.

`/config logs log-channel <#channel>`
`/config logs public-channel <#channel>`

> Enable or disable logging in the set log channel or the public channel.

`/config logs enable <type>`
`/config logs disable <type>`

> Enable or disable NSFW Filter or Word Filter.

`/config filters enable <filter>`
`/config filters disable <filter>`

> Be aware of what are the current configuration of FluffyMod in your guild.

`/config show`

_Soon_
`/config detector-prompt set`
`/config detector-prompt reset`

### `help`

Get list of commands.

**Usages:**
`help`

### `ping`

Check the bot's latency.

**Usages:**
`ping`

### `userinfo`

Get information about a user.

> It gives the same informations about guilds in common, total of bans and kicks (interserver), account creation date... But doesn't require premium because it doesn't analyse the profile.

> Eventually, you can request an analysis of the user in question, but it requires premium.

**Usages:**
`/userinfo <@user>`

![demo](https://i.imgur.com/stPfph1.png)

## Features

### Listening to events

With the API enabled, troll detection is working.

> Setup the log channel before trying this out, otherwise it won't do anything. Do `/config logs log-channel <#channel>`

- When a user joins, bot will send a message in your logs about this user, including if it seems to be safe/neutral or unsafe, if it detects the user as unsafe, the bot will write a report describing why this "special" user's profile is considered as unsafe. It will not ban or kick automatically.

- When a user sends a message: detects if a user says inappropriate message (non-moderators), the message will be deleted automatically and sends a log about the content.

- FluffyMod can freely detect NSFW medias (only images at the moment), freely meaning that it doesn't need API requests. NSFW content will be deleted if it's a non-NSFW channel, and send a report (without showing the images ofc)

- FluffyMod can provide in how much guilds a user has been banned/kicked (of course, FluffyMod must be there) and also provides the guilds in common with FluffyMod. Account Creation Date, and Join Date => via profile log, `/userinfo @user` command and `/analyse` command.
