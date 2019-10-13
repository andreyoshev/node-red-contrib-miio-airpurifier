Node for Smartmi humidifier.
zhimi.humidifier.ca1.

```json
{
	"Active": {},
	"CurrentRelativeHumidity" : {},
	"WaterLevel": {},
	"LockPhysicalControls": {},
	"SwingMode": {},
    "TargetHeatingCoolingState": {
        "validValues": [0, 1, 3]
    },
    "CurrentHumidifierDehumidifierState": {
        "validValues": [0, 2]
    },
    "TargetHumidifierDehumidifierState": {
        "validValues": [1]
    }, 
    "RelativeHumidityHumidifierThreshold": {
    	"minValue": 0,
        "maxValue": 100,
        "minStep": 10
    },
    "RotationSpeed": {
        "minValue": 0,
         "maxValue": 100,
         "minStep": 25
    }
}
```

HomeKit characteristic properties.