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

                if (isSet(payload.Active)) {
                    var value = payload.Active;
                    node.device.call("set_power", [Boolean(value) ? "on" : "off"]);
                }

                if (isSet(payload.LockPhysicalControls)) {
                    var value = payload.LockPhysicalControls;
                    node.device.call("set_child_lock", [Boolean(value) ? "on" : "off"]);
                }

                if (isSet(payload.TargetAirPurifierState)) {
                    var value = payload.TargetAirPurifierState;
                    node.TargetAirPurifierState = value;

                    node.device.call("set_mode", [value == 1 ? (node.SwingMode == 1 ? "silent" : "auto") : "favorite"]);
                }

                if (isSet(payload.SwingMode)) {
                    var value = payload.SwingMode;
                    node.SwingMode = value;

                    node.device.call("set_mode", [value == 1 ? "silent" : node.TargetAirPurifierState == 1 ? "auto" : "favorite"]);
                }

                if (isSet(payload.RotationSpeed)) {
                    var value = payload.RotationSpeed;
                    if (value == 0) {} else {
                        node.device.call("set_level_favorite", parseInt(value * 0.17)).then(result => {
                            if (result[0] === "ok") {} else {
                                console.log(new Error(result[0]));
                            }
                        }).catch(function (err) {
                            console.log(err);
                        })
                    }
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