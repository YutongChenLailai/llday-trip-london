import {test} from 'node:test';
import assert from 'node:assert/strict';
import {groupPlaces} from '../src/map-groups.js';
test('nearby pins are grouped without dropping destinations and distant pins stay separate',()=>{
 const points=[{name:'A',x:1,y:1},{name:'B',x:3,y:3},{name:'C',x:100,y:100}];
 const groups=groupPlaces(points,p=>p);assert.equal(groups.length,2);assert.equal(groups[0].places.length,2);
 assert.equal(groups.flatMap(g=>g.places).length,3);assert.equal(groups[1].places[0].name,'C');
});
