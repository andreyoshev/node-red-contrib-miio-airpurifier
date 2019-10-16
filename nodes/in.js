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
                        node.device.loadProperties(["mode", "filter1_life", "aqi", "child_lock", "power", "favorite_level", "temp_dec", "humidity"])
                            .then(device => {
                                node.send([{
                                        'payload': node.formatAirQuality(device)
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

            if (result.power === "on") {
                msg.Active = 1;
                msg.CurrentAirPurifierState = 2;
            } else if (result.power === "off") {
                msg.Active = 0;
                msg.CurrentAirPurifierState = 0;
            }

            if (result.mode === "favorite") {
                msg.TargetAirPurifierState = 0;
            } else {
                msg.TargetAirPurifierState = 1;
            }

            if (result.mode == "silent") {
                msg.SwingMode = 1;
                msg.TargetAirPurifierState = 1;
            } else {
                msg.SwingMode = 0;
            }

            if (result.child_lock === "on") {
                msg.LockPhysicalControls = 1;
            } else if (result.child_lock === "off") {
                msg.LockPhysicalControls = 0;
            }

            if (result.filter1_life < 5) {
                msg.FilterChangeIndication = 1;
            } else {
                msg.FilterChangeIndication = 0;
            }

            msg.FilterLifeLevel = result.filter1_life;
            msg.RotationSpeed = parseInt(result.favorite_level * 100 / 52);
            msg.CurrentTemperature = result.temp_dec;
            msg.CurrentRelativeHumidity = result.humidity;

            return msg;
        }

        formatAirQuality(result) {
            var msg = {};

            msg.PM2_5Density = result.aqi;

            if (result.aqi <= 50) {
                msg.AirQuality = 1;
            } else if (result.aqi > 50 && result.aqi <= 100) {
                msg.AirQuality = 2;
            } else if (result.aqi > 100 && result.aqi <= 200) {
                msg.AirQuality = 3;
            } else if (result.aqi > 200 && result.aqi <= 300) {
                msg.AirQuality = 4;
            } else if (result.aqi > 300) {
                msg.AirQuality = 5;
            } else {
                msg.AirQuality = 0;
            }

            return msg;
        }
    }

    RED.nodes.registerType('miio-airpurifier-input', MiioAirpurifierInput, {});
};