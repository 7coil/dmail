# API

Welcome to the DiscordMail API Documentation

The API base is hosted at `/api`

## `POST /mail`

Webhook entry point for Mailgun. Contains validation to validate if emails are really from Mailgun and are for the domain DiscordMail is hosted on.

## `GET /stats`

Obtain statistics for DiscordMail.

### Returns

Key        | Description
---------- | -----------
guilds     | The number of guilds the user is in
users      | The number of users the bot can see (without requesting all users)
registered | The number of registered accounts in the DiscordMail database.

