// Deliberately limited test double. No Firebase services or credentials are used.
const KEY = 'flora-pr3-smoke-v1';
export class Timestamp {
  constructor(ms) { this.ms = ms; }
  static now() { return new Timestamp(Date.now()); }
  toDate() { return new Date(this.ms); }
  toJSON() { return {__smokeTimestamp:this.ms}; }
}
const revive = (_, value) => value && typeof value.__smokeTimestamp === 'number' ? new Timestamp(value.__smokeTimestamp) : value;
const read = () => JSON.parse(localStorage.getItem(KEY) || '{}', revive);
const listeners = new Set();
const persist = (data) => { localStorage.setItem(KEY, JSON.stringify(data)); for (const cb of listeners) cb(); };
const clean = p => p.replace(/^\/+|\/+$/g,'');
export const initializeApp = () => ({});
export const getApps = () => [];
export const getAuth = () => ({});
export const getFirestore = () => ({});
export const onAuthStateChanged = (_, cb) => { let active=true; queueMicrotask(()=>active && cb({uid:'smoke-user'})); return ()=>{active=false;}; };
export const signInAnonymously = async () => {};
export const signInWithCustomToken = signInAnonymously;
export const collection = (_, path) => ({path:clean(path)});
export const doc = (_, path, id) => ({path:clean(path)+(id?'/'+id:'')});
export const orderBy = (field,direction) => ({field,direction});
export const query = (ref,order) => ({...ref,order});
export const getDocs = async ref => snapshot(ref);
function snapshot(ref) {
  const prefix=ref.path+'/';
  let docs=Object.entries(read()).filter(([p])=>p.startsWith(prefix)&&!p.slice(prefix.length).includes('/')).map(([path,value])=>({id:path.slice(prefix.length),ref:{path},data:()=>value}));
  if(ref.order) { const {field,direction}=ref.order; const val=v=>v?.toDate ? v.toDate().getTime() : v; docs.sort((a,b)=>(val(a.data()[field])-val(b.data()[field]))*(direction==='desc'?-1:1)); }
  return {docs};
}
export const onSnapshot = (ref,cb,onError) => { const emit=()=>{try{cb(snapshot(ref));}catch(e){onError?.(e);}}; listeners.add(emit); queueMicrotask(emit); return ()=>listeners.delete(emit); };
export const addDoc = async (ref,value) => { const id=crypto.randomUUID(); const data=read(); data[ref.path+'/'+id]=value; persist(data); return {id}; };
export const updateDoc = async (ref,value) => { const data=read(); if(!data[ref.path])throw Error('Document missing'); data[ref.path]={...data[ref.path],...value}; persist(data); };
export const deleteDoc = async ref => {const data=read();delete data[ref.path];persist(data);};
export const writeBatch = () => {const paths=[];return {delete:ref=>paths.push(ref.path),commit:async()=>{if(paths.length>500)throw Error('Simulated batch limit');const data=read();for(const p of paths)delete data[p];persist(data);}};};
export const resetSmokeData = () => persist({});
export const inspectSmokeData = read;
