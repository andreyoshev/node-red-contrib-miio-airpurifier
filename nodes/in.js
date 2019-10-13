const miio = require('miio');

module.exports = function (RED) {
    class MiioAirpurifierInput {
        constructor(n) {
            RED.nodes.createNode(this, n);

            var node = this;
            node.config = n;

            node.setMaxListeners(255);
            node.on('close', () => this.onClose());

            if (node.config.ip && node.config.token) {
                node.connect().then(result => {
                    node.getStatus(true).then(result => {

                    });
                });

                node.refreshStatusTimer = setInterval(function () {
                    node.getStatus(true);
                }, 10000);
            }
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

        getStatus(force = false) {
            var node = this;

            return new Promise(function (resolve, reject) {
                if (force) {
                    if (node.device !== null) {
                        node.device.call("get_prop", ["mode", "filter1_life", "aqi", "child_lock", "power", "favorite_level", "temp_dec", "humidity"], [])
                            .then(device => {
                                node.send([{
                                        'air': node.formatAirQuality(device)
                                    },
                                    {
                                        'payload': node.formatHomeKit(device)
                                    }
                                ]);
                            }).catch(err => {
                                console.log('Encountered an error while controlling device');
                                console.log('Error(2) was:');
                                console.log(err.message);
                                node.connect();
                                reject(err);
                            });
                    } else {
                        node.connect();
                        reject('No device');
                    }
                } else {
                    resolve();
                }
            });
        }

        formatHomeKit(result) {
            var msg = {};

            if (result[4] === "on") {
                msg.Active = 1;
                msg.CurrentAirPurifierState = 2;
            } else if (result[4] === "off") {
                msg.Active = 0;
                msg.CurrentAirPurifierState = 0;
            }

            if (result[0] === "favorite") {
                msg.TargetAirPurifierState = 1;
            } else {
                msg.TargetAirPurifierState = 0;
            }

            if (result[3] === "on") {
                msg.LockPhysicalControls = 1;
            } else if (result[3] === "off") {
                msg.LockPhysicalControls = 0;
            }

            if (result[1] < 5) {
                msg.FilterChangeIndication = 1;
            } else {
                msg.FilterChangeIndication = 0;
            }

            msg.FilterLifeLevel = result[1];
            msg.PM2_5Density = result[2];
            msg.RotationSpeed = result[5] * 10;
            msg.CurrentTemperature = result[6];
            msg.CurrentRelativeHumidity = result[7];

            return msg;
        }

        formatAirQuality(result) {
            var msg = {};

            if (result[2] <= 50) {
                msg.AirQuality = 1;
            } else if (result[2] > 50 && result[2] <= 100) {
                msg.AirQuality = 2;
            } else if (result[2] > 100 && result[2] <= 200) {
                msg.AirQuality = 3;
            } else if (result[2] > 200 && result[2] <= 300) {
                msg.AirQuality = 4;
            } else if (result[2] > 300) {
                msg.AirQuality = 5;
            } else {
                msg.AirQuality = 0;
            }

            return msg;
        }

        getModeByRotationSpeed(value) {
            var mode = 'low';

            if (value > 0 && value <= 25) {
                mode = 'low';
            } else if (value > 25 && value <= 50) {
                mode = 'medium';
            } else if (value > 50 && value <= 70) {
                mode = 'high';
            } else if (value > 75 && value <= 100) {
                mode = 'strong';
            }

            return mode;
        }
    }

    RED.nodes.registerType('miio-airpurifier-input', MiioAirpurifierInput, {});
};