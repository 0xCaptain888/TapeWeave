import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {translate} from './i18n.mjs';
import {messages} from './i18n-catalog.mjs';
import {ACCEPTANCE_TASKS} from './device-acceptance.mjs';

const chinese=/[\u3400-\u9fff]/u;
for(const [source,target]of Object.entries(messages)){
  assert.ok(source&&target,'empty catalog entry');
  assert.ok(!chinese.test(target),'Chinese in English translation: '+source);
  assert.equal(translate(source),target,source);
  assert.equal(translate(source,'zh'),source);
}
for(const file of (await readdir(new URL('./',import.meta.url))).filter(x=>x.endsWith('.html'))){
  const html=await readFile(new URL(file,import.meta.url),'utf8');
  assert.match(html,/src="i18n\.mjs"/,file);
  // Editable defaults are content, never translated automatically.
  const ui=html.replace(/<(textarea|script|style)\b[^>]*>[\s\S]*?<\/\1>/g,'');
  for(const match of ui.matchAll(/>([^<>]+)</g)){
    if(chinese.test(match[1]))assert.ok(!chinese.test(translate(match[1])),`${file}: ${match[1]}`);
  }
}
for(const tasks of Object.values(ACCEPTANCE_TASKS))for(const [,title,guide]of tasks){
  assert.ok(!chinese.test(translate(title)),title);assert.ok(!chinese.test(translate(guide)),guide);
}
assert.equal(translate('第2步 · 状态0 · 电路字节计算'),'Step 2 · State 0 · Circuit byte evaluation');
assert.equal(translate('已保存 我的作品 v3'),'Saved 我的作品 v3','preserve user content');
assert.equal(translate('装载 v2 · 我的作品'),'Load v2 · 我的作品');
assert.equal(translate('创作包字节、摘要或证据标记不匹配'),'Artifact bytes, digest or evidence marker do not match');
assert.equal(translate('0x440c3CC7DdD50566126754199Df7336499eE1E20'),'0x440c3CC7DdD50566126754199Df7336499eE1E20');
assert.equal(translate('{"title":"我的作品"}'),'{"title":"我的作品"}');
console.log(`PASS i18n: ${Object.keys(messages).length} messages, 11 HTML pages, acceptance guides, dynamic labels and data boundaries`);
