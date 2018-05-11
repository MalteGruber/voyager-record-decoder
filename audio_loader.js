window.AudioContext=window.AudioContext||window.webkitAudioContext;
var context=new AudioContext();

function onError(e){
    console.error("error",e)
}
function loadSound(url){
    var request=new XMLHttpRequest();
    request.open('GET',url,true);
    request.responseType='arraybuffer';

    request.onload=function(){
        context.decodeAudioData(request.response,function(buffer){
            onloadCallback(buffer);
        },onError);
    }
    request.send();
}

