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
		var absTimeoutHandle, motionTimeoutHandle;
		var msgCmd, msgDebug = null;

		this.on('input', function(msg,send,done) {

			config.toggleTopic = config.toggleTopic || "toggle";
			config.motionTopic = config.motionTopic || "motion";
			config.feedbackTopic = config.feedbackTopic || "feedback";
			config.forceTopic = config.forceTopic || "force";

			// convert config string: toggle payload
			if (config.togglePayloadType === 'num') {context.togglePayload = Number(config.togglePayload)}
			else if (config.togglePayloadType === 'bool') {context.togglePayload = config.togglePayload === 'true'}
			else {context.togglePayload = config.togglePayload};

			// convert config string: motion on payload
			if (config.motionPayloadOnType === 'num') {context.motionPayloadOn = Number(config.motionPayloadOn)}
			else if (config.motionPayloadOnType === 'bool') {context.motionPayloadOn = config.motionPayloadOn === 'true'}
			else {context.motionPayloadOn = config.motionPayloadOn};

			// convert config string: motion off payload
			if (config.motionPayloadOffType === 'num') {context.motionPayloadOff = Number(config.motionPayloadOff)}
			else if (config.motionPayloadOffType === 'bool') {context.motionPayloadOff = config.motionPayloadOff === 'true'}
			else {context.motionPayloadOff = config.motionPayloadOff};

			// convert config string: feedback on payload
			if (config.feedbackPayloadOnType === 'num') {context.feedbackPayloadOn = Number(config.feedbackPayloadOn)}
			else if (config.feedbackPayloadOnType === 'bool') {context.feedbackPayloadOn = config.feedbackPayloadOn === 'true'}
			else {context.feedbackPayloadOn = config.feedbackPayloadOn};

			// convert config string: feedback off payload
			if (config.feedbackPayloadOffType === 'num') {context.feedbackPayloadOff = Number(config.feedbackPayloadOff)}
			else if (config.feedbackPayloadOffType === 'bool') {context.feedbackPayloadOff = config.feedbackPayloadOff === 'true'}
			else {context.feedbackPayloadOff = config.feedbackPayloadOff};

			// convert config string: force on payload
			if (config.forcePayloadOnType === 'num') {context.forcePayloadOn = Number(config.forcePayloadOn)}
			else if (config.forcePayloadOnType === 'bool') {context.forcePayloadOn = config.forcePayloadOn === 'true'}
			else {context.forcePayloadOn = config.forcePayloadOn};

			// convert config string: force off payload
			if (config.forcePayloadOffType === 'num') {context.forcePayloadOff = Number(config.forcePayloadOff)}
			else if (config.forcePayloadOffType === 'bool') {context.forcePayloadOff = config.forcePayloadOff === 'true'}
			else {context.forcePayloadOff = config.forcePayloadOff};

			// convert absTimeout variables
			if (config.absTimeoutActive && config.absTimeoutUnit === "h") {context.absTimeoutValue = config.absTimeoutValue * 3600000}
			else if (config.absTimeoutActive && config.absTimeoutUnit === "m") {context.absTimeoutValue = config.absTimeoutValue * 60000}
			else if (config.absTimeoutActive && config.absTimeoutUnit === "s") {context.absTimeoutValue = config.absTimeoutValue * 1000}
			else {context.absTimeoutValue = 0}
			
			// convert motionTimeout variables
			if (config.motionTimeoutUnit === "h") {context.motionTimeoutValue = config.motionTimeoutValue * 3600000}
			else if (config.motionTimeoutUnit === "m") {context.motionTimeoutValue = config.motionTimeoutValue * 60000}
			else if (config.motionTimeoutUnit === "s") {context.motionTimeoutValue = config.motionTimeoutValue * 1000}
			else {context.motionTimeoutValue = 0}
			
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
				clearTimeout(motionTimeoutHandle);
			// message: motion on
			} else if (msg.topic === config.motionTopic && msg.payload === context.motionPayloadOn && !context.lockedOn) {
				sendMsgCmdFunc(context.lightSetOn = true);
			// message: motion off
			} else if (msg.topic === config.motionTopic && msg.payload === context.motionPayloadOff && !context.lockedOn) {
				motionTimeoutHandle = setTimeout(timeoutFunc, context.motionTimeoutValue);
			// message: force on
			} else if (msg.topic === config.forceTopic && msg.payload === context.forcePayloadOn) {
				sendMsgCmdFunc(context.lightSetOn = true);
				context.lockedOn = true;
				clearTimeout(motionTimeoutHandle);
			// message: force off
			} else if (msg.topic === config.forceTopic && msg.payload === context.forcePayloadOff) {
				sendMsgCmdFunc(context.lightSetOn = false);
				context.lockedOn = false;
				clearTimeout(motionTimeoutHandle);
			// message: feedback on
			} else if (config.feedbackActive && msg.topic === config.feedbackTopic && msg.payload === context.feedbackPayloadOn) {
				context.lightIsOn = true;
				context.lightSetOn = true;
			// message: feedback off
			} else if (config.feedbackActive && msg.topic === config.feedbackTopic && msg.payload === context.feedbackPayloadOff) {
				context.lightIsOn = false;
				context.lightSetOn = false;
				context.lockedOn = false;
				clearTimeout(motionTimeoutHandle);
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
