/*
FIXME
- Sperre wenn EIN durch Toggle, On message oder Force message
- On message einbauen
- Check abstimeout to be higher than ontimeout
*/



module.exports = function(RED) {
	function PowerSwitchNode(config) {
		RED.nodes.createNode(this,config);
		
		var context = this.context();
		var nodeThis = this;
		var err = false;
		var absTimeoutHandle, onTimeoutHandle;
		var msgCmd, msgDebug = null;

		this.on('input', function(msg,send,done) {

			config.toggleTopic = config.toggleTopic || "toggle";
			config.onTopic = config.onTopic || "on";
			config.feedbackTopic = config.feedbackTopic || "feedback";
			config.forceTopic = config.forceTopic || "force";

			// convert config strings
			if (config.togglePayloadType === 'num') {context.togglePayload = Number(config.togglePayload)}
			else if (config.togglePayloadType === 'bool') {context.togglePayload = config.togglePayload === 'true'}
			else {context.togglePayload = config.togglePayload};

			if (config.onPayloadType === 'num') {context.onPayload = Number(config.onPayload)}
			else if (config.onPayloadType === 'bool') {context.onPayload = config.onPayload === 'true'}
			else {context.onPayload = config.onPayload};

			if (config.feedbackPayloadOnType === 'num') {context.feedbackPayloadOn = Number(config.feedbackPayloadOn)}
			else if (config.feedbackPayloadOnType === 'bool') {context.feedbackPayloadOn = config.feedbackPayloadOn === 'true'}
			else {context.feedbackPayloadOn = config.feedbackPayloadOn};

			if (config.feedbackPayloadOffType === 'num') {context.feedbackPayloadOff = Number(config.feedbackPayloadOff)}
			else if (config.feedbackPayloadOffType === 'bool') {context.feedbackPayloadOff = config.feedbackPayloadOff === 'true'}
			else {context.feedbackPayloadOff = config.feedbackPayloadOff};

			if (config.forcePayloadOnType === 'num') {context.forcePayloadOn = Number(config.forcePayloadOn)}
			else if (config.forcePayloadOnType === 'bool') {context.forcePayloadOn = config.forcePayloadOn === 'true'}
			else {context.forcePayloadOn = config.forcePayloadOn};

			if (config.forcePayloadOffType === 'num') {context.forcePayloadOff = Number(config.forcePayloadOff)}
			else if (config.forcePayloadOffType === 'bool') {context.forcePayloadOff = config.forcePayloadOff === 'true'}
			else {context.forcePayloadOff = config.forcePayloadOff};

			// convert absTimeout variables
			if (config.absTimeoutActive && config.absTimeoutUnit === "h") {context.absTimeoutValue = config.absTimeoutValue * 3600000}
			else if (config.absTimeoutActive && config.absTimeoutUnit === "m") {context.absTimeoutValue = config.absTimeoutValue * 60000}
			else if (config.absTimeoutActive && config.absTimeoutUnit === "s") {context.absTimeoutValue = config.absTimeoutValue * 1000}
			else {context.absTimeoutValue = 0}
			
			// convert onTimeout variables
			if (config.onTimeoutUnit === "h") {context.onTimeoutValue = config.onTimeoutValue * 3600000}
			else if (config.onTimeoutUnit === "m") {context.onTimeoutValue = config.onTimeoutValue * 60000}
			else if (config.onTimeoutUnit === "s") {context.onTimeoutValue = config.onTimeoutValue * 1000}
			else {context.onTimeoutValue = 0}
			
			function timeoutFunc() {
				sendMsgCmdFunc(context.lightSetOn = false);
				setNodeState();
			}

			function sendMsgCmdFunc(command) {
				msgCmd = {
					topic: "command",
					payload: command
				}
				nodeThis.send(msgCmd);
				if (!config.feedbackActive) {
					context.lightIsOn = command;
				}
			}

			function setNodeState() {
				if (context.lightIsOn && !context.lightSetOn) {
					nodeThis.status({fill:"red",shape:"ring",text:"powering off"});
				} else if (context.lightIsOn && context.lightSetOn) {
					nodeThis.status({fill:"green",shape:"dot",text:"on"});
					if (context.absTimeoutValue > 0) {
						absTimeoutHandle = setTimeout(timeoutFunc, context.absTimeoutValue);
					}
				} else if (!context.lightIsOn && !context.lightSetOn) {
					nodeThis.status({fill:"red",shape:"dot",text:"off"});
					clearTimeout(absTimeoutHandle);
				} else if (!context.lightIsOn && context.lightSetOn) {
					nodeThis.status({fill:"green",shape:"ring",text:"powering on"});
				}
			}

			// message: toggle
			if (msg.topic === config.toggleTopic && msg.payload === context.togglePayload) {
				sendMsgCmdFunc(context.lightSetOn = !context.lightIsOn);
				context.lockedOn = context.lightSetOn;
				clearTimeout(onTimeoutHandle);
				// message: on with timer
			} else if (msg.topic === config.onTopic && msg.payload === context.onPayload && !context.lockedOn) {
				sendMsgCmdFunc(context.lightSetOn = true);
				onTimeoutHandle = setTimeout(timeoutFunc, context.onTimeoutValue);
				// message: force on
			} else if (msg.topic === config.forceTopic && msg.payload === context.forcePayloadOn) {
				sendMsgCmdFunc(context.lightSetOn = true);
				context.lockedOn = true;
				clearTimeout(onTimeoutHandle);
				// message: force off
			} else if (msg.topic === config.forceTopic && msg.payload === context.forcePayloadOff) {
				sendMsgCmdFunc(context.lightSetOn = false);
				context.lockedOn = false;
				clearTimeout(onTimeoutHandle);
				// message: feedback on
			} else if (config.feedbackActive && msg.topic === config.feedbackTopic && msg.payload === context.feedbackPayloadOn) {
				context.lightIsOn = true;
				context.lightSetOn = true;
				// message: feedback off
			} else if (config.feedbackActive && msg.topic === config.feedbackTopic && msg.payload === context.feedbackPayloadOff) {
				context.lightIsOn = false;
				context.lightSetOn = false;
				context.lockedOn = false;
				clearTimeout(onTimeoutHandle);
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
