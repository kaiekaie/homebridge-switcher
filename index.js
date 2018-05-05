var Service, Characteristic, LastUpdate;
var blockPort;
var inPort;
var outPort;
var sentCodes = [];
var lastInputTime = 0;
var inputOutputTimeout = 500;

function ArduinoSwitchPlatform(log, config) {
    var self = this;
    self.config = config;
    self.log = log;

}

ArduinoSwitchPlatform.prototype.accessories = function(callback) {
    var self = this;
    self.accessories = [];
    self.config.switches.forEach(function(sw) {
        self.accessories.push(new ArduinoSwitchAccessory(sw, self.log, self.config));
    });

    callback(self.accessories);
}

function ArduinoSwitchAccessory(sw, log, config) {
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
        if(!self.config.serial_port_out){
            cb(null);
            return;
        };
        if(self.currentState) {
            addCode(self.sw.on.code,sentCodes);
            blockPort.send(self.sw.on.code +"/"+ self.sw.on.pulse +"\n");
            self.log('Sent on code for %s',self.sw.name);
        } else {
            addCode(self.sw.off.code,sentCodes);
            blockPort.send(self.sw.off.code +"/"+  self.sw.off.pulse +"\n");
            self.log('Sent off code for %s',self.sw.name);
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
ArduinoSwitchAccessory.prototype.notify = function(code) {
    var self = this;
    if(this.sw.on.code == code) {
        self.notifyOn();
    } else if (this.sw.off.code == code) {
        self.notifyOff();
    }
}
ArduinoSwitchAccessory.prototype.getServices = function() {
    var self = this;
    var services = [];
    var service = new Service.AccessoryInformation();
    service.setCharacteristic(Characteristic.Name, self.name)
    .setCharacteristic(Characteristic.Manufacturer, '433 MHz RC')
    .setCharacteristic(Characteristic.Model, 'Pulse-'+self.sw.on.pulse)
    .setCharacteristic(Characteristic.SerialNumber, self.sw.on.code+'-'+self.sw.off.code)
    .setCharacteristic(Characteristic.FirmwareRevision, process.env.version)
    .setCharacteristic(Characteristic.HardwareRevision, '1.0.0');
    services.push(service);
    services.push(self.service);
    return services;
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
    homebridge.registerPlatform("Arduino RF 433 switch", "Homebridge-switcher", ArduinoSwitchPlatform);
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