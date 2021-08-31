/* TODO
- motion detector
*/

module.exports = function(RED) {
	function PowerSwitchNode(config) {

		RED.nodes.createNode(this,config);

		var nodeContext = this.context();

		var nodeThis = this;	// TODO prettify
		var err = false;
		var timeout;
		var timeoutValue = config.timeoutValue * 1000;
		var msgCmd = null;

		this.on('input', function(msg,send,done) {

			config.topicButton = config.topicButton || "button";
			config.topicFeedback = config.topicFeedback || "feedback";
			config.topicForce = config.topicForce || "force";
			
			function timeoutFunc() {
				sendMsgCmdFunc(nodeContext.lightSetOn = false);
				if (!config.expectFeedback) {
					setNodeState();
				}
			}

			function sendMsgCmdFunc(command) {
				msgCmd = {
					topic: "command",		// TODO make this configurable
					payload: command,
				}
				nodeThis.send(msgCmd);
				if (!config.expectFeedback) {
					nodeContext.lightIsOn = command;
					setNodeState();
				}
			}

			function setNodeState() {
				if (nodeContext.lightIsOn && !nodeContext.lightSetOn) {
					nodeThis.status({fill:"red",shape:"ring",text:"powering off"});
				} else if (nodeContext.lightIsOn && nodeContext.lightSetOn) {
					nodeThis.status({fill:"green",shape:"dot",text:"on"});
					if (config.timeoutValue > 0) {
						timeout = setTimeout(timeoutFunc, timeoutValue);
					}
				} else if (!nodeContext.lightIsOn && !nodeContext.lightSetOn) {
					nodeThis.status({fill:"red",shape:"dot",text:"off"});
					clearTimeout(timeout);
				} else if (!nodeContext.lightIsOn && nodeContext.lightSetOn) {
					nodeThis.status({fill:"green",shape:"ring",text:"powering on"});
				}
			}

			if (msg.topic === config.topicButton) {
				sendMsgCmdFunc(nodeContext.lightSetOn = !nodeContext.lightIsOn);    // TODO What happens on initial setup?
			} else if (msg.topic === config.topicForce) {
				sendMsgCmdFunc(nodeContext.lightSetOn = msg.payload);
			} else if (msg.topic === config.topicFeedback && config.expectFeedback) {
				nodeContext.lightIsOn = msg.payload;
				nodeContext.lightSetOn = nodeContext.lightIsOn;
			}
			
			setNodeState();







			if (err) {
				if (done) {
					// Node-RED 1.0 compatible
					done(err);
				} else {
					// Node-RED 0.x compatible
					this.error(err,msg);
				}
			}

			this.context = nodeContext;

		});


	}

	RED.nodes.registerType("powerswitch",PowerSwitchNode);
}
