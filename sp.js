

var SerialPort = require('serialport');
const Readline = require('parser-readline')
const argv = require('yargs').argv

var port = new SerialPort('COM3', {
    baudRate: 9600,
});

const parser = port.pipe(new Readline({ delimiter: '\r\n' }))
process.setMaxListeners(20);

module.exports = SendCodes = (remoteId, deviceId, ison) => {
return new Promise((resolve,reject) => {

       
                port.write(`${remoteId}/${deviceId}/${ison}\n`, (err) => {
                    if (err) {
                        reject(err.message)
                        return console.log('Error opening port: ', err.message);
                    }
                });
        
   
            parser.on('data', (data) => {
  
                if(data === "OK"){
                    resolve("ok")
         
                }
            })

        })
   
} 


if ('remoteId' in argv && 'deviceId'in argv && 'ison' in argv) {

    SendCodes(argv.remoteId, argv.deviceId, argv.ison).then(() => {
        console.log("done")

    })
}
