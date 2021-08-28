module.exports = function(RED) {
    function LightSwitchNode(config) {

        RED.nodes.createNode(this,config);
        var nodeContext = this.context();
        var err = false;
        var lightSetOn;
        var msgCmd,msg2,msg3,msgDebug = null;

        this.on('input', function(msg,send,done) {

            if (msg.topic === config.topicButton) {
                // button pressed
                lightSetOn = !nodeContext.lightIsOn;
                msgCmd = {
                    topic: "command",
                    payload: lightSetOn
                }
                this.send([msgCmd,null,null,null]);
            } else if (msg.topic === config.topicFeedback) {
                // feedback received
                nodeContext.lightIsOn = msg.payload;

                if (nodeContext.lightIsOn) {
                    this.status({fill:"green",shape:"dot",text:"on"});
                } else {
                    this.status({fill:"red",shape:"ring",text:"off"});
                }
            }

            msgDebug = {
                topic: "debug",
                inMessage: msg,
                context: nodeContext
            };

            this.send([null,null,null,msgDebug]);

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

    RED.nodes.registerType("lightswitch",LightSwitchNode);
}
