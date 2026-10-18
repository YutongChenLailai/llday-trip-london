import {test} from 'node:test';
import assert from 'node:assert/strict';
import {destinationChinese,translate} from '../src/translations.js';
import {places} from '../src/places.js';
test('every eligible destination has a Chinese name and description',()=>{
 for(const place of places){assert.ok(destinationChinese[place.name]);assert.match(place.zh,/[\u3400-\u9fff]/);assert.match(place.noteZh,/[\u3400-\u9fff]/);assert.equal(translate(place.name),place.zh);}
});
test('dynamic camera, sound, outcome and progress messages have Chinese companions',()=>{
 for(const en of ['Sound off ↗','HAND FOUND','CAMERA OFF','MOUSE MODE','Dart ready · flick & release','Throw 02 · Brighton · a new place to go.','2 explored · 38 places still to discover.'])assert.match(translate(en),/[\u3400-\u9fff]/);
});
