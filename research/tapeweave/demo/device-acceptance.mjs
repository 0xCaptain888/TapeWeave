// Structured manual observations. Neither UA nor checkboxes attest to real hardware.
export const ACCEPTANCE_TASKS=Object.freeze({
 android:[
  ['touch','触摸与排版','在实际 Android 手机竖屏触摸作品页控件、展开折叠；横屏后再回竖屏。记录键盘遮挡、误触及页面溢出。'],
  ['clipboard','系统剪贴板','生成“手机作品v1”，实际点击复制并长按系统粘贴。权限拒绝与手动复制另记，不能算自动复制通过。'],
  ['import','导入与试用','实际粘贴装载蓄能＋lamp 包，补能→触发，应第2步 request1、灯亮。本人粘贴不能记为独立接收者。'],
  ['refresh','刷新恢复','刷新后点击恢复本机执行存档，应仍第2步、标题v1；再触发到第3步 request0，不能用重新生成代替恢复。'],
  ['metadata','元数据更新保留','只改 title 为v2，比较后保留进度，仍第3步；复制旧局备份。改回标题时步数也应保留。'],
  ['rules','规则改变清零','改成交替规则并尝试保留，应拒绝且原局不变；明确选择从零后0步，连续触发应请求1／0。'],
  ['versions','管理库追加回退','在新标识保存v1／v2，回退v1应追加v3，保留历史；刷新后仍有三版。不测试已有重要作品。'],
  ['tamper','错误不覆盖','修改包的SHA后导入，应拒绝且原作品／进度不变；普通模式有效包仍可运行。'],
  ['exhibit','展览触摸与复核','真机实际走完书屋／邮局两站，生成回放并粘贴复核。记录触摸、滚动、资源和复制问题。'],
 ],
 plugin:[
  ['connect','真实插件连接','使用实际 OKX／MetaMask 插件连接；记录钱包版本，确认连接本身没有交易或签名。'],
  ['network','网络与账户核对','在 X Layer 196 核对实际连接账户；网络不符时页面应停止，不用更改RPC返回值模拟。'],
  ['reject','钱包拒签','预览开局后在真实钱包点击拒绝，页面应显示取消，不留成功回执、不自动重发。'],
  ['send','真实确认与回执','重新预览，在真实钱包核对最终费用并确认；取得自己的新交易哈希，页面核验成功。填写该哈希。'],
  ['restore','刷新与续用','核验后刷新，连接同一账户，从我的会话重新读链续用；不重复发送已经完成的操作。'],
  ['account','账户变化保护','有预览时切换账户或网络，预览应失效；恢复原环境后必须重新预览。'],
 ],
 native:[
  ['capability','真实 AA 能力','实际钱包返回本链原生调用 supported，账户已有合约代码；钱包名称或本地mock不能替代。'],
  ['preview','AA 预览','当前AA的宿主内部调用模拟通过；钱包界面核对实际费用／赞助。内部模拟不能当完整UOP模拟。'],
  ['reject','AA 拒签','在实际钱包拒绝一次，不产生成功记录，不自动发起第二次请求。'],
  ['send','真实 AA 请求','实际确认 wallet_sendCalls 请求，返回原请求ID；填写自己的新链上交易哈希。'],
  ['recover','请求恢复','刷新后通过原钱包请求ID查询或手动哈希恢复；待处理时阻止重复发送。'],
  ['uop','成功 UOP 绑定','本页实际核对固定EntryPoint的成功事件、原AA sender、宿主日志区间和块末状态，填写该哈希。'],
  ['state','四步与版本','逐笔完成四步，核对两场景结果；旧版本停止，不暗中换版本重发。'],
 ],
});
const HASH=/^0x[0-9a-fA-F]{64}$/;
export function makeDeviceAcceptance(input){
 const tasks=ACCEPTANCE_TASKS[input.kind];if(!tasks)throw Error('非法验收类型');
 const text=(v,max,name)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error('请填写'+name);return v.trim();};
 const device=text(input.device,240,'设备与系统'),browser=text(input.browser,180,'浏览器／钱包版本');
 const revision=text(input.revision,80,'被测版本');if(!/^[0-9a-f]{7,40}$/.test(revision))throw Error('填写实际被测提交SHA');
 if(!Array.isArray(input.items)||input.items.length!==tasks.length)throw Error('验收条目不完整');
 const items=tasks.map(([id,title],i)=>{
  const v=input.items[i];if(v.id!==id||!['pass','fail','incomplete'].includes(v.result))throw Error('条目或结果错误');
  const note=typeof v.note==='string'?v.note.trim():'';if(note.length>1200||v.result!=='incomplete'&&!note)throw Error('通过／失败项须填写实际观察');
  const hash=typeof v.hash==='string'?v.hash.trim():'';
  if(hash&&!HASH.test(hash)||['send','uop'].includes(id)&&v.result==='pass'&&!HASH.test(hash))throw Error('链上操作通过项须填写真实交易哈希');
  return {id,title,result:v.result,observation:note,transactionHash:hash||null};
 });
 const all=items.every(v=>v.result==='pass');
 if(all&&input.actualDevice!==true)throw Error('全部通过须确认实际设备／插件已执行');
 return {format:'tapeweave-device-acceptance-v1',kind:input.kind,device,browser,revision,
  source:'manual-observation-not-attested',actualDeviceReported:input.actualDevice===true,
  hardwareAttested:false,pluginIdentityAttested:false,signatureRevalidated:false,chainReceiptsReverified:false,
  result:items.some(v=>v.result==='fail')?'fail':all?'pass':'incomplete',items};
}
