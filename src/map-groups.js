export function groupPlaces(places, project, radius=27) {
 const groups=[];
 for(const place of places){
  const point=project(place);
  const group=groups.find(g=>Math.hypot(g.x-point.x,g.y-point.y)<radius);
  if(group){const count=group.places.length;group.x=(group.x*count+point.x)/(count+1);group.y=(group.y*count+point.y)/(count+1);group.places.push(place);}
  else groups.push({x:point.x,y:point.y,places:[place]});
 }
 return groups;
}
