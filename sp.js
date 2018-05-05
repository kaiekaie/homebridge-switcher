var SerialPort = require('serialport');
const Readline = require('parser-readline')
const argv = require('yargs').argv
var port = new SerialPort('COM3', {
    baudRate: 9600,
});

const parser = port.pipe(new Readline({ delimiter: '\r\n' }))

module.exports = SendCodes = (remoteId, deviceId, ison) => {

    port.open(function () {
        // Because there's no callback to write, write errors will be emitted on the port:
        parser.on('data', (data) => {
            console.log(data);
        })

        parser.on('data', (data) => {
            if (data === "open") {
                port.write(`${remoteId}/${deviceId}/${ison}\n`, (err) => {
                    if (err) {
                        return console.log('Error opening port: ', err.message);
                    }
                });
            }

        })

    });
}


if (argv.remoteId && argv.deviceId && argv.ison) {
    SendCodes(argv.remoteId, argv.deviceId, argv.ison)
}
