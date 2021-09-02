module.exports = function(RED) {
	function PowerSwitchNode(config) {
		RED.nodes.createNode(this,config);
		var nodeContext = this.context();
		var nodeThis = this;
		var err = false;
		var timeout;
		var timeoutValue = config.timeoutValue * 1000;
		var msgCmd = null;

		this.on('input', function(msg,send,done) {

			config.buttonTopic = config.buttonTopic || "button";
			config.feedbackTopic = config.feedbackTopic || "feedback";
			config.forceTopic = config.forceTopic || "force";
			
			function timeoutFunc() {
				sendMsgCmdFunc(nodeContext.lightSetOn = false);
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

			if (msg.topic === config.buttonTopic && msg.payload === true) {
				sendMsgCmdFunc(nodeContext.lightSetOn = !nodeContext.lightIsOn);
			} else if (msg.topic === config.forceTopic) {
				sendMsgCmdFunc(nodeContext.lightSetOn = msg.payload);
			} else if (msg.topic === config.feedbackTopic && config.feedbackActive) {
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
