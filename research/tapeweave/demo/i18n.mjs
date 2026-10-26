import {messages} from './i18n-catalog.mjs';

const normalize = text => text.replace(/\s+/g, ' ').trim();
const dictionary = new Map(Object.entries(messages).map(([source,target])=>[normalize(source),target]));
export function translate(text, language='en') {
  if(language!=='en'||!/[\u3400-\u9fff]/u.test(text))return text;
  const key=normalize(text), match=dictionary.get(key);
  if(match!==undefined)return text.replace(text.trim(),match);
  if(text.includes('\n'))return text.split('\n').map(line=>translate(line,language)).join('\n');
  const patterns=[
    [/^第(\d+)步 · 状态(\d+) · (.+)$/,(_,step,state,mode)=>`Step ${step} · State ${state} · ${translate(mode)}`],
    [/^第(\d+)行(.+)$/,(_,row,label)=>`Row ${row}: ${translate(label)}`],
    [/^交互 (\d+) · (.+)$/,(_,n,hash)=>`Interaction ${n} · ${hash}`],
    [/^(蓄能|交替) · #(.+)$/,(_,name,id)=>`${name==='蓄能'?'Charge':'Alternating'} · #${id}`],
    [/^宿主：(.+)$/,(_,host)=>`Host: ${host}`],
    [/^步数 (\d+) · 能量状态 (\d+) · (.+)$/,(_,step,state,rest)=>`Step ${step} · Energy state ${state} · ${translate(rest)}`],
    [/^获得印章 (\d+) · 剩余库存 (\d+)$/,(_,n,stock)=>`Stamps ${n} · Remaining stock ${stock}`],
    [/^同一行为 SHA-256：(.+) · 模式 (.+) · 两个零初态实例$/,(_,hash,mode)=>`Shared behavior SHA-256: ${hash} · Mode ${mode} · Two zero-state instances`],
    [/^已连接 (.+)$/,(_,account)=>`Connected ${account}`],
    [/^11 笔交易已记录；外层交易实付合计 (.+)，UOP 实付合计 (.+)。单 RPC 核验，签名未重验。$/,(_,outer,uop)=>`11 recorded transactions · Outer transaction fees: ${outer} · UOP fees: ${uop}. Single-RPC verification; signatures not reverified.`],
    [/^实时读取完成；运行时代码匹配，(.+)。单 RPC，未推进状态。$/,(_,result)=>`Live read complete; runtime matches. ${translate(result)}. Single RPC; state not advanced.`],
    [/^两端点交叉核验通过：固定块 (\d+)，区块哈希、完整宿主代码和会话一致。选取较低链头减两块；两个端点可能共享基础设施，不是独立信任或最终性证明。未推进状态。$/,(_,block)=>`Two-endpoint cross-check passed at block ${block}: block hash, full runtime and session match. Uses the lower head minus two blocks. Endpoints may share infrastructure; this is not independent trust or finality proof. State not advanced.`],
    [/^本机共 (\d+) 笔回执记录。连接钱包后按账户展示；备份可在未连接时导出。$/,(_,n)=>`${n} local receipt records. Connect to filter by account. Export backups without connecting.`],
    [/^当前账户：(\d+) 个会话，(\d+) 笔本机回执。历史及导入内容仅为缓存；选择后将重新读取链上状态。$/,(_,sessions,receipts)=>`Current account: ${sessions} sessions, ${receipts} local receipts. History and imports are caches only; selection triggers a new chain read.`],
    [/^当前浏览器报告视口 (\d+) × (\d+)；触点 (\d+)。这些值不能证明实际 Android 硬件或插件。$/,(_,w,h,touch)=>`Browser-reported viewport ${w} × ${h}; touch points ${touch}. These values do not prove actual Android hardware or an extension.`],
    [/^装载 v(\d+) · (.+)$/,(_,version,title)=>`Load v${version} · ${title}`],
    [/^以v(\d+)为基准$/,(_,version)=>`Use v${version} as baseline`],
    [/^比较v(\d+)$/,(_,version)=>`Compare v${version}`],
    [/^回退至v(\d+)（追加）$/,(_,version)=>`Roll back to v${version} (append)`],
    [/^已恢复(\d+)件作品；未恢复执行进度。$/,(_,n)=>`Restored ${n} works; execution progress not restored.`],
    [/^已追加回退版本v(\d+)；接收方与执行状态未改变$/,(_,version)=>`Rollback appended as v${version}; recipients and execution state unchanged`],
    [/^已保存 (.+) v(\d+)$/,(_,id,version)=>`Saved ${id} v${version}`],
    [/^已装载(.+) v(\d+)的包；上方编辑表未改变，试用从零开始。$/,(_,id,version)=>`Loaded package ${id} v${version}. The editor table is unchanged; the trial starts from zero.`],
    [/^计算一致，但未认证。作品：(.+)；模式：(.+)；(\d+)步；自报结果：(.+)；观察：(.+)$/,(_,title,mode,steps,result,note)=>`Computation matches, unauthenticated. Work: ${title}; mode: ${mode}; ${steps} steps; self-reported result: ${result}; observation: ${note}`],
    [/^第(\d+)行：旧态(\d+) \+ 触发(\d+) \+ 补能(\d+) → 下一状态(\d+) \/ 请求(\d+)。字节与普通表一致；仅预览，当前局未改变，未计算宿主奖励。$/,(_,row,old,trigger,charge,next,request)=>`Row ${row}: old ${old} + trigger ${trigger} + charge ${charge} → next ${next} / request ${request}. Bytes and ordinary table match. Preview only; run unchanged, host rewards not evaluated.`],
    [/^(训练|钥匙门)：回合(\d+)\/4 · 状态(\d+) · 效果累计(\d+)(?: · 剩余钥匙(\d+))?$/,(_,host,round,state,score,keys)=>`${translate(host)}: round ${round}/4 · State ${state} · Total effects ${score}${keys===undefined?'':` · Keys left ${keys}`}`],
    [/^旧态(\d+) \+ 触发(\d+) \+ 补能(\d+) → 请求(\d+) \/ 新态(\d+) → 宿主效果(\d+)$/,(_,old,trigger,charge,request,next,effect)=>`Old ${old} + trigger ${trigger} + charge ${charge} → request ${request} / next ${next} → host effect ${effect}`],
    [/^回合 (\d+)\/4 · 状态 (\d+) · 得分 (\d+)(.*)$/,(_,round,state,score,tail)=>`Round ${round}/4 · State ${state} · Score ${score}${tail?' · Run complete':''}`],
    [/^动作 ([01]+)，最优分 (\d+)。合成系统参考，不代表真实体验或价值。$/,(_,actions,score)=>`Actions ${actions}, optimum score ${score}. Synthetic system reference, not real experience or value.`],
    [/^(预测正确|预测不同)：请求 (\d+)，下一状态 (\d+)。旧状态参与本拍输出；请求不等于宿主得分。$/,(_,verdict,request,next)=>`${translate(verdict)}: request ${request}, next state ${next}. Old state determines this step's output; a request is not a host score.`],
    [/^本拍请求 (\d+)；(使用上拍请求|使用本拍请求)生效 (\d+)，窗口 (\d+)，得分 \+(\d+)。(.*)$/,(_,request,mode,effect,window,gain,tail)=>`Request ${request}; ${translate(mode)}: ${effect}, window ${window}, score +${gain}. ${translate(tail)}`],
    [/^会话 #([^ ]+) · (蓄能卡|交替卡) · (\d+)\/4 步$/,(_,id,card,version)=>`Session #${id} · ${translate(card)} · ${version}/4 steps`],
    [/^训练 (\d+) 分；开门 (\d+) 次，剩 (\d+) 把钥匙$/,(_,score,door,keys)=>`Training ${score}; doors opened ${door}; keys left ${keys}`],
    [/^会话 #([^ ]+) · (\d+)\/4 步 · 训练 (\d+) · 开门 (\d+) · 余钥匙 (\d+)$/,(_,id,version,score,door,keys)=>`Session #${id} · ${version}/4 steps · Training ${score} · Doors ${door} · Keys left ${keys}`],
    [/^模拟通过，gas 上限 (\d+)，gas 单价 (\d+) wei$/,(_,gas,price)=>`Simulation passed; gas limit ${gas}, gas price ${price} wei`],
    [/^#([^ ]+) · (蓄能|交替) · (.+)$/,(_,id,card,progress)=>`#${id} · ${translate(card)} · ${translate(progress)}`],
    [/^(\d+)\/4 步（本机快照）$/,(_,n)=>`${n}/4 steps (local snapshot)`],
    [/^无法启动：(.+)。请使用支持相对资源的预览或本地HTTP服务。$/,(_,error)=>`Cannot start: ${translate(error)}. Use a preview supporting relative resources or a local HTTP server.`],
  ];
  for(const [pattern,render]of patterns)if(pattern.test(key))return key.replace(pattern,render);
  // Prefixes allow an exact UI label followed by an unmodified public address/error.
  for(const [source,target]of dictionary)if(/[：:]$/.test(source)&&key.startsWith(source))return target+translate(key.slice(source.length));
  return text;
}

export function installLanguageUI(doc=document, win=window) {
  const storageKey='tapeweave-ui-language-v1';
  const parameter=new URL(win.location.href).searchParams.get('lang');
  let saved;try{saved=win.localStorage.getItem(storageKey);}catch{}
  let language=['en','zh'].includes(parameter)?parameter:saved==='en'?'en':'zh';
  // Localize untouched sample metadata only on initial page load. Once loaded,
  // fields belong to the creator and language switches never rewrite them.
  if(language==='en')for(const [selector,source,target]of [
    ['#title','充能点灯','Charge & Light'],
    ['#name','我的互动作品','My interactive work'],
    ['#description','先点击补能，再点击触发，观察灯亮。每次释放后需要再次补能。','Charge first, then trigger to light the lamp. Recharge after each release.'],
    ['#description','先补能，再触发。','Charge first, then trigger.'],
    ['#description','先预测，再操作；请求与实际效果由回放分别解释。','Predict first, then act. The replay separates requests from actual effects.'],
  ]){const field=doc.querySelector(selector);if(field&&field.value===source)field.value=target;}
  const records=new WeakMap();
  const ignore='script,style,textarea,code,[translate="no"],#work-description';
  const switcher=doc.createElement('nav');switcher.className='language-switcher';switcher.setAttribute('aria-label','Language / 语言');switcher.setAttribute('translate','no');
  for(const [value,label]of [['zh','中文'],['en','English']]){
    const button=doc.createElement('button');button.type='button';button.textContent=label;button.dataset.language=value;
    button.addEventListener('click',()=>setLanguage(value));switcher.append(button);
  }
  (doc.querySelector('.brand-bar')??doc.querySelector('main')??doc.body).append(switcher);
  if(!switcher.closest('.brand-bar'))doc.querySelector('main')?.prepend(switcher);
  function text(node){
    const parent=node.parentElement;
    if(!parent||parent.closest(ignore))return;
    if(parent.closest('#work-title')&&!(node.data==='尚未装载作品'||records.get(node)?.source==='尚未装载作品'))return;
    const pre=parent.closest('pre');if(pre&&/^[\s]*[\[{]/.test(pre.textContent))return;
    const value=node.data,previous=records.get(node);
    const source=previous&&value===previous.rendered?previous.source:value;
    const rendered=translate(source,language);
    records.set(node,{source,rendered});if(rendered!==value)node.data=rendered;
  }
  function element(el){
    if(el.closest(ignore))return;
    for(const attr of ['aria-label','placeholder','title'])if(el.hasAttribute(attr)){
      const key=attr+'-i18n',old=records.get(el)??{},value=el.getAttribute(attr),previous=old[key];
      const source=previous&&value===previous.rendered?previous.source:value;
      const rendered=translate(source,language);old[key]={source,rendered};records.set(el,old);
      if(rendered!==value)el.setAttribute(attr,rendered);
    }
    if(el.matches('a[href]')){
      const url=new URL(el.getAttribute('href'),win.location.href);
      if(url.origin===win.location.origin&&/\.html$/.test(url.pathname)){
        url.searchParams.set('lang',language);el.setAttribute('href',url.pathname+url.search+url.hash);
      }
    }
  }
  function scan(root){
    if(root.nodeType===3){text(root);return;}
    if(root.nodeType===1)element(root);
    const walker=doc.createTreeWalker(root,win.NodeFilter.SHOW_ELEMENT|win.NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){const node=walker.currentNode;if(node.nodeType===3)text(node);else element(node);}
  }
  const observer=new win.MutationObserver(changes=>{
    for(const change of changes){
      if(change.type==='characterData')text(change.target);
      else if(change.type==='attributes')element(change.target);
      else for(const added of change.addedNodes)scan(added);
    }
  });
  function setLanguage(value){
    language=value;doc.documentElement.lang=value==='en'?'en':'zh-CN';
    try{win.localStorage.setItem(storageKey,value);}catch{}
    const url=new URL(win.location.href);url.searchParams.set('lang',value);
    try{win.history.replaceState(win.history.state,'',url);}catch{}
    for(const button of switcher.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.language===value));
    observer.disconnect();scan(doc.documentElement);
    observer.observe(doc.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title']});
    win.dispatchEvent(new win.CustomEvent('tapeweave-language-change',{detail:{language:value}}));
  }
  setLanguage(language);
  return {get language(){return language;},setLanguage,disconnect:()=>observer.disconnect()};
}
if(typeof document!=='undefined')installLanguageUI();
