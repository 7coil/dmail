```
=== DiscordMail ===
block
 ┗━ Block emails. Emails containing a subset of the input will be blocked.
    ┗━ [E-Mail 1]; [E-Mail 2]; ...
delete
 ┗━ Delete E-Mail from database
    ┗━ [Email-ID]
register
 ┗━ Register for DiscordMail
reply
 ┣━ Reply to a specific E-Mail
 ┃  ┗━ [Email-ID] [Content]
 ┗━ Reply to the last E-Mail recieved
    ┗━ [Content]
send
 ┗━ Create and send an E-Mail
    ┣━ [E-Mail] "[Subject]" [Content]
    ┣━ [E-Mail] [Content]
    ┗━ [E-Mail] "Subject"
what
 ┣━ Obtain the E-Mail address of the context
 ┗━ Obtain a user's E-Mail address
    ┣━ [@mention]
    ┗━ [Guild or User ID]

=== Info ===
help
 ┗━ Obtain relevant links and this commands list
info
 ┗━ Obtain uptime information
ping
 ┗━ Check if MSS has crashed yet

=== Configuration ===
locale
 ┣━ Get a list of locales
 ┗━ Set your locale
	┗━ [locale]
```
