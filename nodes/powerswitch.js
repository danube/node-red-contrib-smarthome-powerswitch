module.exports = function(RED) {
	function PowerSwitchNode(config) {
		RED.nodes.createNode(this, config);
		
		/**
		 * The context of this node.
		 * @param {any} togglePayload Expected 'toggle' payload, type converted.
		 * @param {any} motionPayloadOn Expected 'motion on' payload, type converted.
		 * @param {any} motionPayloadOff Expected 'motion off' payload, type converted.
		 * @param {any} feedbackPayloadOn Expected 'feedback on' payload, type converted.
		 * @param {any} feedbackPayloadOff Expected 'feedback off' payload, type converted.
		 * @param {any} forcePayloadOn Expected 'force on' payload, type converted.
		 * @param {any} forcePayloadOff Expected 'force off' payload, type converted.
		 * @param {any} absTimeoutValue Absolute timeout time, converted to miliseconds.
		 * @param {any} motionTimeoutValue Motion timeout time, converted to miliseconds.
		 * @param {any} lightSetOn Instructing switch to turn on.
		 * @param {any} lightIsOn Received switch feedback (if configured with 'feedbackActive').
		 * @param {any} lockedOn Switch is powered on and may not be powered off by motion timeout.
		 * @param {any} motions Motion telegram up/down counter (+1 on true, -1 on false).
		 */
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
			
			function motionTimeoutFunc() {
				sendMsgCmdFunc(context.lightSetOn = false, "Motion timeout");
				setNodeState();
			}

			function absTimeoutFunc() {
				sendMsgCmdFunc(context.lightSetOn = false, "Absolute timeout");
				setNodeState();
				if (!config.feedbackActive) {
					context.lockedOn = false
				}
			}

			function sendMsgCmdFunc(command, reason) {
				msgCmd = {
					topic: "command",
					payload: command
				}
				clearTimeout(absTimeoutHandle);
				clearTimeout(motionTimeoutHandle);
				if (command && context.absTimeoutValue > 0) {
					absTimeoutHandle = setTimeout(absTimeoutFunc, context.absTimeoutValue);
				}
				if (!config.feedbackActive) {
					context.lightIsOn = command;
				}
				if (context.motions < 0 || !command) {		// v1.0.4: Added !command to reset counter on command. This fixes issues if telegrams are lost and counter gets fuzzed.
					context.motions = 0;
				}
				nodeThis.send(msgCmd);
				sendMsgDebugFunc(reason);
			}

			function setNodeState() {
				if (context.lightIsOn && !context.lightSetOn) {
					nodeThis.status({fill:"red",shape:"ring",text:"powering off"});
				} else if (context.lightIsOn && context.lightSetOn) {
					nodeThis.status({fill:"green",shape:"dot",text:"on"});
				} else if (!context.lightIsOn && !context.lightSetOn) {
					nodeThis.status({fill:"red",shape:"dot",text:"off"});
				} else if (!context.lightIsOn && context.lightSetOn) {
					nodeThis.status({fill:"green",shape:"ring",text:"powering on"});
				}
			}

			function sendMsgDebugFunc(reason) {
				if (msg.debug) {
					msgDebug = {
						topic: "debug",
						inmsg: msg,
						config: config,
						context: context,
						reason: reason
					}
					nodeThis.send(msgDebug);
				}
			}

			// message: toggle
			if (msg.topic === config.toggleTopic && msg.payload === context.togglePayload) {
				sendMsgCmdFunc(context.lightSetOn = !context.lightIsOn, "Toggle message");
				context.lockedOn = context.lightSetOn;
			// message: motion on
			} else if (msg.topic === config.motionTopic && msg.payload === context.motionPayloadOn && !context.lockedOn) {
				sendMsgCmdFunc(context.lightSetOn = true, "Motion on message");
				if (isNaN(context.motions)) {
					context.motions = 1;
				} else {
					context.motions += 1;
				}
			// message: motion off
			} else if (msg.topic === config.motionTopic && msg.payload === context.motionPayloadOff && !context.lockedOn) {
				context.motions -= 1;
				if (config.motionTimeoutOverride) {
					if (msg.timeout === 0) {
						nodeThis.warn("msg.timeout is zero which is invalid. Falling back to configured value (" + context.motionTimeoutValue + "ms).")
					} else if (!msg.timeout) {
						nodeThis.warn("msg.timeout not set in message. Falling back to configured value (" + context.motionTimeoutValue + "ms).")
					} else if (typeof(msg.timeout) != "number") {
						nodeThis.warn("msg.timeout must be of type 'number' but is '" + typeof(msg.timeout) + "'")
					} else if (msg.timeout < 0) {
						nodeThis.warn("msg.timeout is negative (" + msg.timeout + ") which is invalid. Falling back to configured value (" + context.motionTimeoutValue + "ms).")
					} else {
						context.motionTimeoutValue = msg.timeout
					}
				}
				if (context.motions <= 0) {
					motionTimeoutHandle = setTimeout(motionTimeoutFunc, context.motionTimeoutValue);
				}
				sendMsgDebugFunc("Motion off message");
			// message: force on
			} else if (msg.topic === config.forceTopic && msg.payload === context.forcePayloadOn) {
				sendMsgCmdFunc(context.lightSetOn = true, "Force on message");
				context.lockedOn = true;
			// message: force off
			} else if (msg.topic === config.forceTopic && msg.payload === context.forcePayloadOff) {
				sendMsgCmdFunc(context.lightSetOn = false, "Force off message");
				context.lockedOn = false;
			// message: feedback on
			} else if (config.feedbackActive && msg.topic === config.feedbackTopic && msg.payload === context.feedbackPayloadOn) {
				context.lightIsOn = true;
				context.lightSetOn = true;
			// message: feedback off
			} else if (config.feedbackActive && msg.topic === config.feedbackTopic && msg.payload === context.feedbackPayloadOff) {
				context.lightIsOn = false;
				context.lightSetOn = false;
				context.lockedOn = false;
			// message: debug
			} else if (msg.debug) {
				sendMsgDebugFunc("Debug solo");
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

			this.context = context;

		});

	}

	RED.nodes.registerType("powerswitch",PowerSwitchNode);
}
