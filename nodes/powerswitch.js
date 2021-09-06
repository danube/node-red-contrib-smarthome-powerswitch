module.exports = function(RED) {
	function PowerSwitchNode(config) {
		RED.nodes.createNode(this,config);
		var nodeThis = this;
		var err = false;
		var timeout;
		var msgCmd = null;

		this.on('input', function(msg,send,done) {

			config.buttonTopic = config.buttonTopic || "button";
			config.feedbackTopic = config.feedbackTopic || "feedback";
			config.forceTopic = config.forceTopic || "force";
			
			if (config.timeoutActive && config.timeoutUnit === "h") {
				config.timeoutValue = config.timeoutValue * 3600000
			} else if (config.timeoutActive && config.timeoutUnit === "m") {
				config.timeoutValue = config.timeoutValue * 60000
			} else if (config.timeoutActive && config.timeoutUnit === "s") {
				config.timeoutValue = config.timeoutValue * 1000
			} else {
				config.timeoutValue = 0
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
					if (config.timeoutValue > 0) {
						timeout = setTimeout(timeoutFunc, config.timeoutValue);
					}
				} else if (!nodeThis.context.lightIsOn && !nodeThis.context.lightSetOn) {
					nodeThis.status({fill:"red",shape:"dot",text:"off"});
					clearTimeout(timeout);
				} else if (!nodeThis.context.lightIsOn && nodeThis.context.lightSetOn) {
					nodeThis.status({fill:"green",shape:"ring",text:"powering on"});
				}
			}

			if (msg.topic === config.buttonTopic && msg.payload === true) {
				sendMsgCmdFunc(nodeThis.context.lightSetOn = !nodeThis.context.lightIsOn);
			} else if (msg.topic === config.forceTopic) {
				sendMsgCmdFunc(nodeThis.context.lightSetOn = msg.payload);
			} else if (msg.topic === config.feedbackTopic && config.feedbackActive) {
				nodeThis.context.lightIsOn = msg.payload;
				nodeThis.context.lightSetOn = nodeThis.context.lightIsOn;
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
