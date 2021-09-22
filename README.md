## Power Switch
This node enables you to control anything, which can be controlled with an on and off command, quite comfortably. Control your device with the use of a toggle button or force the output with on/off commands. You can use one or more motion detectors and configure a relevant timeout. Configure a timer, after which the device will be turned off, and never forget anymore to power off your light. Send the actuator feedback to the block for more smart features. Once installed, find details in the node manual (or [preview raw on GitHub](https://github.com/danube/node-red-contrib-smarthome-powerswitch/blob/81de2557f156b98480ec00a5bf342f443455933e/nodes/powerswitch.html).)

### Example
<img src="https://github.com/danube/node-red-contrib-smarthome-powerswitch/raw/main/files/screenshots/powerswitch-example.png" width="600px" style="border:1px dashed grey">

### Properties
<img src="https://github.com/danube/node-red-contrib-smarthome-powerswitch/raw/main/files/screenshots/powerswitch-properties.png" height="500px" style="border:1px dashed grey">

### Warnings and errors
#### Code 01: Got more motion off than on messages, resetting counter. Check your hardware!
This is a warning. The node counts the incoming motion messages. The counter increases by 1 on an incoming "motion on" message and decreases by 1 on an incoming "motion off" message. Normally, after no motion is detected on all connected sensors, the counter should not be below zero. But if it happens, that more "motion off" than "motion on" messages have been received, the counter is negative. The warning will be raised and the counter will be set to zero to prevent a negative drift. Check your hardware and the configuration of your sensor. If you think everything is okay, you can also connect a filter node between motion detector and powerswitch node.

## Smart Home Collection
A collection of nodes relevant to control your smart home will be published soon under the name "node-red-contrib-smarthome". This node "powerswitch" is the first released output. The next will be a shading node to control your window blinds. Other scheduled nodes are a light dimmer, alarm system and more. These will be also published together under the name "node-red-contrib-smarthome" as well as independant nodes. So stay tunded @ https://github.com/danube.