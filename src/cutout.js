// A hand silhouette stops at the wrist; body-skin outside this polygon is never shown.
export function handOutline(points) {
  const center = points[9], wrist = points[0];
  const dx = center.x - wrist.x, dy = center.y - wrist.y;
  const length = Math.hypot(dx, dy);
  if (length < .005) return [];
  const expanded = points.map(p => ({x: center.x + (p.x-center.x)*1.16, y: center.y + (p.y-center.y)*1.16}));
  const sorted = expanded.sort((a,b) => a.x-b.x || a.y-b.y);
  const cross = (a,b,c) => (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const lower=[], upper=[];
  for (const p of sorted) {while(lower.length>1 && cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
  for (const p of sorted.toReversed()) {while(upper.length>1 && cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
  const hull=lower.slice(0,-1).concat(upper.slice(0,-1));
  const side=p => ((p.x-wrist.x)*dx+(p.y-wrist.y)*dy)/length;
  const clipped=[];
  for(let i=0;i<hull.length;i++){
    const a=hull[i],b=hull[(i+1)%hull.length],da=side(a),db=side(b);
    if(da>=0)clipped.push(a);
    if((da>=0)!==(db>=0)){const t=da/(da-db);clipped.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}
  }
  return clipped;
}
export function faceOval(box){
  return {x:box.originX+box.width*.5,y:box.originY+box.height*.52,rx:box.width*.44,ry:box.height*.47};
}
