
var leftChannel={
    go:true,
    offset:3000000,
    samples:null,
    haltOnError:false,
    canvasName:"imgCanvasLeft",
    plotName:"plotLeft"
};
var rightChannel={
    go:true,
    offset:3000000,
    samples:null,
    haltOnError:false,
    canvasName:"imgCanvasRight",
    plotName:"plotRight"
};

function plot(buffer,offset,len,marker0,marker1,name){
    var c=document.getElementById(name);
    var ctx=c.getContext("2d");
    var zoom=200;
    var W=c.width;
    var H=c.height;
    var center=H/2;
    var x=0;
    var dx=W/len;
    ctx.clearRect(0,0,W,H);
    ctx.beginPath();
    ctx.moveTo(x,center);
    var plotStart=-140;
    for(var i=0;i<len;i++){
        x+=dx;
        ctx.lineTo(x,center-buffer[i+offset+plotStart]*(zoom));
    }

    /*Draw some markers
   ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0,center-marker0*(zoom));
    ctx.lineTo(W,center-marker0*(zoom));
    ctx.moveTo(0,center-marker1*(zoom));
    ctx.lineTo(W,center-marker1*(zoom));
    ctx.moveTo(W-plotStart*dx,0);
    ctx.lineTo(W-plotStart*dx,H);*/
    ctx.stroke();
}

/*Finds the offset at the next sync pulse*/
function nextLine(obj){
    //Statemachine
    var lowCount=0;
    var triggerCount=10;
    var lowLevel=0;
    var highLevelReachedCounter=0;
    obj.offset+=300;

    var max=0;
    var lookahead=850;

    for(var i=0;i<lookahead;i++){
        var sample=obj.samples[obj.offset+i]
        if(sample>max)
            max=sample;
    }

    for(var i=0;i<10000;i++){

        /*Obs, floating point*/
        if(obj.samples[obj.offset]>=max){

            highLevelReachedCounter=60;
        }
        highLevelReachedCounter-=1;

        if(obj.samples[obj.offset]>lowLevel){
            lowCount++;
        }else{
            /*We have transitioned back to undeer the pulse*/
            if((lowCount>triggerCount)&&(highLevelReachedCounter>0)){
                /*For debuging,indicate were we triggered*/
                if(false){
                    obj.samples[obj.offset]=1;
                    obj.samples[obj.offset+1]=-1;
                    obj.samples[obj.offset+2]=1;
                }
                pushLine(obj);
                if(i<500||i>600){
                    // console.log("Found after ",i)
                    if(obj.haltOnError)
                        obj.go=false;
                }
                return obj;

            }
            //Fail
            lowCount=0;
            highLevelReachedCounter=0;
        }

        obj.offset+=1;
    }
    if(obj.haltOnError)
        obj.go=false;
    return obj;


}

/*Draws a complete pixel line, the offset has to be set to the end 
 * of a sync pulse when calling this function.*/
function pushLine(obj){
    var canvas=document.getElementById(obj.canvasName);
    var ctx=canvas.getContext("2d");
    var id=ctx.createImageData(1,1); // only do this once per page
    var d=id.data;                        // only do this once per page
    var w=canvas.width,h=canvas.height;

    /*Shift the prervious rows to make room for a new row, old rows are
     *discarded!*/
    var imageData=ctx.getImageData(0,0,w,h);
    ctx.clearRect(0,0,w,h);
    ctx.putImageData(imageData,0,-1);

    /*Draw the row, pixel by pixel*/
    for(var i=0;i<w;i++){
        /*This takes some experimentation, the circle is good for this*/
        var s=108-obj.samples[obj.offset+i]*2555;
        d[0]=s;
        d[1]=s;
        d[2]=s;
        d[3]=255;
        ctx.putImageData(id,w-i,h-1);
    }
}




function startDisplayingChannel(obj){
    setInterval(function(){
        if(!obj.go)
            return;
        for(var i=0;i<6;i++){
            obj=nextLine(obj);
        }
        plot(obj.samples,obj.offset,1000,0,1,obj.plotName);

    },100);
}
function onloadCallback(buffer){
    leftChannel.samples=buffer.getChannelData(0);
    rightChannel.samples=buffer.getChannelData(1);
    startDisplayingChannel(leftChannel);
    startDisplayingChannel(rightChannel);
}

loadSound("voyager.mp3",onloadCallback);

