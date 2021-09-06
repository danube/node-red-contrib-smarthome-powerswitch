module.exports = function(RED) {
	function PowerSwitchNode(config) {
		RED.nodes.createNode(this,config);
		var nodeThis = this;
		var err = false;
		var timeoutHandle, timeoutValue;
		var msgCmd = null;

		this.on('input', function(msg,send,done) {

			config.buttonTopic = config.buttonTopic || "button";
			config.feedbackTopic = config.feedbackTopic || "feedback";
			config.forceTopic = config.forceTopic || "force";
			
			if (config.timeoutActive && config.timeoutUnit === "h") {
				timeoutValue = config.timeoutValue * 3600000
			} else if (config.timeoutActive && config.timeoutUnit === "m") {
				timeoutValue = config.timeoutValue * 60000
			} else if (config.timeoutActive && config.timeoutUnit === "s") {
				timeoutValue = config.timeoutValue * 1000
			} else {
				timeoutValue = 0
			}
			
			function timeoutFunc() {
				sendMsgCmdFunc(nodeThis.context.lightSetOn = false);
				if (!config.feedbackActive) {
					setNodeState();
				}
			}

			function sendMsgCmdFunc(command) {
				msgCmd = {
					topic: "command",
					payload: command,
				}
				nodeThis.send(msgCmd);
				if (!config.feedbackActive) {
					nodeThis.context.lightIsOn = command;
					setNodeState();
				}
			}

			function setNodeState() {
				if (nodeThis.context.lightIsOn && !nodeThis.context.lightSetOn) {
					nodeThis.status({fill:"red",shape:"ring",text:"powering off"});
				} else if (nodeThis.context.lightIsOn && nodeThis.context.lightSetOn) {
					nodeThis.status({fill:"green",shape:"dot",text:"on"});
					if (timeoutValue > 0) {
						timeoutHandle = setTimeout(timeoutFunc, timeoutValue);
					}
				} else if (!nodeThis.context.lightIsOn && !nodeThis.context.lightSetOn) {
					nodeThis.status({fill:"red",shape:"dot",text:"off"});
					clearTimeout(timeoutHandle);
				} else if (!nodeThis.context.lightIsOn && nodeThis.context.lightSetOn) {
					nodeThis.status({fill:"green",shape:"ring",text:"powering on"});
				}
			}

			if (msg.topic === config.toggleTopic && msg.payload === config.toggleMessage) {
				sendMsgCmdFunc(nodeThis.context.lightSetOn = !nodeThis.context.lightIsOn);
			} else if (msg.topic === config.forceTopic && msg.payload === config.forceMessageOn) {
				sendMsgCmdFunc(nodeThis.context.lightSetOn = true);
			} else if (msg.topic === config.forceTopic && msg.payload === config.forceMessageOff) {
				sendMsgCmdFunc(nodeThis.context.lightSetOn = false);
			} else if (config.feedbackActive && msg.topic === config.feedbackTopic && msg.payload === config.feedbackMessageOn) {
				nodeThis.context.lightIsOn = true;
				nodeThis.context.lightSetOn = true;
			} else if (config.feedbackActive && msg.topic === config.feedbackTopic && msg.payload === config.feedbackMessageOff) {
				nodeThis.context.lightIsOn = false;
				nodeThis.context.lightSetOn = false;
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

			this.context = nodeThis.context;

		});

	}

	RED.nodes.registerType("powerswitch",PowerSwitchNode);
}
