module.exports = function(RED) {
	function Sandbox(config) {

		RED.nodes.createNode(this,config);
		var nodeContext = this.context();
		var nodeThis = this;
		var err = false;
		var myTimeout;

		this.on('input', function(msg,send,done) {

			function myFunc() {
				nodeThis.warn("inside!");
			}			

			if (msg.payload === "start") {
				myTimeout = setTimeout(myFunc,3000);
			} else if (msg.payload === "stop") {
				clearTimeout(myTimeout);
			}

 			msgDebug = {
				topic: "debug",
				inMessage: msg,
				nodeContext: nodeContext
			};

			this.send([null,msgDebug]);

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

	RED.nodes.registerType("sandbox",Sandbox);
}