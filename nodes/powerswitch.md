# Properties
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