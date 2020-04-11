#!/usr/bin/env pwsh

$smtpServer = "localhost"
$smtpFrom = "Test Account <test@discordmail.com>"
# $smtpTo = "katie@discordmail.com"
$smtpTo = "bf13a0e6-418e-4b12-a983-5153d206d84a@discordmail.com"
$messageSubject = "Test"
$messageBody = "This is a test application from Microsoft PowerShell."

$smtp = New-Object Net.Mail.SmtpClient($smtpServer)
$smtp.Send($smtpFrom,$smtpTo,$messagesubject,$messagebody)
