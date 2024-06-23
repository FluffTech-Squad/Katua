# FluffyMod | Anti-Troll Moderation Powered By AI

- Analyse joining users' profile to detect if it might be a troll or not. Triggering everytime someone joins your guild (you should config a log channel).

## Commands

## `analyse`

Analyse a suspicious user's profile.

**Usages:**
`/analyse <@user>`

## `config`

Configure the bot for your guild.

**Usages:**
`/config logs log-channel <#channel>`
`/config logs public-channel <#channel>`
`/config logs enable <type>`
`/config logs disable <type>`
`/config filters enable <filter>`
`/config filters disable <filter>`

## `detector-prompt`

Manage the detector prompt to detect unsafe contents in the server.

**Usages:**
`/detector-prompt set`
`/detector-prompt reset`
`/detector-prompt show`

## `help`

Get list of commands.

**Usages:**
`help`

## `ping`

Check the bot's latency.

**Usages:**
`ping`

## `userinfo`

Get information about a user.

**Usages:**
`/userinfo <@user>`

## Features

### Listening to events

With the API enabled, troll detection is working.

Setup logging with the `/set-logs` command before trying this out.

- When a user joins, bot will send a message in your logs about this user, including if it seems to be safe/neutral or unsafe, if it detects the user as unsafe, the bot will write a report describing why this "special" user's profile is considered as unsafe. It will not ban or kick automatically.

- When a user sends a message: detects if a user says inappropriate message (non-moderators), the message will be deleted automatically and sends a log about the content.

- FluffyMod can freely detect NSFW medias (only images at the moment), freely meaning that it doesn't need API requests. NSFW content will be deleted if it's a non-NSFW channel, and send a report (without showing the images ofc)

- FluffyMod can provide in how much guilds a user has been banned/kicked (of course, FluffyMod must be there) and also provides the guilds in common with FluffyMod. Account Creation Date, and Join Date => via profile log, `/userinfo @user` command and `/analyse` command.
