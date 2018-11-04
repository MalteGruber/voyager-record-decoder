window.AudioContext=window.AudioContext||window.webkitAudioContext;
var context=new AudioContext();

function onError(e){
    console.error("error",e)
}
function loadSound(url,onloadCallback,loadingProgressCb){
    var request=new XMLHttpRequest();
    request.open('GET',url,true);
    request.responseType='arraybuffer';
    
    request.onprogress=(e)=>{loadingProgressCb(0.9*Math.round(100*e.loaded/e.total))}
    
    request.onload=function(){
        context.decodeAudioData(request.response,function(buffer){
            loadingProgressCb(100);
            onloadCallback(buffer);
        },onError);
    }
    request.send();
}

