
let debug=false;
/*I.e. approx. number of samples between falling edges of trigger pulse.*/
let AVG_SAMPLES_PER_LINE=734;
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


function updateOscilloscope(channel,scanlineLength,marker0,marker1){
    let c=document.getElementById(channel.plotName);
    let buffer=channel.samples;
    let offset=channel.offset;

    let ctx=c.getContext("2d");
    let zoom=200;
    let W=c.width;
    let H=c.height;
    let center=H/2;
    let x=0;
    let dx=W/scanlineLength;
    ctx.clearRect(0,0,W,H);
    ctx.beginPath();
    ctx.moveTo(x,center);
    /**/
    let plotStart=-140;

    for(let i=0;i<scanlineLength;i++){
        x+=dx;
        ctx.lineTo(x,center-buffer[i+offset+plotStart]*(zoom));
    }

    /*Draw vertical debug markers*/
    if(debug){
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0,center-marker0*(zoom));
        ctx.lineTo(W,center-marker0*(zoom));
        ctx.moveTo(0,center-marker1*(zoom));
        ctx.lineTo(W,center-marker1*(zoom));
        ctx.moveTo(W-plotStart*dx,0);
        ctx.lineTo(W-plotStart*dx,H);
    }
    ctx.stroke();
}



/*Draws a complete pixel line, the offset has to be set to the end 
 * of a sync pulse when calling this function.*/
function displayLatestScanline(channel){
    let canvas=document.getElementById(channel.canvasName);
    let ctx=canvas.getContext("2d");
    let w=canvas.width,h=canvas.height;

    let scanline_image_data=ctx.createImageData(w,1);
    let scanline_pixel_row=scanline_image_data.data;

    /*Shift the prervious rows to make room for a new row, old rows that move 
     * past the image area are discarded by this!*/
    let imageData=ctx.getImageData(0,0,w,h);
    ctx.clearRect(0,0,w,h);
    ctx.putImageData(imageData,0,-2);

    /*Populate the scan line, pixel by pixel*/
    for(let i=0;i<w;i++){
        /*This takes some experimentation, the circle is good for this*/
        let intensety=108-channel.samples[channel.offset+w-i]*2555;
        scanline_pixel_row[0+i*4]=intensety; //red
        scanline_pixel_row[1+i*4]=intensety; //green
        scanline_pixel_row[2+i*4]=intensety; //blue
        scanline_pixel_row[3+i*4]=255; //alpha
    }
    /*Plot the scan line pixel row*/
    ctx.putImageData(scanline_image_data,0,h-2);
    ctx.putImageData(scanline_image_data,0,h-1);

}

/*Finds the offset at the next sync pulse*/
function nextLine(channel){
    //Statemachine
    let pulseCount=0;
    let triggerCount=2;
    let lowLevel=0;
    let highLevelReachedCounter=0;
    channel.offset+=300;
    let maxInterimageSamples=10000; /*Not actually 10000*/
    let max=0;
    let lookahead=850;

    /*Find the maximum value in the comming smaples*/
    for(let i=0;i<lookahead;i++){
        let sample=channel.samples[channel.offset+i]
        if(sample>max)
            max=sample;
    }

    lowLevel=max*0.1;
    /*Try to find the next sync pulse*/
    for(let i=-100;i<maxInterimageSamples;i++){
        
        /*Start scanning for a sync falling edge when we observe a maximum*/
        if(channel.samples[channel.offset]===max){
            highLevelReachedCounter=60;
        }
        highLevelReachedCounter-=1;

       
        if(channel.samples[channel.offset]>lowLevel){
            pulseCount++;
        }else{
            let pulseIsLongEnough=pulseCount>triggerCount;
            let maxWasRecent = highLevelReachedCounter>0;
            /*We have transitioned, check if actual falling edge*/
            if(pulseIsLongEnough&&maxWasRecent){
                
                /*For debuging,indicate were we triggered*/
                if(debug){
                    channel.samples[channel.offset]=1;
                    channel.samples[channel.offset+1]=-1;
                    channel.samples[channel.offset+2]=1;
                }
                /*Channel will now be returned ready with pointer just after the 
                 * pulse*/
                return channel;
            }
            pulseCount=0;
            highLevelReachedCounter=0;
        }
        channel.offset+=1;
    }
    if(channel.haltOnError)
        channel.go=false;
    return channel;
}

function startDisplayingChannel(channel){
    setInterval(function(){
        if(!channel.go)
            return;
        let oldOffset=channel.offset;

        //Try to find the next pulse

        channel=nextLine(channel);
        displayLatestScanline(channel);
        updateOscilloscope(channel,3000,0);
        
        if(debug){
            let samplesScannedBeforePulse=channel.offset-oldOffset;
            if((samplesScannedBeforePulse>AVG_SAMPLES_PER_LINE+80)||(samplesScannedBeforePulse<AVG_SAMPLES_PER_LINE-89)){
                console.log("Missed trigger pulse! Scanned",samplesScannedBeforePulse,"samples instead")
                if(channel.haltOnError)
                    channel.go=false;
            }
        }



    },30);
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

