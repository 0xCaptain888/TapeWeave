import assert from 'node:assert/strict';
import {makeRecord} from './validation-record.mjs';
const input = {kind:'author-mobile',device:'测试设备',mode:'both',prediction:'2/1',actions:'0011 byte then plain',observed:'未执行复制',help_and_failures:'复制未完成',result:'incomplete'};
const record = makeRecord(input);
assert.equal(record.authenticated, false);
assert.equal(record.chain_identity, null);
assert.equal(record.result, 'incomplete');
assert.equal(record.consent_reported, null);
for (const key of ['device','prediction','actions','observed','help_and_failures','result']) {
  assert.throws(() => makeRecord({...input,[key]:''}));
}
assert.throws(() => makeRecord({...input, kind:'independent-player'}), /同意/);
assert.equal(makeRecord({...input,kind:'independent-player',consent:true,result:'fail'}).result,'fail');
assert.throws(() => makeRecord({...input,mode:'fake'}));
assert.throws(() => makeRecord({...input,device:'x'.repeat(301)}));
assert.equal(makeRecord({...input,observed:'<script>alert(1)</script>'}).observed,'<script>alert(1)</script>');
assert.equal(input.result,'incomplete');
console.log('PASS: manual record validation, consent gate, explicit verdict, limits, no identity/chain claims');
