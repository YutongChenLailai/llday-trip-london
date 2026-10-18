import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadVisited,saveVisited,nextPlace} from '../src/progress.js';
import {faceOval,handOutline} from '../src/cutout.js';
const places=[{name:'A',lat:51.5,lng:-.1},{name:'B',lat:51.6,lng:-.2}];
test('visited destinations are excluded even when aim is exactly on them',()=>{
  assert.equal(nextPlace(51.5,-.1,places,new Set(['A'])).name,'B');
  assert.equal(nextPlace(51.5,-.1,places,new Set(['A','B'])),null);
});
test('progress survives reload and ignores corrupt or unrelated stored values',()=>{
  let data='';const storage={getItem:()=>data,setItem:(_,value)=>data=value};
  assert.equal(saveVisited(storage,new Set(['A'])),true);
  assert.deepEqual([...loadVisited(storage,places)],['A']);
  data='["A","unknown",null]';assert.deepEqual([...loadVisited(storage,places)],['A']);
  data='null';assert.equal(loadVisited(storage,places).size,0);
  data='invalid';assert.equal(loadVisited(storage,places).size,0);
  assert.equal(saveVisited({setItem(){throw new Error('blocked');}},new Set()),false);
});
test('face crop is a bounded oval inside the detected face, excluding the hair margins',()=>{
 const oval=faceOval({originX:100,originY:80,width:120,height:140});
 assert.equal(oval.x,160);assert.ok(oval.x-oval.rx>100);assert.ok(oval.x+oval.rx<220);
 assert.ok(oval.y-oval.ry>80);assert.ok(oval.y+oval.ry<220);
});
test('hand outline never includes the arm side of the wrist',()=>{
  const points=Array.from({length:21},(_,i)=>({x:.4+(i%5)*.02,y:.3+Math.floor(i/5)*.02}));
  points[0]={x:.45,y:.5};points[9]={x:.45,y:.35};
  const outline=handOutline(points);assert.ok(outline.length>=3);
  assert.ok(outline.every(p=>p.y<=.5+1e-8));
});
