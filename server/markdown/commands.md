### Commands

Dmail commands are triggered by placing a prefix that defines a context, and a command.

#### Prefixes

- User: `dmail`
- Guild: `dsuite`

#### Commands

##### `block`
Block emails separated by semicolons.

Example:  
`dmail block mdteam.ga;example.com`  
This command blocks the `mdteam.ga and example.com` domains.

##### `register`
Register for Dmail. Please read the [Terms and Conditions](/docs/terms) and [Privacy Statement](/docs/privacy) before registering.

##### `reply`
Reply to a specific email.

Example:
`dmail reply aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa This is a reply`  
This command replies to the email with the specific Reply ID

##### `send`
Send to a specific email.

Example:
`dmail send admin@moustacheminer.com "exciting" test`  
This command sends a message with the subject "exciting" with a body of "test"

##### `what`
Find out your Dmail address
