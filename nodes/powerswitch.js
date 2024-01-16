module.exports = function(RED) {

	/** Config node */
	function PowerswitchConfigNode(node) {
		RED.nodes.createNode(this, node)
		this.config = node
	}
	RED.nodes.registerType("powerswitch configuration",PowerswitchConfigNode)

	
	/** Working node */
	function PowerSwitchNode(node) {
		RED.nodes.createNode(this, node);
		const that = this
		
		/** This is the content of the associated configuration node, including all necessary conversions. */
		let config = {}
		config = RED.nodes.getNode(node.configSet).config
		
		/**
		 * The context of this node
		 * @param {any} togglePayload Expected 'toggle' payload, type converted.
		 * @param {any} motionPayloadOn Expected 'motion on' payload, type converted.
		 * @param {any} motionOnIgnoreTime Time how long motions are ignored after powering off, converted to miliseconds.
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
		 * @param {any} lastReason Reason for previous message
		 */
		var context = this.context()
		var err = false
		var absTimeoutHandle, motionTimeoutHandle, ignoreMotionDelayHandle
		var msgCmd, msgDebug = null
		let lockForceOn = false

		this.on('input', function(msg,send,done) {

			// Set unconfigured parameters
			config.toggleTopic = config.toggleTopic || "toggle"
			config.motionTopic = config.motionTopic || "motion"
			config.feedbackTopic = config.feedbackTopic || "feedback"
			config.forceTopic = config.forceTopic || "force"
			config.outputTopic = config.outputTopic || "command"
			config.outputPayloadOn = config.outputPayloadOn || "true"
			config.outputPayloadOff = config.outputPayloadOff || "false"

			// Why "initval"?
			// Until v1.0.11 there was "initval" in the HTML, which has been overwritten via oneditprepare.
			// This has been removed from v1.1.0. "initval" will still be checked, if old versions are in the field.

			// Convert config string: toggle payload
			if (config.togglePayloadType === 'num') {
				context.togglePayload = Number(config.togglePayload)
			} else if (config.togglePayloadType === "initval" || config.togglePayloadType === 'bool') {
				context.togglePayload = config.togglePayload == 'true' || config.togglePayload == true
			} else {context.togglePayload = config.togglePayload};

			// Convert config string: motion on payload
			if (config.motionPayloadOnType === 'num') {
				context.motionPayloadOn = Number(config.motionPayloadOn)
			} else if (config.motionPayloadOnType === "initval" || config.motionPayloadOnType === 'bool') {
				context.motionPayloadOn = config.motionPayloadOn == 'true' || config.motionPayloadOn == true
			} else {context.motionPayloadOn = config.motionPayloadOn};

			// Convert config string: motion off payload
			if (config.motionPayloadOffType === 'num') {
				context.motionPayloadOff = Number(config.motionPayloadOff)
			} else if (config.motionPayloadOffType === "initval" || config.motionPayloadOffType === 'bool') {
				context.motionPayloadOff = config.motionPayloadOff == 'true' || config.motionPayloadOff == true
			} else {context.motionPayloadOff = config.motionPayloadOff};

			// Convert config string: feedback on payload
			if (config.feedbackPayloadOnType === 'num') {
				context.feedbackPayloadOn = Number(config.feedbackPayloadOn)
			} else if (config.feedbackPayloadOnType === "initval" || config.feedbackPayloadOnType === 'bool') {
				context.feedbackPayloadOn = config.feedbackPayloadOn == 'true' || config.feedbackPayloadOn == true
			} else {context.feedbackPayloadOn = config.feedbackPayloadOn};

			// Convert config string: feedback off payload
			if (config.feedbackPayloadOffType === 'num') {
				context.feedbackPayloadOff = Number(config.feedbackPayloadOff)
			} else if (config.feedbackPayloadOffType === "initval" || config.feedbackPayloadOffType === 'bool') {
				context.feedbackPayloadOff = config.feedbackPayloadOff == 'true' || config.feedbackPayloadOff == true
			} else {context.feedbackPayloadOff = config.feedbackPayloadOff};

			// Convert config string: force on payload
			if (config.forcePayloadOnType === 'num') {
				context.forcePayloadOn = Number(config.forcePayloadOn)
			} else if (config.forcePayloadOnType === "initval" || config.forcePayloadOnType === 'bool') {
				context.forcePayloadOn = config.forcePayloadOn == 'true' || config.forcePayloadOn == true
			} else {context.forcePayloadOn = config.forcePayloadOn};

			// Convert config string: force off payload
			if (config.forcePayloadOffType === 'num') {
				context.forcePayloadOff = Number(config.forcePayloadOff)
			} else if (config.forcePayloadOffType === "initval" || config.forcePayloadOffType === 'bool') {
				context.forcePayloadOff = config.forcePayloadOff == 'true' || config.forcePayloadOff == true
			} else {context.forcePayloadOff = config.forcePayloadOff};

			// Convert absTimeout variables
			if (config.absTimeoutActive && config.absTimeoutUnit === "h") {context.absTimeoutValue = config.absTimeoutValue * 3600000}
			else if (config.absTimeoutActive && config.absTimeoutUnit === "m") {context.absTimeoutValue = config.absTimeoutValue * 60000}
			else if (config.absTimeoutActive && config.absTimeoutUnit === "s") {context.absTimeoutValue = config.absTimeoutValue * 1000}
			else {context.absTimeoutValue = 0}

			// Convert motionOnIgnoreTime to ms
			context.motionOnIgnoreTime = config.motionOnIgnoreTime * 1000
			
			// Convert motionTimeout variables
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

			function ignoreMotionDelayFunc() {
				ignoreMotionDelayHandle = null
				// that.warn("Off delay ended")		// TODO needed?
			}

			function sendMsgCmdFunc(command, reason) {
				reason == "Motion on message" && config.motionOverridesForceOn ? lockForceOn = true : lockForceOn = false
				let convertedCommand = command

				if (command) {		// power on
					if (config.outputPayloadOnType == 'num') {convertedCommand = Number(config.outputPayloadOn)}
					else if (config.outputPayloadOnType == 'str') {convertedCommand = config.outputPayloadOn}
					else if (config.outputPayloadOn == 'false') {convertedCommand = false}
					// if (ignoreMotionDelayHandle) {that.warn("Off delay cancelled")}		// TODO needed?
					clearTimeout(ignoreMotionDelayHandle)
					ignoreMotionDelayHandle = null
				} else {
					if (config.outputPayloadOffType == 'num') {convertedCommand = Number(config.outputPayloadOff)}
					else if (config.outputPayloadOffType == 'str') {convertedCommand = config.outputPayloadOff}
					else if (config.outputPayloadOff == 'true') {convertedCommand = true}
				}
				
				msgCmd = {
					topic: config.outputTopic,
					payload: convertedCommand
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

				// Power off via toggle or force
				if (((reason == "Toggle message" && !command) || reason == "Force off message") && config.motionOnIgnoreActive && !ignoreMotionDelayHandle) {
					ignoreMotionDelayHandle = setTimeout(ignoreMotionDelayFunc, context.motionOnIgnoreTime)
					// that.warn("Off delay started")		// TODO needed?
				}

				that.send(msgCmd);
				if (msg.debug) {sendMsgDebugFunc(reason)}
				context.lastReason = reason
			}

			function setNodeState() {
				const now = new Date
				const options = {
					month: 'numeric',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric'
				}
				const timestamp = now.toLocaleDateString(undefined, options)		// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString

				if (context.lightIsOn && !context.lightSetOn) {
					that.status({fill: "red", shape: "ring", text: "Powering Off (" + timestamp + ")"});
				} else if (context.lightIsOn && context.lightSetOn) {
					that.status({fill: "green", shape: "dot", text: "On (" + timestamp + ")"});
				} else if (!context.lightIsOn && !context.lightSetOn) {
					that.status({fill: "red", shape: "dot", text: "Off (" + timestamp + ")"});
				} else if (!context.lightIsOn && context.lightSetOn) {
					that.status({fill: "green", shape: "ring", text: "Powering On (" + timestamp + ")"});
				}
			}

			function sendMsgDebugFunc(reason) {
				msgDebug = {
					topic: "debug",
					reason: reason,
					inmsg: msg,
					config: config,
					context: context
				}
				that.send(msgDebug)
			}

			// Message: Toggle
			if (msg.topic === config.toggleTopic && msg.payload === context.togglePayload) {
				sendMsgCmdFunc(context.lightSetOn = !context.lightIsOn, "Toggle message");
				context.lockedOn = context.lightSetOn;
			}

			// Message: Motion on
			else if (msg.topic === config.motionTopic && msg.payload === context.motionPayloadOn && !context.lockedOn) {
				if (ignoreMotionDelayHandle) {
					if (msg.debug) {that.warn("Powering on not yet allowed (config.motionOnIgnoreActive)")}
				} else {
					sendMsgCmdFunc(context.lightSetOn = true, "Motion on message");
					if (isNaN(context.motions)) {
						context.motions = 1;
					} else {
						context.motions += 1;
					}
				}
			}
			
			// Message: Motion off
			else if (msg.topic === config.motionTopic && msg.payload === context.motionPayloadOff && !context.lockedOn) {
				context.motions -= 1;
				if (config.motionTimeoutOverride) {
					if (msg.timeout === 0) {
						that.warn("msg.timeout is zero which is invalid. Falling back to configured value (" + context.motionTimeoutValue + "ms).")
					} else if (!msg.timeout) {
						that.warn("msg.timeout not set in message. Falling back to configured value (" + context.motionTimeoutValue + "ms).")
					} else if (typeof(msg.timeout) != "number") {
						that.warn("msg.timeout must be of type 'number' but is '" + typeof(msg.timeout) + "'")
					} else if (msg.timeout < 0) {
						that.warn("msg.timeout is negative (" + msg.timeout + ") which is invalid. Falling back to configured value (" + context.motionTimeoutValue + "ms).")
					} else {
						context.motionTimeoutValue = msg.timeout
					}
				}
				if (context.motions <= 0) {
					motionTimeoutHandle = setTimeout(motionTimeoutFunc, context.motionTimeoutValue);
				}
				if (msg.debug) {sendMsgDebugFunc("Motion off message")}
			}
			
			// Message: force on
			else if (msg.topic === config.forceTopic && msg.payload === context.forcePayloadOn) {
				if (lockForceOn) {
					// do nothing, https://github.com/danube/node-red-contrib-smarthome-powerswitch/issues/13
					if (msg.debug) {that.warn("Ignoring 'force on' message while powered on (config.motionOverridesForceOn)")}
				} else {
					sendMsgCmdFunc(context.lightSetOn = true, "Force on message");
					context.lockedOn = true;
				}
			}
			
			// Message: force off
			else if (msg.topic === config.forceTopic && msg.payload === context.forcePayloadOff) {
				sendMsgCmdFunc(context.lightSetOn = false, "Force off message");
				context.lockedOn = false;
			}
			
			// Message: feedback on
			else if (config.feedbackActive && msg.topic === config.feedbackTopic && msg.payload === context.feedbackPayloadOn) {
				context.lightIsOn = true;
				context.lightSetOn = true;
			}
			
			// Message: feedback off
			else if (config.feedbackActive && msg.topic === config.feedbackTopic && msg.payload === context.feedbackPayloadOff) {
				context.lightIsOn = false;
				context.lightSetOn = false;
				context.lockedOn = false;
			}

			// message: unallowed attempt to power off
			else if (context.lockedOn && msg.debug) {
				that.warn("Switch is powered on and may not be powered off by motion timeout (context.lockedOn)")
			}

			// message: unknown or solo debug
			else {
				if (msg.debug) {
					sendMsgDebugFunc("Debug solo")
				}
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
