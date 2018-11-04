
let leftChannel={
    go:true,
    offset:3000000,
    samples:null,
    haltOnError:false,
    canvasName:"imgCanvasLeft",
    plotName:"plotLeft"
};
let rightChannel={
    go:true,
    offset:3000000,
    samples:null,
    haltOnError:false,
    canvasName:"imgCanvasRight",
    plotName:"plotRight"
};

function plot(buffer,offset,len,marker0,marker1,name){
    let c=document.getElementById(name);
    let ctx=c.getContext("2d");
    let zoom=200;
    let W=c.width;
    let H=c.height;
    let center=H/2;
    let x=0;
    let dx=W/len;
    ctx.clearRect(0,0,W,H);
    ctx.beginPath();
    ctx.moveTo(x,center);
    let plotStart=-140;
    for(let i=0;i<len;i++){
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
function nextLine(channel){
    //Statemachine
    let lowCount=0;
    let triggerCount=10;
    let lowLevel=0;
    let highLevelReachedCounter=0;
    channel.offset+=300;
    let max_interimage_samples=10000; /*Not actually 10000*/
    let max=0;
    let lookahead=850;

    for(let i=0;i<lookahead;i++){
        let sample=channel.samples[channel.offset+i]
        if(sample>max)
            max=sample;
    }
    /*Try to find the next sync pulse*/
    for(let i=0;i<max_interimage_samples;i++){

        /*Obs, floating point*/
        if(channel.samples[channel.offset]>=max){
            highLevelReachedCounter=60;
        }
        highLevelReachedCounter-=1;

        if(channel.samples[channel.offset]>lowLevel){
            lowCount++;
        }else{
            /*We have transitioned back to under the pulse*/
            if((lowCount>triggerCount)&&(highLevelReachedCounter>0)){
                /*For debuging,indicate were we triggered*/
                if(false){
                    channel.samples[channel.offset]=1;
                    channel.samples[channel.offset+1]=-1;
                    channel.samples[channel.offset+2]=1;
                }
                pushLine(channel);
                if(i<500||i>600){
                    // console.log("Found after ",i)
                    if(channel.haltOnError)
                        channel.go=false;
                }
                return channel;

            }
            //Fail
            lowCount=0;
            highLevelReachedCounter=0;
        }

        channel.offset+=1;
    }
    if(channel.haltOnError)
        channel.go=false;
    return channel;


}

/*Draws a complete pixel line, the offset has to be set to the end 
 * of a sync pulse when calling this function.*/
function pushLine(channel){
    let canvas=document.getElementById(channel.canvasName);
    let ctx=canvas.getContext("2d");
    let id=ctx.createImageData(1,1); // only do this once per page
    let d=id.data; // only do this once per page
    let w=canvas.width,h=canvas.height;

    /*Shift the prervious rows to make room for a new row, old rows are
     *discarded!*/
    let imageData=ctx.getImageData(0,0,w,h);
    ctx.clearRect(0,0,w,h);
    ctx.putImageData(imageData,0,-1);

    /*Draw the row, pixel by pixel*/
    for(let i=0;i<w;i++){
        /*This takes some experimentation, the circle is good for this*/
        let s=108-channel.samples[channel.offset+i]*2555;
        d[0]=s;
        d[1]=s;
        d[2]=s;
        d[3]=255;
        ctx.putImageData(id,w-i,h-1);
    }
}

function startDisplayingChannel(channel){
    setInterval(function(){
        if(!channel.go)
            return;
        //Try to find the next pulse
        for(let i=0;i<6;i++){
            channel=nextLine(channel);
        }
        plot(channel.samples,channel.offset,1000,0,1,channel.plotName);

    },100);
}
function onloadCallback(buffer){
    setTimeout(()=>{
        $("#loading_div").slideUp("slow");
        leftChannel.samples=buffer.getChannelData(0);
        rightChannel.samples=buffer.getChannelData(1);
        startDisplayingChannel(leftChannel);
        startDisplayingChannel(rightChannel);

    },400)
}

function loadingProgress(progress){
    $("#load_progress").css("width",progress+"%")
}

loadSound("voyager.mp3",onloadCallback,loadingProgress);

