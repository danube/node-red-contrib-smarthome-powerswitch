# Changelog

## 1.1.0

* Introduced possibility to configure output topic and payload (resolves #4).
* Fixed not working node if config dialoggue was never opened (resolves #15).
* Implemented some downward compatibility features in JS and HTML.
* Bugfuixes regarding interpretation of strings and booleans.
* Added option to ignore incoming "Force On" payload while powered on by motion detector. Find checkbox "Ignore while powered on by motion" in the "Force" section. Addresses #13.
* Added `lastReason` to context.
* Added QR code and links to GitHub repo in the config and manual dialogue.

## 1.0.11

* Reworked warnings on faulty or missing msg.timeout value
* Added "input" label on headings
* Introducing equal payload validation (resolves #1)
* Added validations to motion and absolute timeout (resolves #2)

## 1.0.10

* Showing time setting in node title (addressing #8).
* Fixes in package.json to satisfy Node-RED scoreboard.
* Updated screenshots, README.md and help files accordingly.

## 1.0.9

* Added engines section and node-red min version keyword to package.json.

## 1.0.8

* Added example nodes.

## 1.0.7

* No code change. Just added info to doc what happens if msg.timeout is invalid (#9).

## 1.0.6

* Added option to override timeout with msg.timeout (#9).

## 1.0.5

* lockedOn falsed on timeout if disabled feedbackActive

## 1.0.4

* Introducing changelog.
* Fixes an issue of a switch not powering down if a motion detector messages got lost. See <https://github.com/Supergiovane/node-red-contrib-knx-ultimate/issues/144> for more debugging discussion together with knxUltimate, which initially brought up the problem.

## 1.0.3

* Critical rebuild of timeout handling.
* Changed debug message event.

## 1.0.2

* Updated README.
* Tweaked motion counter.

## 0.1.1-210921a

* Added motions counter
