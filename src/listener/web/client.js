(function () {

    // Create AudioContext
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var audioContext = new AudioContext();
    var audioSampleRate = audioContext.sampleRate;

    // Recorder
    var recorder = null;

    // Define function called by getUserMedia
    function startUserMedia(stream) {
        // Create MediaStreamAudioSourceNode
        var source = audioContext.createMediaStreamSource(stream);

        recorder = new recordAudio(source);

        // Setup options
        var options = {
            source: source,
            voice_stop: function () {
                console.log('voice_stop');
                recorder.stop();
            },
            voice_start: function () {
                console.log('voice_start');
                if (!audioState) {
                    recorder.start();
                }
            }
        };

        // Create VAD
        var vad = new VAD(options);
    }

    // Ask for audio device
    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.webkitGetUserMedia;
    navigator.getUserMedia({
        audio: true
    }, function (stream) { // onSuccess
        startUserMedia(stream);
    }, function (e) { // onError
        console.log('No live audio input in this browser: ' + e);
    });

    // Record audio
    function recordAudio(stream) {
        var bufferLen   = 2048,
            numChannels = 1;
        this.context = stream.context;
        this.node = (this.context.createScriptProcessor ||
            this.context.createJavaScriptNode).call(this.context,
            bufferLen, numChannels, numChannels);

        stream.connect(this.node);
        this.node.connect(this.context.destination);

        function convertFloat32ToInt16(buffer) {
            l = buffer.length;
            buf = new Int16Array(l);
            while (l--) {
                buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
            }
            return buf.buffer;
        }

        this.node.onaudioprocess = function (e) {
            if (recordState === 0) return;

            // Since numChannels is 1
            window.wstream.write(convertFloat32ToInt16(e.inputBuffer.getChannelData(0)));
        };

        this.start = function () {
            if (recordState === 1) return;

            recordState = 1;
            var streamId = window.wstreams.length;
            window.wstream = window.wclient.createStream({
                streamId: streamId,
                protocol: window.location.protocol,
                sampleRate: audioSampleRate
            });
            window.wstreams[streamId] = window.wstream;
            console.log('< recorder_start, stream_start', Date.now());
        };

        this.stop = function () {
            if (recordState === 0) return;

            recordState = 0;
            window.wstream.end();
            console.log('recorder_stop, stream_end >', Date.now());
        };
    }

    var audioQueue = [];
    function playAudio() {
        if (recordState === 0) {
            if (!audioQueue.length) {
                recorder.start();
                return;
            }
            audioState = true;
            console.log('< play_start', Date.now());

            playAudioSimply(audioQueue.shift(), function () {
                audioState = false;
                console.log('play_end >', Date.now());
                setTimeout(playAudio, 500);
            });
        } else {
            setTimeout(playAudio, 1000);
        }
    }
    function playAudioSimply(url, onEnd) {
        var audio = new Audio(url);
        audio.play();
        audio.addEventListener('ended', function () {
            onEnd();
        });
    }

    var audioState = false;
    var recordState = 0; // 0: not recording, 1: recording

    var socket = io.connect('http://127.0.0.1:3883');
    socket.on('speech text returns', function (data) {
        console.log('text comes from server: ' + data.text);
    });
    socket.on('speech comes', function (data) {
        console.log('speech comes from server: ' + data.url);
        audioQueue.push(data.url);
        playAudio();
    });
    socket.on('stream ends', function (data) {
        window.wstreams[data.id].destroy();
        console.log('server ends stream: ' + data.id);
    });

    window.wclient = new BinaryClient('ws://127.0.0.1:9001');
    window.wstreams = [];

})();
