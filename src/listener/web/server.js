var express = require('express');

var fs = require('fs');

var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('sslcert/private.pem', 'utf8');
var certificate = fs.readFileSync('sslcert/file.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};

var actionBase = require('./actions.js');

var app = express();
var server = http.createServer(app);
var sserver = https.createServer(credentials, app);

var io = require('socket.io')(server);
var httpPort = 3883;
var httpsPort = 3884;
server.listen(httpPort);
sserver.listen(httpsPort);

// CORS middleware
var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');

    next();
};

app.use(allowCrossDomain);

app.use(express.static(__dirname + '/src'));
app.use(express.static(__dirname + '/records'));
app.use(express.static(__dirname + '/replies'));
app.get('/', function (req, res) {
    res.redirect('index.html');
});

var socketUrl = null;
var iosocket = null;
io.on('connection', function (socket) {
    iosocket = socket;
    socketUrl = decodeURI(socket.request._query['url']);
    console.log('Connection ' + socket.id + ' accepted');
    console.log('Client url: ' + socketUrl);
    socket.on('disconnect', function () {
        console.log('Connection ' + socket.id + ' terminated');
    });
    
    socket.emit('sync history', {
        hist: actionBase.chatHist
    });
});

var binaryServer = require('binaryjs').BinaryServer({
    host: '127.0.0.1',
    port: 9001
});

var wav = require('wav');
var sox = require('sox');

// speech音频文件存放目录
var tempDir     = './records/tmp/';
var recordDir   = './records/';
var replyDir    = 'replies/';

var clientAudioInfo = null;

// 将原始speech文件转成指定格式，例如进行重采样
var soxTaskExec = function (fileName, callback) {
    var proc = function (options, fileName, callback) {
        var job = sox.transcode(tempDir + fileName, recordDir + fileName, {
            sampleRate: 16000,//options.sampleRate,
            format: options.format,
            channelCount: 1,
            bitRate: options.bitRate,
            compressionQuality: 5 // see `man soxformat` search for '-C' for more info
        });
        job.on('error', function (err) {
            console.error(err);
        });
        job.on('progress', function (amountDone, amountTotal) {
            console.log('progress', amountDone, amountTotal);
        });
        job.on('src', function (info) {
            /* info looks like:
            {
                format: 'wav',
                duration: 1.5,
                sampleCount: 66150,
                channelCount: 1,
                bitRate: 722944,
                sampleRate: 44100,
            }
            */
        });
        job.on('dest', function (info) {
            /* info looks like:
            {
                sampleRate: 44100,
                format: 'mp3',
                channelCount: 2,
                sampleCount: 67958,
                duration: 1.540998,
                bitRate: 196608,
            }
            */
        });
        job.on('end', function () {
            console.log('complete resampling file ' + fileName);
            callback(fileName);
        });
        job.start();
    };

    if (clientAudioInfo) {
        proc(clientAudioInfo, fileName, callback);
    } else {
        sox.identify(tempDir + fileName, function (err, results) {
            /* results looks like:
            {
                format: 'wav',
                duration: 1.5,
                sampleCount: 66150,
                channelCount: 1,
                bitRate: 722944,
                sampleRate: 44100,
            }
            */
            if (err) {
                console.log('sox identify audio error');
                return;
            }
            clientAudioInfo = results;
            proc(clientAudioInfo, fileName, callback);
        });
    }
};

// var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var stt = function (speechFilePath, callback) {
    /*
    var py = spawn('python', ['../vendor/baidu/stt.py', speechFilePath]);
    console.log('stt file: ' + speechFilePath);
    py.stdout.on('data', function (data) {
        callback(data.toString());
    });
    py.stdout.on('end', function () {
        //
    });
    */
    var py = 'python ../vendor/baidu/stt.py ' + speechFilePath;
    exec(py, {encoding: 'utf8'}, function (err, stdout, stderr) {
        if (err) {
            console.log('get text of speech error: ' + stderr);
        } else {
            var data = stdout;//JSON.parse(stdout);
            console.log(data);
            data = data.replace(/[\r\n]/g, '').replace('，', ' ').trim();
            if (data && data !== '，') callback(data);
        }
    });
};
var tts = function (speechText, replySpeechFilePath, callback) {
    var sh = 'export LD_LIBRARY_PATH=$(pwd)/libs/x64/ && ./bin/tts '
        + speechText + ' ../../../listener/web/replies/' + replySpeechFilePath;
    console.log('tts sh: ' + sh);
    exec(sh, {
        cwd: '../../speaker/vendor/xfyun',
        encoding: 'utf8'
    }, function (err, stdout, stderr) {
        if (err) {
            console.log('get speech of text error: ' + stderr);
        } else {
            var data = stdout;//JSON.parse(stdout);
            console.log(data);
            if (data.trim() === '1') callback(replySpeechFilePath);
        }
    });
};

// speech文件已经重采样生成完毕，最终要构造一个新的speech文件回传给client
var speechFileHander = function (filePath, client, https) {
    // var file = fs.createReadStream(filePath);
    // client.send(file);

    if (iosocket) {
        stt(recordDir + filePath, function (text) {
            console.log('stt text: ' + text);

            var domainParsed = actionBase.parseDomain(socketUrl);
            var actionName = actionBase.parseAction(domainParsed, text);
            var originText = text;
            text = actionBase.responseDecor[domainParsed][actionName](text);
            var processData = {
                body: text,
                re: originText
            };
            iosocket.emit('speech text returns', {
                text: text,
                origin: originText,
                script: actionBase.domainActions[domainParsed][actionName](processData)
            });

            if (processData.body.trim()) {
                var timestamp = Date.now();
                var fileName = `${timestamp}.wav`;
                tts(text, fileName, function (replyFilePath) {
                    iosocket.emit('speech comes', {url: '//127.0.0.1:' + (https ? httpsPort : httpPort) + '/' + replyFilePath});
                });
            }
        });
    }
};

// 原始speech文件已经生成完毕，需要转成指定格式（重采样等）
var processWavFile = function (fileName, client, https) {
    soxTaskExec(fileName, function (resampledFileName) {
        speechFileHander(resampledFileName, client, https);
    });
};

binaryServer.on('connection', function (client) {
    var fileWriter = null;
    var meta = null;

    client.on('stream', function (stream, _meta) {
        meta = _meta;
        console.log('meta.streamId: ' + meta.streamId);
        console.log('meta.protocol: ' + meta.protocol);
        console.log('meta.sampleRate: ' + meta.sampleRate);
        var timestamp = Date.now();
        var fileName = `${timestamp}.wav`;
        var fileWriter = new wav.FileWriter(tempDir + fileName, {
            channels: 1,
            sampleRate: meta.sampleRate,
            bitDepth: 16
        });
        stream.pipe(fileWriter);
        stream.on('end', function () {
            if (fileWriter) {
                fileWriter.end();
                console.log('file written');
                processWavFile(fileName, client, meta.protocol === 'https:');
            }
            iosocket.emit('stream ends', {id: meta.streamId});
        });
    });

    client.on('close', function () {
        if (fileWriter) {
            fileWriter.end();
            console.log('file written, client closed');
        }
    });
});
