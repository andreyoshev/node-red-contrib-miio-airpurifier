const miio = require('miio');

function isSet(value) {
    return typeof value !== 'undefined' && value != null;
}

module.exports = function (RED) {
    class MiioAirpurifierOutput {
        constructor(config) {
            RED.nodes.createNode(this, config);

            var node = this;
            node.config = config;
            node.payload = config.payload;

            node.connect().then(result => {

            });

            this.on('input', function (message) {
                if (!node.device) {
                    console.log('NO DEVICE FOUND');
                    return;
                }

                var payload = message.payload;

                if (payload == null || payload == 'undefined') {
                    return;
                }

                console.log(payload);

                if (isSet(payload.Active)) {
                    var value = payload.Active;
                    node.device.call("set_power", [Boolean(value) ? "on" : "off"])
                }
            });
        }

        onClose() {
            var that = this;

            if (that.device) {
                that.device.destroy();
                that.device = null;
            }
        }

        connect() {
            var node = this;

            return new Promise(function (resolve, reject) {
                node.miio = miio.device({
                    address: node.config.ip,
                    token: node.config.token
                }).then(device => {
                    node.device = device;
                    node.device.updateMaxPollFailures(0);

                    node.device.on('thing:initialized', () => {
                        node.log('Miio Airpurifier: Initialized');
                    });

                    node.device.on('thing:destroyed', () => {
                        node.log('Miio Airpurifier: Destroyed');
                    });

                    resolve(device);
                }).catch(err => {
                    node.warn('Miio Airpurifier Error: ' + err.message);
                    reject(err);
                });
            });
        }
    }

    RED.nodes.registerType('miio-airpurifier-output', MiioAirpurifierOutput);
};