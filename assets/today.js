(()=>{
  const pad=n=>String(n).padStart(2,'0');
  const dateOnly=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const today=()=>dateOnly(new Date());
  const mondayIndex=()=>{const d=new Date().getDay();return d===0?6:d-1};
  const minsText=n=>{n=Math.max(0,Math.round(Number(n)||0));if(!n)return'0h';const h=Math.floor(n/60),m=n%60;return ((h?h+'h':'')+(m?' '+m+'m':'')).trim()};
  const setText=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
  const titleCase=s=>String(s||'open').replace(/(^|\s)\S/g,c=>c.toUpperCase());

  function weekKey(){
    const d=new Date();d.setHours(12,0,0,0);const day=d.getDay();d.setDate(d.getDate()+(day===0?-6:1-day));return dateOnly(d);
  }
  function currentPlan(){
    const plans=store.get('bp-week-plans-v17',{})||{};return plans[weekKey()]||null;
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
      category:x.category||'Recurring',kind:inferredKind(x),source:'rhythm'
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
  function design(){
    return window.BlueprintDayDesign?.getToday?.()||{intent:'open',success:['','',''],supports:[],boundary:'',minimum:'',choiceRule:'',updatedAt:null};
  }
  function parseTime(t){
    const p=String(t||'').split(':').map(Number),h=p[0],m=p[1];return (Number.isFinite(h)?h:0)*60+(Number.isFinite(m)?m:0);
  }
  function dayWindow(blocks=todayBlocks()){
    const protectedM=blocks.reduce((a,b)=>a+Number(b.duration||0),0);
    const windowM=Math.max(60,parseTime(profile?.dayEnd||'18:00')-parseTime(profile?.dayStart||'08:00'));
    return {protectedM,windowM,open:Math.max(0,windowM-protectedM)};
  }
  function renderBrief(){
    const d=design(),blocks=todayBlocks(),window=dayWindow(blocks),cap=weekCapacity();
    const success=(d.success||[]).filter(Boolean),intent=d.updatedAt?titleCase(d.intent):'Open';
    const pill=document.getElementById('dayReadiness');if(pill)pill.dataset.state=d.intent==='recover'?'guarded':d.updatedAt?'open':'steady';
    setText('dayReadinessState',intent);
    setText('dayReadinessLabel',d.updatedAt?(d.boundary||d.choiceRule||'a shape you can revise'):'design only what would help');

    setText('primaryOutcome',success[0]||profile?.focus||'What would make today successful?');
    let hero='You do not need to optimize the whole day. Define what matters, respect what is fixed, and leave room for reality.';
    if(d.minimum)hero='Today has a fallback. If reality changes, protect the smaller version instead of turning the whole day into a failure.';
    else if(d.boundary)hero='A boundary is part of the plan. Protect it as deliberately as the things you put on the calendar.';
    else if(cap?.pct>=90)hero='The week is carrying a lot. Let today stay smaller than the total ambition of the week.';
    setText('heroCopy',hero);

    setText('todaySignalFocus',success.length+' / 3');
    setText('todaySignalFocusMeta',success.length?success.length+' success '+(success.length===1?'condition':'conditions'):'define only what matters');
    setText('todaySignalEnergy',String(blocks.length));
    setText('todaySignalEnergyMeta',blocks.length?(blocks.length===1?'one fixed anchor':'calendar + rhythm anchors'):'nothing fixed yet');
    setText('todaySignalSpace',minsText(window.open));
    setText('todaySignalSpaceMeta','inside your configured day window');
    setText('todaySignalEvidence',d.minimum?'Defined':'Open');
    setText('todaySignalEvidenceMeta',d.minimum?'smaller version available':'minimum viable day optional');

    setText('todayProtectTitle',d.boundary||((blocks[0]?.title)?'Protect '+blocks[0].title:'Protect what is actually fixed'));
    setText('todayProtectCopy',d.boundary?'The boundary is part of the architecture, not leftover time.':'Calendar anchors are constraints; everything else can remain negotiable.');
    setText('todayAdvanceTitle',success[0]||'Choose one condition for success');
    setText('todayAdvanceCopy',success[0]?'Let this be enough to make the day meaningful without demanding that everything move.':'A successful day can be small. Give it one clear condition before adding more.');
    setText('todayObserveTitle',d.minimum?'Use the fallback if reality changes':'Keep the day revisable');
    setText('todayObserveCopy',d.minimum||d.choiceRule||'Leave enough open space that new information can change the plan without making the day feel broken.');
  }
  function renderTimeline(){
    const root=document.getElementById('todayTimeline');if(!root)return;
    const blocks=todayBlocks(),total=blocks.reduce((a,b)=>a+b.duration,0);
    setText('todayTimelineMeta',blocks.length?(blocks.length+' '+(blocks.length===1?'anchor':'anchors')+' · '+minsText(total)+' protected'):'nothing protected yet');
    if(!blocks.length){
      root.innerHTML='<div class="timeline-empty"><div><strong>No calendar blocks are claiming today.</strong><small>Open space can be intentional. Add something only when it deserves protection.</small></div><div class="timeline-empty-actions"><button class="soft-btn" data-page-jump="week">Shape the week</button><button class="soft-btn" data-page-jump="calendar">Open calendar</button></div></div>';
      renderOrbit(blocks);return;
    }
    root.innerHTML=blocks.map(b=>{
      const kind=b.kind||'focus';
      return '<div class="time-row"><div class="time">'+escapeHTML(b.time)+'</div><div class="event '+kind+' '+(kind==='body'?'health ':'')+'"><div class="event-main"><strong>'+escapeHTML(b.title)+'</strong><small>'+minsText(b.duration)+' · '+escapeHTML(b.category||kind)+'<span class="today-real-note">'+escapeHTML(b.source)+'</span></small></div><div class="event-status"><span>protected</span></div></div></div>';
    }).join('');
    renderOrbit(blocks);
  }
  function renderOrbit(blocks=todayBlocks()){
    const by={focus:0,body:0,lab:0,recover:0,life:0};
    blocks.forEach(b=>by[b.kind]=(by[b.kind]||0)+Number(b.duration||0));
    const {protectedM,windowM,open}=dayWindow(blocks);
    setText('orbitProtected',minsText(protectedM));setText('orbitFocus',minsText(by.focus));setText('orbitBody',minsText(by.body));setText('orbitLab',minsText(by.lab));setText('orbitOpen',minsText(open));
    setText('orbitLabel',protectedM?(blocks.length+' anchors · '+minsText(open)+' open'):'open · unclaimed');
    const ring=document.getElementById('orbitClock');if(ring){
      const total=Math.max(windowM,protectedM,1),f=by.focus/total*100,b=by.body/total*100,l=by.lab/total*100,r=(by.recover+by.life)/total*100;
      const p1=f,p2=p1+b,p3=p2+l,p4=Math.min(100,p3+r);
      ring.style.background='conic-gradient(var(--field) 0 '+p1+'%,var(--amber) '+p1+'% '+p2+'%,var(--mint) '+p2+'% '+p3+'%,var(--iris) '+p3+'% '+p4+'%,transparent '+p4+'% 100%)';
    }
  }
  function renderAdaptiveToday(){renderBrief();renderTimeline();window.BlueprintDayDesign?.render?.()}
  document.addEventListener('blueprint:week-updated',renderAdaptiveToday);
  document.addEventListener('blueprint:day-design-updated',renderAdaptiveToday);

  function wrap(name){
    try{
      const original=eval(name);if(typeof original!=='function')return;
      const wrapped=function(...args){const out=original.apply(this,args);renderAdaptiveToday();return out};
      eval(name+'=wrapped');
    }catch(_){}
  }
  ['renderRoutines','renderCheckins','renderCalendar','renderSchedules','renderWorkspace'].forEach(wrap);
  window.BlueprintToday={blocks:todayBlocks,render:renderAdaptiveToday};
  window.renderAdaptiveToday=renderAdaptiveToday;
  renderAdaptiveToday();
})();