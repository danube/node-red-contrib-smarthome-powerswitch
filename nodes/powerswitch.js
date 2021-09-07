module.exports = function(RED) {
	function PowerSwitchNode(config) {
		RED.nodes.createNode(this,config);
		var context = this.context;
		var nodeThis = this;
		var err = false;
		var timeoutHandle;
		var msgCmd, msgDebug = null;

		this.on('input', function(msg,send,done) {

			config.toggleTopic = config.toggleTopic || "toggle";
			config.feedbackTopic = config.feedbackTopic || "feedback";
			config.forceTopic = config.forceTopic || "force";

			// convert config strings
			if (config.togglePayloadType === 'num') {context.togglePayload = Number(config.togglePayload)}
				else if (config.togglePayloadType === 'bool') {context.togglePayload = config.togglePayload === 'true'}
				else {context.togglePayload = config.togglePayload}
			;

			if (config.feedbackPayloadOnType === 'num') {context.feedbackPayloadOn = Number(config.feedbackPayloadOn)}
				else if (config.feedbackPayloadOnType === 'bool') {context.feedbackPayloadOn = config.feedbackPayloadOn === 'true'}
				else {context.feedbackPayloadOn = config.feedbackPayloadOn}
			;

			if (config.feedbackPayloadOffType === 'num') {context.feedbackPayloadOff = Number(config.feedbackPayloadOff)}
				else if (config.feedbackPayloadOffType === 'bool') {context.feedbackPayloadOff = config.feedbackPayloadOff === 'true'}
				else {context.feedbackPayloadOff = config.feedbackPayloadOff}
			;

			if (config.forcePayloadOnType === 'num') {context.forcePayloadOn = Number(config.forcePayloadOn)}
				else if (config.forcePayloadOnType === 'bool') {context.forcePayloadOn = config.forcePayloadOn === 'true'}
				else {context.forcePayloadOn = config.forcePayloadOn}
			;

			if (config.forcePayloadOffType === 'num') {context.forcePayloadOff = Number(config.forcePayloadOff)}
				else if (config.forcePayloadOffType === 'bool') {context.forcePayloadOff = config.forcePayloadOff === 'true'}
				else {context.forcePayloadOff = config.forcePayloadOff}
			;

			// convert timeout variables
			if (config.timeoutActive && config.timeoutUnit === "h") {
				context.timeoutValue = config.timeoutValue * 3600000
			} else if (config.timeoutActive && config.timeoutUnit === "m") {
				context.timeoutValue = config.timeoutValue * 60000
			} else if (config.timeoutActive && config.timeoutUnit === "s") {
				context.timeoutValue = config.timeoutValue * 1000
			} else {
				context.timeoutValue = 0
			}
			
			function timeoutFunc() {
				sendMsgCmdFunc(context.lightSetOn = false);
			}

			function sendMsgCmdFunc(command) {
				msgCmd = {
					topic: "command",
					payload: command,
				}
				nodeThis.send(msgCmd);
				if (!config.feedbackActive) {
					context.lightIsOn = command;
				}
				setNodeState();
			}

			function setNodeState() {
				if (context.lightIsOn && !context.lightSetOn) {
					nodeThis.status({fill:"red",shape:"ring",text:"powering off"});
				} else if (context.lightIsOn && context.lightSetOn) {
					nodeThis.status({fill:"green",shape:"dot",text:"on"});
					if (context.timeoutValue > 0) {
						timeoutHandle = setTimeout(timeoutFunc, context.timeoutValue);
					}
				} else if (!context.lightIsOn && !context.lightSetOn) {
					nodeThis.status({fill:"red",shape:"dot",text:"off"});
					clearTimeout(timeoutHandle);
				} else if (!context.lightIsOn && context.lightSetOn) {
					nodeThis.status({fill:"green",shape:"ring",text:"powering on"});
				}
			}

			if (msg.topic === config.toggleTopic && msg.payload === context.togglePayload) {
				sendMsgCmdFunc(context.lightSetOn = !context.lightIsOn);
			} else if (msg.topic === config.forceTopic && msg.payload === context.forcePayloadOn) {
				sendMsgCmdFunc(context.lightSetOn = true);
			} else if (msg.topic === config.forceTopic && msg.payload === context.forcePayloadOff) {
				sendMsgCmdFunc(context.lightSetOn = false);
			} else if (config.feedbackActive && msg.topic === config.feedbackTopic && msg.payload === context.feedbackPayloadOn) {
				context.lightIsOn = true;
				context.lightSetOn = true;
			} else if (config.feedbackActive && msg.topic === config.feedbackTopic && msg.payload === context.feedbackPayloadOff) {
				context.lightIsOn = false;
				context.lightSetOn = false;
			}

			setNodeState();

			if (msg.debug) {
				msgDebug = {
					topic: "debug",
					msg: msg,
					config: config,
					context: context
				}
				nodeThis.send(msgDebug);
			}

			if (err) {
				if (done) {
					// Node-RED 1.0 compatible
					done(err);
				} else {
					// Node-RED 0.x compatible
					this.error(err,msg);
				}
			}

			this.context = context;

		});

	}

	RED.nodes.registerType("powerswitch",PowerSwitchNode);
}
