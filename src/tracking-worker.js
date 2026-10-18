import { FilesetResolver, HandLandmarker, FaceDetector, ImageSegmenter } from '@mediapipe/tasks-vision';
import { handOutline, faceOval } from './cutout.js';
let hand,face,segmenter,canvas,ctx,maskCanvas,maskCtx,handsCanvas,handsCtx;
self.onmessage=async({data})=>{
  let input=data.frame;
  try{
    if(data.type==='init'){
      const vision=await FilesetResolver.forVisionTasks('/wasm');
      hand=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'/models/hand_landmarker.task'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.6,minTrackingConfidence:.65});
      face=await FaceDetector.createFromOptions(vision,{baseOptions:{modelAssetPath:'/models/face_detector.tflite'},runningMode:'VIDEO',minDetectionConfidence:.65});
      segmenter=await ImageSegmenter.createFromOptions(vision,{baseOptions:{modelAssetPath:'/models/selfie_segmenter.tflite'},runningMode:'VIDEO',outputCategoryMask:false,outputConfidenceMasks:true});
      canvas=new OffscreenCanvas(640,480);ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';maskCanvas=new OffscreenCanvas(256,256);maskCtx=maskCanvas.getContext('2d');handsCanvas=new OffscreenCanvas(256,256);handsCtx=handsCanvas.getContext('2d',{willReadFrequently:true});
      self.postMessage({type:'ready'});return;
    }
    if(data.type!=='frame')return;
    const started=performance.now();
    const {width,height}=input;
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    const hands=hand.detectForVideo(input,data.time).landmarks;
    const detection=face.detectForVideo(input,data.time).detections[0];
    const oval=detection?faceOval(detection.boundingBox):null;
    ctx.clearRect(0,0,width,height);
    if(hands.length||data.verify){
      segmenter.segmentForVideo(input,data.time,result=>{
        const mask=result.confidenceMasks[0],w=mask.width,h=mask.height;
        if(maskCanvas.width!==w||maskCanvas.height!==h){maskCanvas.width=handsCanvas.width=w;maskCanvas.height=handsCanvas.height=h;}
        handsCtx.clearRect(0,0,w,h);handsCtx.fillStyle='white';
        for(const points of hands){const outline=handOutline(points);if(outline.length<3)continue;handsCtx.beginPath();outline.forEach((p,i)=>i?handsCtx.lineTo(p.x*w,p.y*h):handsCtx.moveTo(p.x*w,p.y*h));handsCtx.closePath();handsCtx.fill();}
        const clip=handsCtx.getImageData(0,0,w,h).data,values=mask.getAsFloat32Array(),image=maskCtx.createImageData(w,h);
        for(let i=0;i<values.length;i++)image.data[i*4+3]=clip[i*4+3]*Math.max(0,Math.min(1,(values[i]-.3)/.4));
        maskCtx.putImageData(image,0,0);
        ctx.drawImage(input,0,0,width,height);ctx.globalCompositeOperation='destination-in';ctx.drawImage(maskCanvas,0,0,width,height);ctx.globalCompositeOperation='source-over';
      });
    }
    ctx.save();ctx.strokeStyle='#3d55f5';ctx.lineWidth=1.3;ctx.setLineDash([5,6]);
    for(const points of hands){const outline=handOutline(points);if(outline.length<3)continue;ctx.beginPath();outline.forEach((p,i)=>i?ctx.lineTo(p.x*width,p.y*height):ctx.moveTo(p.x*width,p.y*height));ctx.closePath();ctx.stroke();}ctx.restore();
    if(oval){
      ctx.save();ctx.beginPath();ctx.ellipse(oval.x,oval.y,oval.rx,oval.ry,0,0,Math.PI*2);ctx.clip();ctx.drawImage(input,0,0,width,height);ctx.restore();
      ctx.save();ctx.strokeStyle='#3d55f5';ctx.lineWidth=1.3;ctx.setLineDash([5,6]);ctx.beginPath();ctx.ellipse(oval.x,oval.y,oval.rx+3,oval.ry+3,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    input.close();input=null;
    const cutout=canvas.transferToImageBitmap();self.postMessage({type:'frame',hands,cutout,time:data.time,faceFound:Boolean(oval),processedMs:Math.round(performance.now()-started)},[cutout]);
  }catch(error){input?.close();self.postMessage({type:'error',message:error.message});}
};
