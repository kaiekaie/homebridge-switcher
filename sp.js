

var SerialPort = require('serialport');
const Readline = require('parser-readline')
const argv = require('yargs').argv

var port = new SerialPort('COM5', {
    baudRate: 9600,
});

const parser = port.pipe(new Readline({ delimiter: '\r\n' }))
process.setMaxListeners(20);

module.exports = SendCodes = (remoteId, deviceId, ison,callback) => {
    console.log(remoteId, deviceId, ison)


       
                port.write(`${remoteId}/${deviceId}/${ison}\n`, (err) => {
                    if (err) {
                        // reject(err.message)
                        return console.log('Error opening port: ', err.message);
                    }
                    callback("ok")
                });
        
   
            parser.on('data', (data) => {
  
                if(data === "OK"){
                    // resolve("ok")
               
                }
            })

    
   
} 


if ('remoteId' in argv && 'deviceId'in argv && 'ison' in argv) {

    SendCodes(argv.remoteId, argv.deviceId, argv.ison).then(() => {
        console.log("done")

    })
}
