const miio = require('miio');

function isSet(value) {
    return typeof value !== 'undefined' && value != null;
}

module.exports = function (RED) {
    class MiioHumidifierOutput {
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

                if (isSet(payload.RelativeHumidityHumidifierThreshold)) {
                    var value = payload.RelativeHumidityHumidifierThreshold;
                    if (value > 0 && value <= 40) {
                        value = 40;
                    } else if (value > 80 && value <= 100) {
                        value = 80;
                    }
                    node.device.call("set_limit_hum", [value]);
                }

                if (isSet(payload.Active)) {
                    var value = payload.Active;
                    node.device.call("set_power", [Boolean(value) ? "on" : "off"])
                }

                if (isSet(payload.SwingMode)) {
                    var value = payload.SwingMode;
                    node.device.call("set_dry", [Boolean(value) ? "on" : "off"])
                }

                if (isSet(payload.LockPhysicalControls)) {
                    var value = payload.LockPhysicalControls;
                    node.device.call("set_child_lock", [Boolean(value) ? "on" : "off"])
                }

                if (isSet(payload.RotationSpeed)) {
                    var value = payload.RotationSpeed;
                    if (value == 25) {
                        node.device.call("set_mode", ["auto"]).then(result => {
                            if (result[0] === "ok") {} else {
                                console.log(new Error(result[0]));
                            }
                        }).catch(function (err) {
                            console.log(err);
                        });
                    } else if (value == 50) {
                        node.device.call("set_mode", ["silent"]).then(result => {
                            if (result[0] === "ok") {} else {
                                console.log(new Error(result[0]));
                            }
                        }).catch(function (err) {
                            console.log(err);
                        });
                    } else if (value == 75) {
                        node.device.call("set_mode", ["medium"]).then(result => {
                            if (result[0] === "ok") {} else {
                                console.log(new Error(result[0]));
                            }
                        }).catch(function (err) {
                            console.log(err);
                        });
                    } else if (value == 100) {
                        node.device.call("set_mode", ["high"]).then(result => {
                            if (result[0] === "ok") {} else {
                                console.log(new Error(result[0]));
                            }
                        }).catch(function (err) {
                            console.log(err);
                        });
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
                        node.log('Miio Humidifier: Initialized');
                    });

                    node.device.on('thing:destroyed', () => {
                        node.log('Miio Humidifier: Destroyed');
                    });

                    resolve(device);
                }).catch(err => {
                    node.warn('Miio Humidifier Error: ' + err.message);
                    reject(err);
                });
            });
        }
    }

    RED.nodes.registerType('miio-humidifier-output', MiioHumidifierOutput);
};