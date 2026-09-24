(()=>{
  const DONE_KEY='bp-today-blocks-v23';
  const pad=n=>String(n).padStart(2,'0');
  const dateOnly=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const today=()=>dateOnly(new Date());
  const mondayIndex=()=>{const d=new Date().getDay();return d===0?6:d-1};
  const minsText=n=>{n=Math.max(0,Math.round(Number(n)||0));if(!n)return'0h';const h=Math.floor(n/60),m=n%60;return ((h?h+'h':'')+(m?' '+m+'m':'')).trim()};
  const setText=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
  const doneState=()=>store.get(DONE_KEY,{})||{};
  const saveDone=x=>store.set(DONE_KEY,x);

  function weekKey(){
    const d=new Date();d.setHours(12,0,0,0);const day=d.getDay();d.setDate(d.getDate()+(day===0?-6:1-day));return dateOnly(d);
  }
  function currentPlan(){
    const plans=store.get('bp-week-plans-v17',{})||{};return plans[weekKey()]||null;
  }
  function todayPulse(){
    return (dailyPulses||[]).find(x=>x.date===today())||null;
  }
  function recentEvidence(){
    const cutoff=Date.now()-6*86400000;
    return (checkins||[]).filter(x=>{const t=new Date(x.date).getTime();return Number.isFinite(t)&&t>=cutoff});
  }
  function weekCapacity(){
    const p=currentPlan();if(!p)return null;
    const used=(p.blocks||[]).reduce((a,b)=>a+(Number(b.duration)||0),0);
    const total=Math.max(1,Number(p.capacity)||18)*60;
    return {plan:p,used,total,pct:Math.round(used/total*100),open:Math.max(0,total-used)};
  }
  function inferredKind(x){
    const raw=((x.kind||'')+' '+(x.category||'')+' '+(x.title||'')).toLowerCase();
    if(/recover|rest|sleep|walk|shutdown|reflection|review/.test(raw))return'recover';
    if(/health|body|gym|run|strength|mobility|training|workout/.test(raw))return'body';
    if(/experiment|lab|metric|check-in|checkin|observe/.test(raw))return'lab';
    if(/life|family|friend|home|personal|admin|errand|relationship/.test(raw))return'life';
    return'focus';
  }
  function composerMetaFor(event){
    if(!event?.weekComposerId)return null;
    const p=currentPlan();return p?.blocks?.find(b=>b.id===event.weekComposerId)||null;
  }
  function todayBlocks(){
    const date=today(),di=mondayIndex();
    const recurring=(schedules||[]).filter(x=>Array.isArray(x.days)&&x.days.includes(di)).map(x=>({
      id:'schedule:'+x.id,title:x.title,time:x.time||'09:00',duration:Number(x.duration)||60,
      category:x.category||'Recurring',kind:inferredKind(x),source:'recurring'
    }));
    const oneOff=(customEvents||[]).filter(x=>x.date===date).map((x,i)=>{
      const meta=composerMetaFor(x);
      return {
        id:'event:'+(x.weekComposerId||x.id||x.time+'|'+x.title+'|'+i),
        title:x.title,time:x.time||'09:00',duration:Number(x.duration||meta?.duration)||60,
        category:x.category||meta?.kind||'Calendar',kind:inferredKind({...x,kind:x.kind||meta?.kind}),
        source:x.weekComposerId?'weekly plan':'calendar'
      };
    });
    const seen=new Set();
    return [...recurring,...oneOff].sort((a,b)=>String(a.time).localeCompare(String(b.time))).filter(x=>{
      const key=x.time+'|'+x.title.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;
    });
  }
  function readiness(){
    const pulse=todayPulse(),cap=weekCapacity();
    if(!pulse)return {state:'steady',label:'Steady',meta:'log a pulse only if it would change the plan'};
    const low=Math.min(Number(pulse.focus)||3,Number(pulse.energy)||3);
    if(low<=2||cap?.pct>=100)return {state:'guarded',label:'Guarded',meta:cap?.pct>=100?'week capacity is already fully claimed':'protect capacity before adding pressure'};
    if(Number(pulse.focus)>=4&&Number(pulse.energy)>=4&&(cap?.pct||0)<82)return {state:'open',label:'Open',meta:'attention and energy both look available'};
    return {state:'steady',label:'Steady',meta:'enough signal to work the plan without forcing it'};
  }
  function renderBrief(){
    const pulse=todayPulse(),cap=weekCapacity(),ev=recentEvidence(),r=readiness();
    const pill=document.getElementById('dayReadiness');if(pill)pill.dataset.state=r.state;
    setText('dayReadinessState',r.label);setText('dayReadinessLabel',r.meta);
    if(profile?.focus)setText('primaryOutcome',profile.focus);
    let hero=profile?.note||'Protect one meaningful change, then leave enough space to notice what happened.';
    if(r.state==='guarded')hero='Capacity is the constraint today. Keep the primary outcome, reduce the version you require of yourself, and resist filling open edges.';
    else if(cap?.pct>=82)hero='The week is already carrying a lot. Advance the chosen outcome without converting every remaining opening into another commitment.';
    else if(pulse&&Number(pulse.focus)>=4)hero='Attention looks available. Use the clean window on the outcome that would make the rest of the day feel simpler.';
    setText('heroCopy',hero);

    setText('todaySignalFocus',pulse?(pulse.focus+' / 5'):'—');
    setText('todaySignalFocusMeta',pulse?(Number(pulse.focus)>=4?'available for demanding work':Number(pulse.focus)<=2?'keep the finish line small':'usable, not unlimited'):'log a pulse when useful');
    setText('todaySignalEnergy',pulse?(pulse.energy+' / 5'):'—');
    setText('todaySignalEnergyMeta',pulse?(Number(pulse.energy)>=4?'capacity looks available':Number(pulse.energy)<=2?'protect recovery and transitions':'steady enough to observe'):'no assumption yet');
    setText('todaySignalSpace',cap?minsText(cap.open):'—');
    setText('todaySignalSpaceMeta',cap?(cap.pct+'% of intentional capacity allocated'):'compose the week to see capacity');
    setText('todaySignalEvidence',ev.length+' '+(ev.length===1?'log':'logs'));
    setText('todaySignalEvidenceMeta',ev.length?'experiment evidence · rolling seven days':'nothing to interpret yet');

    const active=(experiments||[]).filter(x=>x.status!=='archived'&&x.status!=='stopped')[0];
    if(r.state==='guarded'){
      setText('todayProtectTitle','Protect capacity before intensity');
      setText('todayProtectCopy','Use the smallest version of the important block that still creates real movement.');
    }else{
      setText('todayProtectTitle','Protect the cleanest window');
      setText('todayProtectCopy','Keep one demanding block insulated from incoming signals and unnecessary switching.');
    }
    setText('todayAdvanceTitle',profile?.focus||'One visible piece of movement');
    setText('todayAdvanceCopy','Aim for a before-and-after you can recognize, not a day that merely felt busy.');
    setText('todayObserveTitle',active?('Observe '+active.title):'Capture one useful fact');
    setText('todayObserveCopy',active?'Record what happened before deciding whether the experiment deserves another cycle.':'End with evidence about attention, energy, or friction that could change a future decision.');
  }
  function renderTimeline(){
    const root=document.getElementById('todayTimeline');if(!root)return;
    const blocks=todayBlocks(),done=doneState(),date=today(),total=blocks.reduce((a,b)=>a+b.duration,0);
    setText('todayTimelineMeta',blocks.length?(blocks.length+' '+(blocks.length===1?'block':'blocks')+' · '+minsText(total)+' protected'):'nothing protected yet');
    if(!blocks.length){
      root.innerHTML='<div class="timeline-empty"><div><strong>No calendar blocks are claiming today.</strong><small>Open space can be intentional. If something truly deserves protection, compose the week or place it on Calendar.</small></div><div class="timeline-empty-actions"><button class="soft-btn" data-page-jump="week">Compose week</button><button class="soft-btn" data-page-jump="calendar">Open calendar</button></div></div>';
      renderOrbit(blocks);return;
    }
    root.innerHTML=blocks.map(b=>{
      const key=date+':'+b.id,isDone=!!done[key],kind=b.kind||'focus';
      return '<div class="time-row"><div class="time">'+escapeHTML(b.time)+'</div><div class="event '+kind+' '+(kind==='body'?'health ':'')+(isDone?'is-done':'')+'"><div class="event-main"><strong>'+escapeHTML(b.title)+'</strong><small>'+minsText(b.duration)+' · '+escapeHTML(b.category||kind)+'<span class="today-real-note">'+escapeHTML(b.source)+'</span></small></div><div class="event-status"><span>'+(isDone?'done':kind)+'</span><input aria-label="Complete '+escapeHTML(b.title)+'" class="event-check" data-today-block="'+escapeHTML(b.id)+'" type="checkbox" '+(isDone?'checked':'')+'/></div></div></div>';
    }).join('');
    renderOrbit(blocks);
  }
  function renderOrbit(blocks=todayBlocks()){
    const by={focus:0,body:0,lab:0,recover:0,life:0};
    blocks.forEach(b=>by[b.kind]=(by[b.kind]||0)+Number(b.duration||0));
    const protectedM=Object.values(by).reduce((a,b)=>a+b,0);
    const parse=t=>{const p=String(t||'').split(':').map(Number),h=p[0],m=p[1];return (Number.isFinite(h)?h:0)*60+(Number.isFinite(m)?m:0)};
    const windowM=Math.max(60,parse(profile?.dayEnd||'18:00')-parse(profile?.dayStart||'08:00'));
    const open=Math.max(0,windowM-protectedM);
    setText('orbitProtected',minsText(protectedM));setText('orbitFocus',minsText(by.focus));setText('orbitBody',minsText(by.body));setText('orbitLab',minsText(by.lab));setText('orbitOpen',minsText(open));
    setText('orbitLabel',protectedM?(blocks.length+' real blocks · '+minsText(open)+' open'):'open · unclaimed');
    const ring=document.getElementById('orbitClock');if(ring){
      const total=Math.max(windowM,protectedM,1),f=by.focus/total*100,b=by.body/total*100,l=by.lab/total*100,r=(by.recover+by.life)/total*100;
      const p1=f,p2=p1+b,p3=p2+l,p4=Math.min(100,p3+r);
      ring.style.background='conic-gradient(var(--field) 0 '+p1+'%,var(--amber) '+p1+'% '+p2+'%,var(--mint) '+p2+'% '+p3+'%,var(--iris) '+p3+'% '+p4+'%,transparent '+p4+'% 100%)';
    }
  }
  function renderAdaptiveToday(){renderBrief();renderTimeline()}
  document.getElementById('todayTimeline')?.addEventListener('change',e=>{
    const input=e.target.closest('[data-today-block]');if(!input)return;
    const state=doneState(),key=today()+':'+input.dataset.todayBlock;state[key]=input.checked;saveDone(state);renderTimeline();
  });
  document.addEventListener('blueprint:week-updated',renderAdaptiveToday);
  document.addEventListener('click',e=>{if(e.target.closest('[data-mode-choice]'))setTimeout(renderBrief,0)});

  function wrap(name){
    try{
      const original=eval(name);if(typeof original!=='function')return;
      const wrapped=function(...args){const out=original.apply(this,args);renderAdaptiveToday();return out};
      eval(name+'=wrapped');
    }catch(_){}
  }
  ['renderPulse','renderRoutines','renderCheckins','renderCalendar','renderSchedules','renderWorkspace'].forEach(wrap);
  window.renderAdaptiveToday=renderAdaptiveToday;
  renderAdaptiveToday();
})();