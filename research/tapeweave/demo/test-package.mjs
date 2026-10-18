import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPackage, parsePackage} from './package.mjs';
const {cards} = JSON.parse(await readFile(new URL('../reference-bundle-v1.json',import.meta.url)));
let count=0;
for (const card of cards) for (const world of ['training','garden']) for (let n=0;n<16;n++) {
  const pack=createPackage(card,world,[...n.toString(2).padStart(4,'0')].map(Number),'作品😀','<script>仅文本</script>');
  assert.deepEqual(parsePackage(JSON.stringify(pack),cards),pack);count++;
}
const base=createPackage(cards[0],'training',[0,0,1,1],'标题','说明');
const mutations=[p=>p.card.sha256='wrong',p=>p.card.netlist_hex='00',p=>p.card.chain_identity={},
 p=>p.rules.initial_state=1,p=>p.rules.windows[0]=true,p=>p.rules.profile='other',p=>p.rules.world='other',
 p=>p.prediction.expected_request=1,p=>p.prediction.question='自定义',p=>p.title=' ',p=>p.description='',
 p=>p.extra=1,p=>p.rules.extra=1,p=>p.card.mode='unknown',p=>p.evidence='onchain',p=>p.rules.initial_state=false];
for(const mutate of mutations) {const pack=structuredClone(base);mutate(pack);assert.throws(()=>parsePackage(JSON.stringify(pack),cards));}
for(const text of ['null','[]','{',' '.repeat(65537)]) assert.throws(()=>parsePackage(text,cards));
// Browser intentionally documents JSON.parse last-key semantics, unlike Python's duplicate rejection.
assert.deepEqual(parsePackage(JSON.stringify(base).replace('"title":"标题"','"title":"ignored","title":"标题"'),cards),base);
console.log(`passed: ${count} package round trips, ${mutations.length+4} rejections, documented duplicate-key semantics`);
