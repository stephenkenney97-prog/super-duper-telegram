import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as db from './firebase.js';
import {getWateringStatus} from '../frontend/utils/watering.js';
import {getMimeTypeFromDataUrl} from '../frontend/utils/media.js';
const memory=new Map();
globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
test('watering transitions: overdue, due soon, watered; legacy dates',()=>{
 const now=new Date('2026-10-25T12:00:00Z');
 const plant={wateringIntervalDays:7,createdAt:new db.Timestamp(now.getTime()-8*86400000)};
 assert.equal(getWateringStatus(plant,now).state,'overdue');
 plant.lastWateredAt=new db.Timestamp(now.getTime()-6.5*86400000);
 assert.equal(getWateringStatus(plant,now).state,'due-soon');
 plant.lastWateredAt=new db.Timestamp(now.getTime());
 assert.equal(getWateringStatus(plant,now).state,'ok');
});
test('PNG and JPEG MIME types remain distinct',()=>{
 assert.equal(getMimeTypeFromDataUrl('data:image/png;base64,AA=='),'image/png');
 assert.equal(getMimeTypeFromDataUrl('data:image/jpeg;base64,AA=='),'image/jpeg');
});
test('simulated store persists timestamps, edits, and removes child logs with parent',async()=>{
 db.resetSmokeData();
 const plants=db.collection(null,'/artifacts/test/users/smoke/plants');
 const {id}=await db.addDoc(plants,{name:'A',createdAt:db.Timestamp.now()});
 const parent=db.doc(null,plants.path,id);
 await db.updateDoc(parent,{name:'B'});
 let snap=await db.getDocs(plants);
 assert.equal(snap.docs[0].data().name,'B');
 assert.ok(snap.docs[0].data().createdAt.toDate() instanceof Date);
 const logs=db.collection(null,parent.path+'/healthLogs');
 await db.addDoc(logs,{userNotes:'test'});
 assert.equal((await db.getDocs(plants)).docs.length,1);
 const batch=db.writeBatch();
 for(const log of (await db.getDocs(logs)).docs)batch.delete(log.ref);
 batch.delete(parent);await batch.commit();
 assert.deepEqual(db.inspectSmokeData(),{});
});
