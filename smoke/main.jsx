import React from 'react';
import {createRoot} from 'react-dom/client';
import {resetSmokeData} from './firebase';
import './style.css';
window.__firebase_config=JSON.stringify({apiKey:'simulation-only'});
window.__app_id='flora-pr3-smoke';
window.__gemini_api_key='simulation-only';
const nativeFetch=window.fetch.bind(window);
window.fetch=async (url,options)=>{
 if(String(url).includes('googleapis.com')) {
  if(!String(url).startsWith('https://generativelanguage.googleapis.com/')) throw Error('Incorrect Gemini hostname');
  if(document.querySelector('#ai-fail')?.checked)return new Response('Simulated API failure',{status:503});
  const payload=JSON.parse(options.body);
  const mime=payload.contents[0].parts[1].inlineData.mimeType;
  if(!['image/png','image/jpeg'].includes(mime))return new Response('Unsupported image type',{status:400});
  window.__lastSmokeGeminiRequest={url:String(url).split('?')[0],payload};
  return Response.json({candidates:[{content:{parts:[{text:JSON.stringify({plant_species:'SIMULATED plant',health_summary:'SIMULATED response — not a real diagnosis.',potential_issues:['Test fixture only'],care_recommendations:['Use real-service verification before merge.']})}]}}]});
 }
 return nativeFetch(url,options);
};
const {default:App}=await import('../frontend/App.jsx');
createRoot(document.getElementById('root')).render(<><aside className="bg-amber-100 p-4 text-gray-900"><strong>ISOLATED TEST MODE — simulated Firebase and Gemini</strong><p>Only disposable browser data. No real diagnosis or cloud writes.</p><label><input id="ai-fail" type="checkbox"/> Simulate Gemini failure</label><button className="ml-6 underline" onClick={()=>{if(confirm('Delete ONLY this test setup’s local records?'))resetSmokeData();}}>Reset test data</button></aside><App/></>);
