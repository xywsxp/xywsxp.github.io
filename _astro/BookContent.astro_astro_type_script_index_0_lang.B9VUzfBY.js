
const excluded = 'script,style,button:not(.wiki-term),input,textarea,select,.anno-ui,.anno-marker,.anno-card';
const rowKey = (row) => row.eventId || JSON.stringify([row.ts,row.host,row.file,row.id,row.version,row.reason,row.anchor?.quote,row.anchor?.prefix || '',row.anchor?.suffix || '']);
const tombstone = (row) => /^\[WITHDRAWN \| target:([\s\S]+)\]$/.exec(row.reason || '');
const structuredKey = (row) => {
  const match = /^\[(?!WITHDRAWN\s*\|)([^|\n\]]+?)\s*\|/.exec(row.reason || '');
  return match ? JSON.stringify([row.host,row.file,row.id,match[1]]) : null;
};
const bodyOf = (box) => box.querySelector('.stmt-body') || box;
const identity = (box) => ({ host: box.dataset.host, file: box.dataset.file, id: box.dataset.reviewId, version: box.dataset.version, purpose: 'learning' });
const same = (box, row) => { const i=identity(box); return i.file===row.file && i.id===row.id && row.purpose==='learning'; };

function clean(range) {
  const fragment=range.cloneContents(); fragment.querySelectorAll(excluded).forEach((n)=>n.remove()); return fragment.textContent || '';
}
function locateQuote(box, anchor) {
  if (!anchor?.quote) return null;
  const walker=document.createTreeWalker(bodyOf(box),NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest(excluded)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  const nodes=[]; let text='',node;
  while((node=walker.nextNode())) { nodes.push({node,start:text.length}); text+=node.textContent; }
  const matches=[];
  for(let at=text.indexOf(anchor.quote);at>=0;at=text.indexOf(anchor.quote,at+1)) {
    if(anchor.prefix && !text.slice(0,at).endsWith(anchor.prefix))continue;
    if(anchor.suffix && !text.slice(at+anchor.quote.length).startsWith(anchor.suffix))continue;
    matches.push(at);
  }
  if(matches.length!==1)return null;
  const start=matches[0],end=start+anchor.quote.length;
  const a=nodes.find(n=>n.start<=start&&n.start+n.node.length>start),b=nodes.find(n=>n.start<end&&n.start+n.node.length>=end);
  if(!a||!b)return null;
  const range=document.createRange();range.setStart(a.node,start-a.start);range.setEnd(b.node,end-b.start);return range;
}

function l() {
  if(document.documentElement.dataset.bookAnnotationsMounted)return;
  const boxes=[...document.querySelectorAll('.annotation-section[data-review-id]')];if(!boxes.length)return;
  document.documentElement.dataset.bookAnnotationsMounted='true';
  const article=document.querySelector('.sl-markdown-content');
  const files=new Set(boxes.map(b=>b.dataset.file)),host='jirl',storageKey='shift-review-inbox:'+host;
  const GH_REPO = 'xywsxp/xywsxp.github.io';
  const el=(tag,cls='',text='')=>{const n=document.createElement(tag);n.className=cls;n.textContent=text;return n;};
  const button=(cls,text,action)=>{const n=el('button','anno-btn '+cls,text);n.type='button';n.addEventListener('click',action);return n;};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const surfaces=new Map();
  const surface=(node,open,kind)=>{
    const state=surfaces.get(node)||{open:false,token:0};surfaces.set(node,state);
    if(state.open===open)return;
    const token=++state.token,wasHidden=node.hidden;
    const before=wasHidden?null:getComputedStyle(node);
    const from={opacity:before?.opacity||'0',transform:before?.transform==='none'?'translateY(0) scale(1)':before?.transform||`translateY(${kind==='panel'?8:4}px) scale(${kind==='panel'?.985:.98})`};
    state.animation?.cancel();state.open=open;node.hidden=false;node.inert=!open;node.dataset.open=String(open);node.setAttribute('aria-hidden',String(!open));node.style.visibility='visible';
    const end=()=>{if(state.token!==token)return;state.animation?.cancel();state.animation=undefined;node.hidden=!state.open;node.style.removeProperty('visibility');node.style.removeProperty('will-change');};
    if(reduced.matches){end();return;}
    node.style.willChange='transform, opacity';
    const animation=node.animate([from,{opacity:open?'1':'0',transform:open?'translateY(0) scale(1)':`translateY(${kind==='panel'?8:4}px) scale(${kind==='panel'?.985:.98})`}],{
      duration:kind==='panel'?(open?260:180):(open?180:120),easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards',
    });state.animation=animation;animation.finished.then(end).catch(()=>{});
  };
  const makeSurface=(tag,cls)=>{const n=el(tag,cls+' anno-ui');n.hidden=true;n.inert=true;n.dataset.open='false';n.setAttribute('aria-hidden','true');document.body.append(n);return n;};
  const pill=makeSurface('button','anno-pill');pill.type='button';pill.textContent='💬 Annotate selection';pill.setAttribute('aria-label','Annotate selected text');
  const panel=makeSurface('section','anno-panel');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-label','Annotations and Discussion');panel.tabIndex=-1;
  const toast=makeSurface('p','anno-toast');toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');let toastTimer;
  const message=(text)=>{toast.textContent=text;surface(toast,true,'toast');clearTimeout(toastTimer);toastTimer=setTimeout(()=>surface(toast,false,'toast'),4500);};
  const heading=el('h2','anno-panel-title','Annotations & Discussion'),status=el('p','anno-sync-state');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const compose=el('div','anno-compose'),preview=el('blockquote','anno-quote-preview');
  const authorLabel=el('label','anno-panel-label','Reviewer Name / Handle (optional)');
  const authorInput=el('input','anno-panel-author');authorInput.type='text';authorInput.maxLength=64;authorInput.placeholder='e.g. Alice / @handle';
  try{authorInput.value=localStorage.getItem('jirl-reviewer-name')||'';}catch{}
  authorInput.addEventListener('input',()=>{try{localStorage.setItem('jirl-reviewer-name',authorInput.value.trim());}catch{}});
  authorLabel.append(authorInput);
  const label=el('label','anno-panel-label','Annotation / Critique / Counterexample'),input=el('textarea','anno-panel-text');
  input.rows=4;input.maxLength=4000;input.placeholder='Write your critique, question, or counterexample for the selected passage...';label.append(input);
  const list=el('div','anno-list'),records=el('div','annotation-records'),actions=el('div','anno-panel-actions');list.append(records);
  let mode='compose',activeBox=null,returnFocus=null,busy=false;
  let pending=null,suppressed='',lastSignature='',triggerRect=null;
  const draftKey='review-draft:'+location.pathname;
  const readDraft=()=>{try{const d=JSON.parse(sessionStorage.getItem(draftKey)||'null');return d?.reason?d:null;}catch{return null;}};
  const saveDraft=(clear=false)=>{try{if(input.value.trim())sessionStorage.setItem(draftKey,JSON.stringify({reason:input.value,quote:pending?.anchor.quote||preview.textContent}));else if(clear)sessionStorage.removeItem(draftKey);return true;}catch{return false;}};
  input.addEventListener('input',()=>saveDraft());
  const restore=button('anno-restore-draft','Restore unsaved draft',()=>{const d=readDraft();if(d){input.value=d.reason;status.textContent='Draft restored. Verify quote and save.';input.focus();}});restore.hidden=true;
  const focusBack=()=>{
    const target=returnFocus?.isConnected&&!returnFocus.inert&&!returnFocus.hidden?returnFocus:activeBox||article;
    if(!target.hasAttribute('tabindex') && target.tagName!=='BUTTON')target.tabIndex=-1;
    target.focus({preventScroll:true});
  };
  const closePanel=()=>{if(busy)return;if(!saveDraft()&&input.value.trim())message('Could not stash draft in sessionStorage; please copy before closing.');if(pending)suppressed=pending.signature;focusBack();surface(panel,false,'panel');surface(pill,false,'pill');};
  const close=button('anno-close','Close',closePanel);
  const discard=button('anno-discard','Discard draft',()=>{input.value='';saveDraft(true);closePanel();});
  const cancel=button('anno-cancel','Keep draft & close',closePanel);
  const submitGh=button('anno-submit','🚀 Save & Publish Shared Annotation (GitHub)',()=>void save(true));
  const submitLocal=button('anno-submit-local','💾 Save Locally Only',()=>void save(false));
  const showList=button('anno-show-list','View All Annotations',()=>openList(null));
  const copyMdBtn=button('anno-copy-md','📋 Copy Markdown',()=>void copyMarkdown());
  const retry=button('anno-retry','🔄 Sync Shared',()=>void sync());
  const exportButton=button('anno-export','📤 Export JSONL',()=>exportLocal());
  const exportRaw=button('anno-export-raw','Export Raw Backup',()=>exportLocal(true));
  compose.append(preview,authorLabel,label,restore,submitGh,submitLocal,cancel,discard,showList);
  actions.append(copyMdBtn,retry,exportButton,exportRaw,close);
  panel.append(heading,compose,list,status,actions);

  let storageBlocked=false;const corrupt=new Set(),rawCopies=new Map();
  function loadLocal() {
    storageBlocked=false;corrupt.clear();rawCopies.clear();const rows=[];
    const read=(key,legacy=false)=>{
      try{
        const text=localStorage.getItem(key);if(text===null)return;rawCopies.set(key,text);
        const value=JSON.parse(text);
        if(legacy&&Array.isArray(value))rows.push(...value);
        else if(!legacy&&value&&typeof value==='object'&&!Array.isArray(value))rows.push(value);
        else corrupt.add(key);
      }catch{if(rawCopies.has(key))corrupt.add(key);else storageBlocked=true;}
    };
    read(storageKey,true);
    try{const keys=Array.from({length:localStorage.length},(_,i)=>localStorage.key(i));for(const key of keys)if(key?.startsWith(storageKey+':row:'))read(key);}catch{storageBlocked=true;}
    const seen=new Set();return rows.filter(row=>{if(!row||typeof row!=='object'||Array.isArray(row)){corrupt.add(storageKey);return false;}const key=rowKey(row);if(seen.has(key))return false;seen.add(key);return true;});
  }
  const newEventId=()=>crypto.randomUUID();
  const append=(row)=>{row.eventId||=newEventId();try{localStorage.setItem(storageKey+':row:'+row.eventId,JSON.stringify(row));return true;}catch{return false;}};
  const localRows=()=>loadLocal().filter(row=>row.kind==='annotation'&&row.purpose==='learning');
  const confirmed=new Map();let syncing=false,syncAgain=false,reachable=false,failed=false;
  const markers=new Map();let historyMarker=null;
  const belongs=(row)=>files.has(row.file);
  function model() {
    const local=localRows(),all=new Map();
    for(const row of [...confirmed.values(),...local]) {
      const k = rowKey(row);
      const prev = all.get(k);
      all.set(k, prev ? { ...row, ...prev, issueUrl: prev.issueUrl || row.issueUrl, issueNumber: prev.issueNumber || row.issueNumber, author: prev.author || row.author, reply: prev.reply || row.reply } : row);
    }
    const withdrawn=new Set();for(const row of all.values()){const t=tombstone(row);if(t)withdrawn.add(t[1]);}
    const latest=new Map();
    const active=[...all.values()].filter(row=>!tombstone(row)&&!withdrawn.has(rowKey(row)));
    for(const row of active){const key=structuredKey(row);if(!key)continue;const old=latest.get(key);if(!old||(Date.parse(row.ts)||0)>=(Date.parse(old.ts)||0))latest.set(key,row);}
    const visible=active.filter(row=>!structuredKey(row)||latest.get(structuredKey(row))===row);
    const pendingOps=local.filter(row=>!confirmed.has(rowKey(row))&&(tombstone(row)||!withdrawn.has(rowKey(row))));
    return{local,visible,pendingOps};
  }
  function describeState() {
    const {visible,pendingOps}=model();
    const sharedCount = confirmed.size;
    return syncing?'Syncing shared annotations from GitHub Issues...':storageBlocked?'Browser storage restricted; you can still publish via GitHub Issues.':`${visible.length} total annotations (${sharedCount} shared on GitHub Issues, ${pendingOps.length} stored locally). Copy as Markdown or publish to GitHub.`;
  }
  function rowsFor(box) {
    const m=model();return{...m,rows:m.visible.filter(row=>belongs(row)&&(!box||same(box,row))),ops:m.pendingOps.filter(row=>belongs(row)&&(!box||same(box,row)))};
  }
  function placePanel() {
    if(panel.dataset.open!=='true')return;
    const v=visualViewport,left=v?.offsetLeft||0,top=v?.offsetTop||0,width=v?.width||innerWidth,height=v?.height||innerHeight;
    panel.style.maxHeight=Math.max(32,height-32)+'px';panel.style.maxWidth=Math.max(32,width-32)+'px';
    const w=panel.offsetWidth,h=panel.offsetHeight,r=triggerRect;
    const x=width<640?left+16:Math.max(left+16,Math.min(r?.left||left+width-w-16,left+width-w-16));
    const y=width<640?top+height-h-16:Math.max(top+16,Math.min((r?.bottom||top)+8,top+height-h-16));
    panel.style.left=x+'px';panel.style.top=y+'px';panel.style.transformOrigin=`${Math.max(0,Math.min(w,(r?.left||x)-x))}px 0`;
  }
  function showPanel(next,box,trigger,rect) {
    mode=next;activeBox=box;returnFocus=trigger;triggerRect=rect||trigger?.getBoundingClientRect()||null;
    compose.hidden=mode!=='compose';list.hidden=mode!=='list';heading.textContent=mode==='compose'?'✍️ Annotate Selected Passage':box?`Section Annotations (${box.dataset.reviewLabel||''})`:'💬 All Page Annotations & Discussion';
    status.textContent=describeState();exportRaw.hidden=!corrupt.size;
    surface(pill,false,'pill');surface(panel,true,'panel');placePanel();
    if(mode==='compose'){restore.hidden=!readDraft();input.focus({preventScroll:true});}else{renderList();panel.focus({preventScroll:true});}
  }
  function openList(box,trigger) { showPanel('list',box,trigger||returnFocus); }
  window.openJirlAnnotations = () => openList(null, document.querySelector('.jirl-anno-open-btn'));

  function updateHeaderBadge() {
    const {visible} = model();
    for (const btn of document.querySelectorAll('.jirl-anno-open-btn')) {
      btn.textContent = visible.length ? `💬 Annotations (${visible.length})` : '💬 Annotations';
    }
  }

  function markerFor(box,rows,ops) {
    let marker=box?markers.get(box):historyMarker;
    if(!rows.length&&!ops.length&&!(box===null&&corrupt.size)) {if(marker){if(marker===document.activeElement){activeBox=box;returnFocus=null;focusBack();}marker.remove();if(box)markers.delete(box);else historyMarker=null;}return;}
    if(!marker){
      marker=button('anno-marker',String(rows.length||'·'),()=>openList(box,marker));marker.classList.add('anno-ui');
      marker.setAttribute('aria-haspopup','dialog');if(box)markers.set(box,marker);else historyMarker=marker;
      let range=null;
      if(box)for(const row of rows)if(row.version===identity(box).version&&(range=locateQuote(box,row.anchor)))break;
      if(range&&!((range.endContainer.parentElement)?.closest('.katex'))) {range.collapse(false);range.insertNode(marker);}else(box||article).append(marker);
    }
    marker.textContent=String(rows.length||'·');
    marker.setAttribute('aria-label',`${box?'Section':'Page'} annotations: ${rows.length}`);
  }
  function renderList() {
    if(mode!=='list')return;
    const {rows}=rowsFor(activeBox);records.replaceChildren();
    if(!rows.length) {
      const emptyTip = el('p','anno-empty','No annotations yet. Select any sentence, theorem, or formula in the paper to pop up the "💬 Annotate selection" button.');
      records.append(emptyTip);
    }
    for(const row of rows){
      const box=boxes.find(b=>same(b,row)),stale=!box||identity(box).version!==row.version,persisted=confirmed.has(rowKey(row))||Boolean(row.issueUrl);
      const card=el('article','anno-card');card.dataset.annotationKey=rowKey(row);
      const authorTag = row.author ? `👤 ${row.author} · ` : '';
      const sectionTag = box?.dataset.reviewLabel ? `[${box.dataset.reviewLabel}] · ` : '';
      const meta=el('p','anno-meta',`${authorTag}${sectionTag}${String(row.ts||'').slice(0,16).replace('T',' ')}Z · ${persisted?'🌐 Shared on GitHub Issues':'💻 Local browser only'}${stale?' · Prior version':''}`);
      card.append(meta,el('blockquote','anno-quote-preview',row.anchor?.quote||''),el('p','anno-text',row.reason||''));
      if(row.reply)card.append(el('p','anno-reply','💬 Replies: '+row.reply));
      const cardBtns = el('div', 'anno-card-actions');
      if(!stale)cardBtns.append(button('anno-locate','🎯 Locate in text',()=>{
        const range=locateQuote(box,row.anchor);if(!range){message('Quote matches multiple locations or text changed.');return;}
        for(let p=range.startContainer.parentElement;p;p=p.parentElement)if(p instanceof HTMLDetailsElement){p.open=true;p.dispatchEvent(new CustomEvent('book:reveal-details',{bubbles:true}));}
        range.startContainer.parentElement?.scrollIntoView({block:'center'});
        if(globalThis.CSS?.highlights&&globalThis.Highlight)CSS.highlights.set('review-quote',new Highlight(range));
        message('Highlighted quoted passage in text.');
      }));
      if(row.issueUrl) {
        const ghLink = el('a', 'anno-btn anno-gh-link', `💬 GitHub Issue #${row.issueNumber || ''} ↗`);
        ghLink.href = row.issueUrl; ghLink.target = '_blank'; ghLink.rel = 'noopener';
        cardBtns.append(ghLink);
      } else {
        cardBtns.append(button('anno-publish-one', '🚀 Publish to GitHub', () => openGitHubIssueFor(row, box)));
      }
      if(!confirmed.has(rowKey(row))) {
        cardBtns.append(button('anno-delete','Delete local',()=>void withdraw(row,box)));
      }
      card.append(cardBtns);
      records.append(card);
    }
    status.textContent=describeState();exportRaw.hidden=!corrupt.size;placePanel();
  }
  function render() {
    const {visible,pendingOps}=model();
    for(const box of boxes)markerFor(box,visible.filter(r=>same(box,r)),pendingOps.filter(r=>same(box,r))));
    markerFor(null,visible.filter(r=>belongs(r)&&!boxes.some(b=>same(b,r))),pendingOps.filter(r=>belongs(r)&&!boxes.some(b=>same(b,r))));
    updateHeaderBadge();
    if(panel.dataset.open==='true'){status.textContent=describeState();if(mode==='list')renderList();}
  }
  async function withdraw(row,box) {
    const targetId=row.eventId||rowKey(row),record={ts:new Date().toISOString(),eventId:newEventId(),host,file:row.file,id:row.id,version:box?.dataset.version||row.version,purpose:'learning',kind:'annotation',reason:`[WITHDRAWN | target:${targetId}]`,anchor:{quote:(row.anchor?.quote||'withdrawn').slice(0,200),prefix:'',suffix:''},handled:false};
    if(!append(record)){message('Failed to record deletion in browser storage.');return;}
    render();
    message('Removed local annotation.');
  }

  function openGitHubIssueFor(row, box) {
    const headingEl = box?.querySelector('h2, h3, h1');
    const slug = headingEl?.id ? '#' + headingEl.id : '';
    const secLabel = box?.dataset.reviewLabel || 'Section';
    const pageUrl = 'https://xywsxp.github.io/jirl-formal-paper/' + slug;
    const shortQuote = (row.anchor?.quote || '').replace(/\s+/g, ' ').slice(0, 52);
    const title = `[Annotation] ${secLabel}: "${shortQuote}${(row.anchor?.quote||'').length > 52 ? '...' : ''}"`;
    const metaPayload = JSON.stringify({
      eventId: row.eventId,
      ts: row.ts,
      host: 'jirl',
      file: row.file,
      id: row.id,
      version: row.version,
      purpose: 'learning',
      kind: 'annotation',
      author: row.author || undefined,
      reason: row.reason,
      anchor: row.anchor
    });
    const body = [
      `### 📌 Section: [${secLabel}](${pageUrl})`,
      row.author ? `**Reviewer:** ${row.author}` : '',
      '',
      '#### Quoted Passage',
      `> ${(row.anchor?.quote || '').split('\n').join('\n> ')}`,
      '',
      '#### Annotation / Critique',
      row.reason,
      '',
      '---',
      '*Once submitted, this annotation is automatically synced and anchored inline on the JIRL paper webpage.*',
      `<!-- jirl-annotation: ${metaPayload} -->`
    ].filter(Boolean).join('\n');
    const url = `https://github.com/${GH_REPO}/issues/new?labels=jirl-annotation&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener');
  }

  async function readServer() {
    const response = await fetch(`https://api.github.com/repos/${GH_REPO}/issues?labels=jirl-annotation&state=all&per_page=100`, {
      headers: { 'Accept': 'application/vnd.github+json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    if(!response.ok) throw Error('Failed to fetch GitHub Issues annotations');
    const issues = await response.json();
    if(!Array.isArray(issues)) throw Error('Invalid GitHub Issues response');
    confirmed.clear();
    for(const issue of issues) {
      if (!issue || typeof issue.body !== 'string') continue;
      const match = /<!--\s*jirl-annotation:\s*(\{[\s\S]*?\})\s*-->/.exec(issue.body);
      if (!match) continue;
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed && parsed.kind === 'annotation' && parsed.anchor?.quote) {
          parsed.author = parsed.author || issue.user?.login || 'GitHub Reviewer';
          parsed.issueUrl = issue.html_url;
          parsed.issueNumber = issue.number;
          parsed.handled = issue.state === 'closed';
          if (issue.comments > 0) {
            parsed.reply = `${issue.comments} comment(s) on GitHub Issue #${issue.number}`;
          }
          confirmed.set(rowKey(parsed), parsed);
        }
      } catch {}
    }
    reachable=true;render();
  }

  async function sync() {
    if(syncing){syncAgain=true;return;}if(!/^https?:$/.test(location.protocol))return;
    syncing=true;failed=false;if(panel.dataset.open==='true')status.textContent=describeState();
    try{
      await readServer();
    }catch{failed=true;}
    finally{syncing=false;render();if(syncAgain){syncAgain=false;void sync();}}
  }

  async function save(publishToGitHub = false) {
    if(busy||!pending)return;if(!input.value.trim()){status.textContent='Please enter annotation text.';return;}
    const authorName = authorInput.value.trim();
    const row={ts:new Date().toISOString(),eventId:newEventId(),host:'jirl',file:pending.file,id:pending.id,version:pending.version,purpose:'learning',kind:'annotation',author:authorName||undefined,reason:input.value.trim(),anchor:pending.anchor,handled:false};
    append(row);
    busy=true;submitGh.disabled=true;submitLocal.disabled=true;render();input.value='';saveDraft(true);
    const box=pending.box;activeBox=box;returnFocus=markers.get(box)||box;busy=false;closePanel();
    submitGh.disabled=false;submitLocal.disabled=false;
    if (publishToGitHub) {
      openGitHubIssueFor(row, box);
      message('Saved locally & opened pre-filled GitHub Issue tab (click "Submit new issue" to share publicly).');
    } else {
      message('Saved in local browser! Use "Copy Markdown" or "Publish to GitHub" anytime.');
    }
  }

  async function copyMarkdown() {
    const {visible} = model();
    if (!visible.length) { message('No annotations to copy.'); return; }
    const lines = ['# JIRL Paper Annotations (https://xywsxp.github.io/jirl-formal-paper/)', ''];
    visible.forEach((row, idx) => {
      const box = boxes.find(b => same(b, row));
      const secTitle = box?.dataset.reviewLabel || row.id;
      const headingEl = box?.querySelector('h2, h3, h1');
      const slug = headingEl?.id ? '#' + headingEl.id : '';
      const who = row.author ? ` (${row.author})` : '';
      lines.push(`## ${idx + 1}. [${secTitle}](https://xywsxp.github.io/jirl-formal-paper/${slug})${who}`);
      lines.push(`> ${(row.anchor?.quote || '').replace(/\n/g, '\n> ')}`);
      lines.push('');
      lines.push(row.reason || '');
      if (row.issueUrl) lines.push(`- GitHub Issue: ${row.issueUrl}`);
      lines.push('');
    });
    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      message(`Copied ${visible.length} annotation(s) as Markdown to clipboard!`);
    } catch {
      exportLocal();
    }
  }

  function exportLocal(raw=false) {
    const {visible}=model();const rows=visible.length?visible:loadLocal();
    const text=raw?[...rawCopies].map(([key,value])=>key+'\n'+value).join('\n\n'):rows.map(row=>JSON.stringify(row)).join('\n')+'\n';
    if(raw?!rawCopies.size:!rows.length){message('No annotations to export.');return;}
    const url=URL.createObjectURL(new Blob([text],{type:raw?'text/plain':'application/jsonl'}));const a=el('a');a.href=url;a.download=`jirl-annotations-${new Date().toISOString().slice(0,10)}.${raw?'txt':'jsonl'}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Exported annotations file.');
  }
  function capture() {
    if(document.activeElement?.matches('input,textarea,select'))return null;
    const selection=getSelection();if(!selection||selection.isCollapsed||!selection.rangeCount)return null;
    const range=selection.getRangeAt(0),element=(n)=>n instanceof Element?n:n.parentElement;
    const start=element(range.startContainer),end=element(range.endContainer);
    if(start?.closest(excluded)||end?.closest(excluded))return null;
    const a=start?.closest('.annotation-section[data-review-id]'),b=end?.closest('.annotation-section[data-review-id]');
    if(a!==b&&(a||b))return 'boundary';if(!a||!b)return null;
    const body=bodyOf(a);if(!body.contains(range.startContainer)||!body.contains(range.endContainer))return 'boundary';
    const quote=clean(range);if(!quote.trim()||quote.length>2000)return null;
    const before=document.createRange();before.selectNodeContents(body);before.setEnd(range.startContainer,range.startOffset);
    const after=document.createRange();after.selectNodeContents(body);after.setStart(range.endContainer,range.endOffset);
    const preceding=clean(before),anchor={quote,prefix:preceding.slice(-64),suffix:clean(after).slice(0,64)};
    return{...identity(a),box:a,anchor,range:range.cloneRange(),signature:JSON.stringify([a.dataset.file,a.dataset.reviewId,anchor,preceding.length])};
  }
  function placePill() {
    if(panel.dataset.open==='true')return;
    const next=capture();
    if(next==='boundary'){surface(pill,false,'pill');const sig='boundary:'+getSelection()?.toString();if(lastSignature!==sig){lastSignature=sig;message('Please select text within a single section to annotate.');}return;}
    if(!next){surface(pill,false,'pill');lastSignature='';return;}
    if(next.signature===suppressed)return;
    suppressed='';lastSignature=next.signature;pending=next;pill.hidden=false;
    const v=visualViewport,left=v?.offsetLeft||0,top=v?.offsetTop||0,width=v?.width||innerWidth,height=v?.height||innerHeight;
    const rect=[...next.range.getClientRects()].at(-1)||next.range.getBoundingClientRect(),w=pill.offsetWidth,h=pill.offsetHeight;
    pill.style.left=Math.max(left+8,Math.min(rect.right-w,left+width-w-8))+'px';
    pill.style.top=Math.max(top+8,Math.min(rect.top-h-8>=top+8?rect.top-h-8:rect.bottom+8,top+height-h-8))+'px';
    if(pill.dataset.open!=='true')surface(pill,true,'pill');
  }
  let selTimer;const schedule=()=>{clearTimeout(selTimer);selTimer=setTimeout(placePill,30);};
  const dismissPill=()=>{const cur=capture();if(cur&&cur!=='boundary')suppressed=cur.signature;surface(pill,false,'pill');};
  pill.addEventListener('pointerdown',e=>e.preventDefault());
  pill.addEventListener('click',()=>{if(pending){preview.textContent=pending.anchor.quote;showPanel('compose',pending.box,pill,pending.range.getBoundingClientRect());}});
  document.addEventListener('selectionchange',schedule);document.addEventListener('pointerup',schedule);document.addEventListener('keyup',schedule);
  document.addEventListener('pointerdown',e=>{const t=e.target;if(panel.contains(t)||pill.contains(t)||(t instanceof Element&&t.closest('.anno-marker,.jirl-anno-open-btn')))return;if(panel.dataset.open==='true')closePanel();dismissPill();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(panel.dataset.open==='true')closePanel();dismissPill();}});
  addEventListener('scroll',dismissPill,{passive:true});addEventListener('resize',()=>{dismissPill();placePanel();});
  visualViewport?.addEventListener('resize',()=>{dismissPill();placePanel();});visualViewport?.addEventListener('scroll',()=>{dismissPill();placePanel();});
  addEventListener('online',()=>void sync());addEventListener('focus',()=>void sync());
  addEventListener('storage',e=>{if(e.key?.startsWith('shift-review-inbox:'))render();});
  setInterval(()=>{if(!document.hidden&&(panel.dataset.open==='true'||markers.size||historyMarker))void sync();},60000);
  reduced.addEventListener('change',()=>{if(reduced.matches)for(const[node,st]of surfaces){st.token++;st.animation?.cancel();st.animation=undefined;node.hidden=!st.open;node.style.removeProperty('visibility');node.style.removeProperty('will-change');}});
  addEventListener('beforeprint',()=>{dismissPill();if(panel.dataset.open==='true')closePanel();});
  render();void sync();
}

function u(){let e=matchMedia(`(prefers-reduced-motion: reduce)`),t=new Map,n,r=new WeakSet,i=e=>JSON.stringify([...e.children].map(e=>{let t=e.getBoundingClientRect();return[t.width,t.height]})),a=e=>{e.style.removeProperty(`height`),e.style.removeProperty(`overflow`),e.style.removeProperty(`will-change`)},o=(e,t)=>{t.token++,t.animation?.cancel(),t.animation=void 0,e.open=t.desired,a(e),e.dispatchEvent(new CustomEvent(`book:disclosure-settled`,{bubbles:!0}))},s=(t,n)=>{let r=t.getBoundingClientRect().height;t.style.height=r+`px`,n.animation?.cancel();let a=++n.token;t.style.height=`auto`,t.open=!1;let s=t.getBoundingClientRect().height;t.open=!0;let c=t.getBoundingClientRect().height;if(n.content=i(t),e.matches||matchMedia(`print`).matches){o(t,n);return}t.style.height=r+`px`,t.style.overflow=`clip`,t.style.willChange=`height`;let l=t.animate([{height:r+`px`},{height:(n.desired?c:s)+`px`}],{duration:260,easing:`cubic-bezier(.32,.72,0,1)`,fill:`forwards`});n.animation=l,l.finished.then(()=>{a===n.token&&o(t,n)}).catch(()=>{})},c=e=>{if(t.has(e)||(t.set(e,{desired:e.open,token:0}),e.dataset.bookDisclosure=`true`),n)for(let t of e.children)t.tagName!==`SUMMARY`&&!r.has(t)&&(n.observe(t),r.add(t));return t.get(e)};for(let e of document.querySelectorAll(`.sl-markdown-content details`))c(e);document.addEventListener(`click`,t=>{let n=t.target.closest(`summary`)?.parentElement;if(!(n instanceof HTMLDetailsElement)||!n.closest(`.sl-markdown-content`)||t.defaultPrevented)return;t.preventDefault();let r=c(n);r.desired=!r.desired,e.matches?o(n,r):s(n,r)});let l=!1,u=()=>{l||(l=!0,requestAnimationFrame(()=>{l=!1;for(let[e,n]of t)n.animation&&n.content!==i(e)&&![...t].some(([t,n])=>t!==e&&e.contains(t)&&n.animation)&&s(e,n)}))};n=new ResizeObserver(u);for(let e of t.keys())c(e);let d=document.querySelector(`.sl-markdown-content`);d&&new MutationObserver(e=>{if(e.some(e=>(e.target instanceof Element?e.target:e.target.parentElement)?.closest(`details`)||[...e.addedNodes].some(e=>e instanceof Element&&(e.matches(`details`)||e.querySelector(`details`))))){for(let e of d.querySelectorAll(`details`))c(e);u()}}).observe(d,{childList:!0,subtree:!0,characterData:!0}),document.addEventListener(`book:disclosure-settled`,u),document.addEventListener(`toggle`,e=>{let t=e.target;if(t instanceof HTMLDetailsElement&&t.closest(`.sl-markdown-content`)){let e=c(t);e.animation||(e.desired=t.open)}},!0),document.addEventListener(`book:reveal-details`,e=>{let t=e.target;if(t instanceof HTMLDetailsElement){let e=c(t);e.desired=!0,e.animation?s(t,e):t.open=!0}}),addEventListener(`resize`,u);let f=()=>{for(let[e,n]of t)n.animation&&o(e,n)};e.addEventListener(`change`,()=>{e.matches&&f()}),addEventListener(`beforeprint`,f)}function d(){let e=!1,t=!1,n=null,r=``,i=document.documentElement,a=(e,t=!1)=>{t?i.dataset.marginNotes=`off`:delete i.dataset.marginNotes,e.style.removeProperty(`--note-tail`);for(let t of e.querySelectorAll(`.margin-note`))t.style.removeProperty(`--note-top`);r=``},o=new ResizeObserver(()=>u()),s=new WeakSet,c=new MutationObserver(()=>u()),l=()=>{e=!1;let l=document.querySelector(`.sl-markdown-content`);if(!l)return;let u=[...l.querySelectorAll(`.margin-note`)];n!==l&&(o.disconnect(),c.disconnect(),o.observe(l),c.observe(l,{childList:!0,subtree:!0,characterData:!0}),n=l);for(let e of u)s.has(e)||(o.observe(e),s.add(e));let d=l.getBoundingClientRect().width,f=parseFloat(getComputedStyle(i).fontSize),p=i.dataset.marginNotes===`ready`;if(t||d<(p?60:64)*f)a(l,!0);else if(!u.length)a(l,!1);else try{p||(i.dataset.marginNotes=`measuring`);let e=l.getBoundingClientRect(),t=[...l.querySelectorAll(`.stmt-body > :not(.margin-note):not(.anno-ui)`)],n=u.map(n=>{let r=n.closest(`.annotation-section`),i=[...r.querySelectorAll(`p,ul,ol,li,figure,blockquote,pre,details,.learning-block`)].filter(e=>!e.contains(n)&&!e.closest(`.margin-note,.anno-ui`)&&!e.matches(`.learning-block-title`)&&!!(e.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_FOLLOWING)),a=t.find(e=>!!(n.compareDocumentPosition(e)&Node.DOCUMENT_POSITION_FOLLOWING)),o=i.at(-1)||a||r;return{note:n,top:Math.max(0,o.getBoundingClientRect().top-e.top),height:n.getBoundingClientRect().height}}).sort((e,t)=>e.top-t.top),a=-16;for(let e of n)e.top=Math.max(e.top,a+16),a=e.top+e.height;let o=Math.max(0,...[...l.children].filter(e=>!e.matches(`.margin-note,.anno-ui`)).map(t=>t.getBoundingClientRect().bottom-e.top)),s=Math.max(0,a+16-o),c=JSON.stringify([d,n.map(e=>[e.top,e.height]),s]);if(!n.every(e=>Number.isFinite(e.top)&&e.height>0))throw Error(`Invalid note geometry`);if(r!==c||!p){for(let e of n)e.note.style.setProperty(`--note-top`,e.top+`px`);l.style.setProperty(`--note-tail`,s+`px`),i.dataset.marginNotes=`ready`,r=c}}catch{a(l,!0)}},u=()=>{e||(e=!0,requestAnimationFrame(l))};addEventListener(`resize`,u),document.addEventListener(`transitionend`,u),document.addEventListener(`book:disclosure-settled`,u),document.addEventListener(`toggle`,u,!0),document.addEventListener(`astro:page-load`,u),document.fonts.ready.then(u),document.fonts.addEventListener(`loadingdone`,u),addEventListener(`beforeprint`,()=>{t=!0,l()}),addEventListener(`afterprint`,()=>{t=!1,u()}),matchMedia(`print`).addEventListener(`change`,e=>{t=e.matches,u()}),u()}function f(){let e=[...document.querySelectorAll(`.exercise-card`)];if(!e.length)return;let t=document.querySelector(`[data-exercise-summary]`),n=document.querySelector(`[data-exercise-reset-all]`),r=e=>e.normalize(`NFKC`).toLowerCase().replace(/\s+/g,``),i=e=>{let t=e.querySelector(`.exercise-rubric`),n=e.querySelector(`.exercise-feedback`);if(!t||!n||t.hidden)return;let r=[...t.querySelectorAll(`input[type="checkbox"][data-rubric-point]`)],i=r.filter(e=>e.checked).length,a=r.length;i===a&&a>0?(n.dataset.state=`pass`,n.textContent=`Score: All matched (${i} / ${a} key points)`):i>0?(n.dataset.state=`partial`,n.textContent=`Score: Partial match (${i} / ${a} key points)`):(n.dataset.state=`empty`,n.textContent=`Check matched rubric points (0 / ${a})`)},a=()=>{if(!t)return;let n=0,r=0,i=0;for(let t of e){let e=t.querySelector(`.exercise-rubric`),a=[...t.querySelectorAll(`input[type="checkbox"][data-rubric-point]`)];i+=a.length,r+=a.filter(e=>e.checked).length,e&&!e.hidden&&n++}t.innerHTML=`Checked: <strong>${n} / ${e.length}</strong> · Key points: <strong>${r} / ${i}</strong>`};for(let t of e){let e=t.querySelector(`[data-exercise-check]`),n=t.querySelector(`[data-exercise-reset]`),o=t.querySelector(`.exercise-work`),s=t.querySelector(`.exercise-rubric`),c=t.querySelector(`details.exercise-solution`),l=t.querySelector(`.exercise-feedback`),u=[...t.querySelectorAll(`input[type="checkbox"][data-rubric-point]`)];for(let e of u)e.addEventListener(`change`,()=>{i(t),a()});e?.addEventListener(`click`,()=>{if(!s)return;let e=s.hidden;if(s.hidden=!1,e&&o&&o.value.trim().length>0){let e=r(o.value);for(let t of u){let n=(t.dataset.keywords||``).split(`|`).map(r).filter(e=>e.length>=2);n.length>0&&n.some(t=>e.includes(t))&&(t.checked=!0)}}c&&!c.open&&(c.open=!0),i(t),a()}),n?.addEventListener(`click`,()=>{o&&(o.value=``);for(let e of u)e.checked=!1;s&&(s.hidden=!0),c&&(c.open=!1),l&&(l.textContent=``,delete l.dataset.state),a()})}n?.addEventListener(`click`,()=>{for(let t of e)t.querySelector(`[data-exercise-reset]`)?.click();a()}),a()}l(),u(),d(),f();