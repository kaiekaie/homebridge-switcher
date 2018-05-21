var Service, Characteristic,all;

var sentCodes = [];


const Serial = require('./sp');
const PQueue = require('p-queue');
var memwatch = require('memwatch-next');

const queue = new PQueue({concurrency: 3});
let  sp;
require('events').EventEmitter.prototype._maxListeners = 100;



function ArduinoSwitchPlatform(log, config) {
    var self = this;
    self.config = config;
    self.log = log;

}

memwatch.on('leak', function(info) {

console.log(info)

 });

ArduinoSwitchPlatform.prototype.accessories = function(callback) {
    var self = this;
     all = this;
    self.accessories = [];

  

    self.config.lights.forEach(function(sw) {
        self.accessories.push(new ArduinoLightAccessory(sw, self.log, self.config));
    });
 
    self.config.buttons.forEach(function(sw) {
        self.accessories.push(new ArduinoButtonAccessory(sw, self.log, self.config));
    });
    self.config.HumiditySensor.forEach(function(sw) {
        self.accessories.push(new ArduinoHumiditySensorAccessory(sw, self.log, self.config));
    });
        sp = new Serial( self.config.serial_port_in)
    callback(self.accessories);
}

function ArduinoHumiditySensorAccessory (sw, log, config){
    var self = this;
    self.name = sw.name;
    self.sw = sw;
    self.log = log;
    self.config = config;

    self.service = new Service.HumiditySensor(self.name);
    self.service.setCharacteristic(Characteristic.CurrentRelativeHumidity ,10)
    self.service.setCharacteristic(Characteristic.StatusActive ,true)
  
}

ArduinoHumiditySensorAccessory.prototype.getServices = function() {
    var self = this;
    var services = [];
    var service = new Service.AccessoryInformation();
    service.setCharacteristic(Characteristic.Name, self.name)

    .setCharacteristic(Characteristic.Manufacturer, "sensor")
    .setCharacteristic(Characteristic.Model, "asd")
    .setCharacteristic(Characteristic.SerialNumber, "213")
    .setCharacteristic(Characteristic.FirmwareRevision, process.env.version)
    .setCharacteristic(Characteristic.HardwareRevision, '1.0.0');
    services.push(service);
    services.push(self.service);
    return services;
}

function ArduinoButtonAccessory(sw, log, config) {
    var self = this;
    self.name = sw.name;
    self.sw = sw;
    self.log = log;
    self.config = config;
    self.currentState = false;
    self.throttle = config.throttle?config.throttle:500;

    self.service = new Service.Switch(self.name);

    self.service.getCharacteristic(Characteristic.On).value = self.currentState;

    self.service.getCharacteristic(Characteristic.On).on('get', function(cb) {
        cb(null, self.currentState);
    }.bind(self));

    self.service.getCharacteristic(Characteristic.On).on('set', function(state, cb) {
        self.currentState = state;
        self.log('Triggered button %s',self.sw.name);
        console.log(state);
        if(state){
            setTimeout(this.resetButton.bind(this), 1000);
        }
        cb(null);
    }.bind(self));


}
ArduinoButtonAccessory.prototype.notify = function(code) {
    if(this.sw.code == code) {
        this.notifyOn();
    }
}
ArduinoButtonAccessory.prototype.resetButton = function() {
    this.currentState = false;
    this.service.getCharacteristic(Characteristic.On).updateValue(this.currentState);
}
ArduinoButtonAccessory.prototype.getServices = function() {
    var self = this;
    var services = [];
    var service = new Service.AccessoryInformation();
    service.setCharacteristic(Characteristic.Name, self.name)
    .setCharacteristic(Characteristic.Manufacturer, '433 MHz RC')
    .setCharacteristic(Characteristic.Model, 'Pulse-'+self.sw.pulse)
    .setCharacteristic(Characteristic.SerialNumber, self.sw.code)
    .setCharacteristic(Characteristic.FirmwareRevision, process.env.version)
    .setCharacteristic(Characteristic.HardwareRevision, '1.0.0');
    services.push(service);
    services.push(self.service);
    return services;
}





