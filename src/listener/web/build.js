var fs = require('fs');
console.log('start...');
var content = fs.readFileSync('./lib/vad.js', 'utf-8') +
    fs.readFileSync('./lib/binary.js', 'utf-8') +
    fs.readFileSync('./lib/socket.io.js', 'utf-8') +
    fs.readFileSync('./client.js', 'utf-8');
fs.writeFileSync('./client.bundle.js', content);
fs.writeFileSync('./chrome-extension/contentScript.js', content);
console.log('done.');