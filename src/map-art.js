import land from './regional-land.json' with { type: 'json' };
// Geographic destination positions and coastline; dotted lines show direction, not rail tracks.
export const mapBounds=[[50.55,-2.95],[52.88,1.8]];
const width=1600,height=1250;
const mercator=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
const north=mercator(mapBounds[1][0]),south=mercator(mapBounds[0][0]);
const xy=([lat,lng])=>[(lng-mapBounds[0][1])/(mapBounds[1][1]-mapBounds[0][1])*width,(north-mercator(lat))/(north-south)*height];
const path=points=>points.map((p,i)=>`${i?'L':'M'}${xy(p).map(n=>n.toFixed(1)).join(' ')}`).join(' ');
const london=[51.5074,-.1278],origin=xy(london);
const rays=[[50.823,-.138],[51.538,.714],[51.386,1.383],[51.28,1.08],[51.381,-2.359],[51.454,-2.588],[51.752,-1.258],[52.205,.119],[52.63,1.297],[50.72,-1.88],[51.069,-1.795],[51.889,.903]];
const labels=[['EAST ANGLIA',52.52,.65],['OXFORDSHIRE',51.98,-1.5],['KENT',51.38,.95],['SUSSEX',50.98,-.22],['HAMPSHIRE',51.16,-1.22],['SURREY',51.25,-.72],['ENGLISH CHANNEL',50.6,.6],['NORTH SEA',52.05,1.55]];
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white"/><g fill="white" stroke="#d8ddff" stroke-width="3">${land.map(ring=>`<path d="${path(ring.map(([lng,lat])=>[lat,lng]))}Z"/>`).join('')}</g><g fill="none" stroke="#d9d9d9" stroke-width="2" stroke-dasharray="3 10">${rays.map(p=>`<path d="M${origin.join(' ')} L${xy(p).join(' ')}"/>`).join('')}</g><g font-family="Arial,sans-serif" fill="#999" font-size="23" letter-spacing="2" text-anchor="middle">${labels.map(([name,lat,lng])=>`<text x="${xy([lat,lng])[0]}" y="${xy([lat,lng])[1]}">${name}</text>`).join('')}</g><circle cx="${origin[0]}" cy="${origin[1]}" r="20" fill="#ffff18"/><circle cx="${origin[0]}" cy="${origin[1]}" r="5" fill="#111"/><text x="${origin[0]+30}" y="${origin[1]+10}" font-family="Arial,sans-serif" font-size="29" fill="#111">LONDON</text><text x="35" y="55" fill="#727272" font-family="Arial,sans-serif" font-size="21">N ↑</text></svg>`;
export const mapArtwork=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