function ArduinoLightAccessory(sw, log, config) {
    var self = this;
    self.name = sw.name;
    self.sw = sw;
    self.log = log;
    self.config = config;
    self.currentState = false;
    self.throttle = config.throttle?config.throttle:500;

    self.service = new Service.Lightbulb(self.name);

   
    self.service.getCharacteristic(Characteristic.On).value = self.currentState;
// self.service.setCharacteristic(Characteristic.Brightness,10)
    self.service.getCharacteristic(Characteristic.On).on('get', function(cb) {
        cb(null, self.currentState);
    }.bind(self));

    self.service.getCharacteristic(Characteristic.On).on('set', function(state, cb) {
        self.currentState = state;
        if(!self.config.serial_port_out){
            cb(null);
            return;
        };
        if(!self.config.serial_port_in){
            cb(null);
            return;
        };

        if(self.currentState) {
    


            addCode(self.sw.on.deviceId,sentCodes);
            queue.add(() => sp.sendCodes(self.sw.remoteId,self.sw.on.deviceId,1,(callb) => {
                self.log(callb);
            })).then(() => {

                self.log('Sent on code for %s',self.sw.name);
            }).catch((err) => {
                self.log(err);
                console.log(err);
            })
        
        
        } else {

     
            addCode(self.sw.off.deviceId,sentCodes);
            queue.add(() => sp.sendCodes(self.sw.remoteId,self.sw.off.deviceId,0,(callb) => {
                self.log(callb);
            })).then(() => {

                self.log('Sent off code for %s',self.sw.name);
            }).catch((err) => {
                console.log(err);
                self.log(err);
            })
        
        }
        cb(null);
    }.bind(self));
    self.notifyOn = helpers.throttle(function(){
        self.log("Received on code for %s", self.sw.name);
        self.currentState = true;
        self.service.getCharacteristic(Characteristic.On).updateValue(self.currentState);
    },self.throttle,self);
    self.notifyOff = helpers.throttle(function(){
        self.log("Received off code for %s", self.sw.name);
        self.currentState = false;
        self.service.getCharacteristic(Characteristic.On).updateValue(self.currentState);
    },self.throttle,self);
}
ArduinoLightAccessory.prototype.notify = function(code) {
    var self = this;
    if(this.sw.on.code == code) {
        self.notifyOn();
    } else if (this.sw.off.code == code) {
        self.notifyOff();
    }
}
ArduinoLightAccessory.prototype.getServices = function() {
    var self = this;
    var services = [];
    var service = new Service.AccessoryInformation();
    service.setCharacteristic(Characteristic.Name, self.name)
    .setCharacteristic(Characteristic.Manufacturer, '433 MHz RC')
    .setCharacteristic(Characteristic.Model, self.sw.remoteId)
    .setCharacteristic(Characteristic.SerialNumber, self.sw.remoteId  +'-'+ self.sw.on.deviceId)
    .setCharacteristic(Characteristic.FirmwareRevision, process.env.version)
    .setCharacteristic(Characteristic.HardwareRevision, '1.0.0');
    services.push(service);
    services.push(self.service);
    return services;
}






function checkCode(value, array, remove){
    value = parseInt(value);
    var index = array.indexOf(value);
    if(index>-1){
        if(remove) array.splice(index, 1);
        return true;
    }
    else {
        return false;
    }
}

function addCode(value, array){
    value = parseInt(value);
    array.push(value);
    setTimeout(checkCode, 2000, value, array, true);
}

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerPlatform("Arduino RF 433 switch", "homebridge-switcher", ArduinoSwitchPlatform);
}

var helpers = {
  throttle: function(fn, threshold, scope) {
    threshold || (threshold = 250);
    var last, deferTimer;

    return function() {
      var context = scope || this;
      var now = +new Date, args = arguments;

      if (last && now < last + threshold) {
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  }
}