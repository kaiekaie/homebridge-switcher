

var SerialPort = require('serialport');
const Readline = require('parser-readline')
const argv = require('yargs').argv


class SerialPorts {
    constructor(port) {
      this.port = new SerialPort(port, {
        baudRate: 9600,
    });
    this.parser =  this.port.pipe(new Readline({ delimiter: '\r\n' }))
 
    }

    sendCodes(remoteId, deviceId, ison,callback) {

        this.port.write(`${remoteId}/${deviceId}/${ison}\n`, (err) => {
            if (err) {
                // reject(err.message)
                return console.log('Error opening port: ', err.message);
            }
        
            callback("ok")
        });

            this.parser.on('data', (data) => {

                if(data === "OK"){
                 
               
                }
            })

    }
  };
  module.exports  = SerialPorts;


