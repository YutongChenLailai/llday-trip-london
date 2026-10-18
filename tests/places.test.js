import {test} from 'node:test';
import assert from 'node:assert/strict';
import {places} from '../src/places.js';
import {mapBounds} from '../src/map-art.js';
import {nextPlace} from '../src/progress.js';
test('day-trip catalogue includes the requested seaside towns, has unique names and stays within the regional map',()=>{
 assert.equal(places.length,48);assert.equal(new Set(places.map(p=>p.name)).size,48);
 assert.ok(places.some(p=>p.name==='Brighton'));assert.ok(places.some(p=>p.name==='Southend-on-Sea'));
 for(const p of places){assert.ok(p.lat>mapBounds[0][0]&&p.lat<mapBounds[1][0]);assert.ok(p.lng>mapBounds[0][1]&&p.lng<mapBounds[1][1]);assert.ok(p.station&&p.source.startsWith('https://'));}
});
test('checked seaside destination cannot win and all-visited terminates selection',()=>{
 const brighton=places.find(p=>p.name==='Brighton');
 assert.notEqual(nextPlace(places,new Set(['Brighton'])).name,'Brighton');
 assert.equal(nextPlace(places,new Set(places.map(p=>p.name))),null);
});
