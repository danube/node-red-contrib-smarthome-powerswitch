module.exports = function(RED) {
	function MyTemplateNode(config) {

		RED.nodes.createNode(this,config);
		var nodeContext = this.context();
		var err = false;

		this.on('input', function(msg,send,done) {

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

	RED.nodes.registerType("mytemplate",MyTemplateNode);
}