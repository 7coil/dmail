#!/usr/bin/env pwsh

$smtpServer = "mailserver.discordmail.com"
$smtpFrom = "Test Account <test@discordmail.com>"
# $smtpTo = "katie@discordmail.com"
$smtpTo = "c0e371a9-6fff-43cb-85b9-4e42be1fa18d@discordmail.com"
$messageSubject = "Test"
$messageBody = "This is a test application from Microsoft PowerShell."

$smtp = New-Object Net.Mail.SmtpClient($smtpServer)
$smtp.Send($smtpFrom,$smtpTo,$messagesubject,$messagebody)
