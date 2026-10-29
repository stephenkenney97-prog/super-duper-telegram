import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';

const bundle = await build({entryPoints:['frontend/utils/ai.js'], bundle:true, platform:'node', format:'esm', write:false});
const {getAiHealthAnalysis} = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);

test('diagnosis sends PNG and JPEG to the supported Gemini model and parses a response', async () => {
  globalThis.window = {__gemini_api_key:'test-only'};
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({url, payload:JSON.parse(options.body)});
    return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({health_summary:'fixture',potential_issues:[],care_recommendations:[]})}]}}]}), {status:200});
  };
  for (const type of ['png','jpeg']) {
    const result = await getAiHealthAnalysis({base64Image:`data:image/${type};base64,AA==`,userNotes:'test'});
    assert.equal(result.health_summary, 'fixture');
    const request = requests.at(-1);
    assert.match(request.url, /^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-3\.5-flash-lite:generateContent\?/);
    assert.equal(request.payload.contents[0].parts[1].inlineData.mimeType, `image/${type}`);
    assert.equal(request.payload.contents[0].parts[1].inlineData.data, 'AA==');
  }
});
