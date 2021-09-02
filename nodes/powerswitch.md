# Power Switch
Use it i.e. as a light switch or smart power outlet. A pushbutton event toggles the control output, actuator feedback can optionally be respected. Configure a timeout to automatically turn off lights you forgot to power down or use this as a timer for your connected motion detector.

## Incoming topics configuration (msg.topic)
### Button
* Defines the expected topic of a message to toggle on/off the switch.
* If left blank, "button" is expected as topic.
* The payload of such a message is ignored.
* Result is the command output being inverted to the actual state recently received on the feedback topic (true/false).

### Feedback
* Defines the expected topic of a message containing the actuator feedback.
* If actuator feedback is connected, enable the option "TODO".
* If left blank, "feedback" is expected as topic.
* The payload must contain true (actuator has switched on) or false (actuator has switched off).
* If "true" is received, the timeout starts to count down (if configured).

### Force
* Defines the expected topic of a message containing a force command.
* Relevant payload must be either "true" or "false".
* The command output will immediately receive the relevant force command.

## Behaviour configuration
### Timeout [s]
* When the switch is turned on, after the configured number of seconds, the switch will turn off.
* If left blank or "0" configured, the timeout is disabled.

# List of open points
- what happens on initial setup (in respect to the context)??
- make button payload configurable
- write a proper help section in html
- hide feedback topic configuration if checkbox is disabled, see https://www.w3schools.com/howto/howto_js_display_checkbox_text.asp
- make output message topic configurable
- make timeout unit configurable (sec, min, hrs, ...), like trigger
- prettify properties html
- internationalization