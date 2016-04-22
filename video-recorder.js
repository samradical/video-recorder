var Whammy = require('./VideoStreamRecorder/lib/whammy')
var canvas

var context;

var video
var lastTime;
var whammy;
var isStopDrawing = false;
var isPaused = false;
var requestDataInvoked = false;
lastTime = new Date().getTime();
whammy = new Whammy.Video();
var counter  = 0;
var request 
function init() {
    canvas = document.createElement('canvas');
    context = canvas.getContext('2d');
    video = document.getElementById('vid');
    canvas.width = 480;
    canvas.height = 480;
    drawFrames()
}

function drawFrames() {
		console.log(counter);
    if (isPaused) {
        lastTime = new Date().getTime();
        setTimeout(drawFrames, 500);
        return;
    }

    if (isStopDrawing) {
        return;
    }

    if (requestDataInvoked) {
        return setTimeout(drawFrames, 100);
    }
    if(counter % 2 === 0){

    var duration = new Date().getTime() - lastTime;
    if (!duration) {
        return drawFrames();
    }

    // via webrtc-experiment#206, by Jack i.e. @Seymourr
    lastTime = new Date().getTime();

    if (!self.isHTMLObject && video.paused) {
        video.play(); // Android
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (!isStopDrawing) {
        whammy.frames.push({
            duration: duration,
            image: canvas.toDataURL('image/webp')
        });
    }

    }

		counter++;
    request = window.requestAnimationFrame(drawFrames);
    //setTimeout(drawFrames, 10);
}

function stop() {
    isStopDrawing = true;
    requestData()
}


function bytesToSize(bytes) {
    var k = 1000;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

function requestData() {

    if (!whammy.frames.length) {
        requestDataInvoked = false;
        return;
    }

    requestDataInvoked = true;
    // clone stuff
    var internalFrames = whammy.frames.slice(0);
		window.cancelAnimationFrame(request)
    whammy.compile(function(whammyBlob) {
    		save(whammyBlob)
        console.debug('video recorded blob size:', bytesToSize(whammyBlob.size));
    });

    whammy.frames = [];

    requestDataInvoked = false;
}

function save( bigBlob) {
    invokeSaveAsDialog(bigBlob);
}


function invokeSaveAsDialog(file, fileName) {
    if (!file) {
        throw 'Blob object is required.';
    }

    if (!file.type) {
        file.type = 'video/webm';
    }

    var fileExtension = file.type.split('/')[1];

    if (fileName && fileName.indexOf('.') !== -1) {
        var splitted = fileName.split('.');
        fileName = splitted[0];
        fileExtension = splitted[1];
    }

    var fileFullName = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + fileExtension;

    if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
        return navigator.msSaveOrOpenBlob(file, fileFullName);
    } else if (typeof navigator.msSaveBlob !== 'undefined') {
        return navigator.msSaveBlob(file, fileFullName);
    }

    var hyperlink = document.createElement('a');
    hyperlink.href = URL.createObjectURL(file);
    hyperlink.target = '_blank';
    hyperlink.download = fileFullName;

    if (!!navigator.mozGetUserMedia) {
        hyperlink.onclick = function() {
            (document.body || document.documentElement).removeChild(hyperlink);
        };
        (document.body || document.documentElement).appendChild(hyperlink);
    }

    var evt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });

    hyperlink.dispatchEvent(evt);

    if (!navigator.mozGetUserMedia) {
        URL.revokeObjectURL(hyperlink.href);
    }
}

window.onload = init

setTimeout(function() {
    stop()
}, 20000)

console.log("ere")