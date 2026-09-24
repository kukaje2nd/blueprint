(()=>{
  const pad=n=>String(n).padStart(2,'0');
  const dateOnly=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const minsText=n=>{n=Math.max(0,Math.round(Number(n)||0));if(!n)return'0h';const h=Math.floor(n/60),m=n%60;return ((h?h+'h':'')+(m?' '+m+'m':'')).trim()};
  const setText=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};

  function monday(){
    const d=new Date();d.setHours(12,0,0,0);const day=d.getDay();d.setDate(d.getDate()+(day===0?-6:1-day));return d;
  }
  function weekKey(){return dateOnly(monday())}
  function weekDates(){
    const m=monday();return Array.from({length:7},(_,i)=>{const d=new Date(m);d.setDate(m.getDate()+i);return d});
  }
  function currentWeek(){
    if(window.BlueprintWeek?.getCurrent)return window.BlueprintWeek.getCurrent();
    const key=weekKey(),plans=store.get('bp-week-plans-v17',{})||{};
    const plan=plans[key]||{capacity:18,promise:'',boundary:'',blocks:[],committedAt:null};
    const minutes=(plan.blocks||[]).reduce((a,b)=>a+(Number(b.duration)||0),0);
    return {key,plan,minutes,capacityMinutes:(Number(plan.capacity)||18)*60};
  }
  function linkedRhythm(goal){
    const links=goalJourneys?.[goal.id]?.links?.schedules||[];
    return links.some(id=>(schedules||[]).some(s=>String(s.id)===String(id)));
  }
  function goalWeekState(goal,plan){
    if((plan.blocks||[]).some(b=>b.sourceType==='goal'&&String(b.sourceId)===String(goal.id)))return'week';
    if(linkedRhythm(goal))return'rhythm';
    return'unplaced';
  }
  function weekEvents(){
    const dates=weekDates(),start=dateOnly(dates[0]),end=dateOnly(dates[6]),key=weekKey();
    const oneOff=(customEvents||[]).filter(x=>x.date>=start&&x.date<=end).map((x,i)=>({
      id:'event:'+(x.id||x.weekComposerId||i),date:x.date,time:x.time||'09:00',title:x.title,
      kind:x.weekComposerKey===key?'week':'calendar',duration:Number(x.duration)||60
    }));
    const recurring=[];
    (schedules||[]).forEach(s=>{
      (s.days||[]).forEach(di=>{
        const d=dates[Number(di)];if(!d)return;
        recurring.push({id:'schedule:'+s.id+':'+di,date:dateOnly(d),time:s.time||'09:00',title:s.title,kind:'rhythm',duration:Number(s.duration)||60});
      });
    });
    const seen=new Set();
    return [...oneOff,...recurring].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).filter(x=>{
      const k=x.date+'|'+x.time+'|'+String(x.title).toLowerCase();if(seen.has(k))return false;seen.add(k);return true;
    });
  }
  function renderDirection(plan){
    const root=document.getElementById('planDirectionList');if(!root)return;
    const items=(goals||[]).slice(0,4);
    if(!items.length){
      root.innerHTML='<div class="plan-flow-empty"><strong>No direction yet.</strong><span>Create one goal worth learning from before adding more structure.</span></div>';
      setText('planDirectionSummary','Choose one direction worth protecting.');
      setText('planDirectionCopy','Blueprint can hold targets, character practices, systems, or broader directions without forcing them into one progress model.');
      return;
    }
    const represented=items.filter(g=>goalWeekState(g,plan)!=='unplaced').length;
    setText('planDirectionSummary',represented?represented+' of '+items.length+' visible goals touch this week.':'Your goals exist; none are asking for time this week yet.');
    setText('planDirectionCopy','A goal can be represented by a protected weekly block or by a recurring rhythm already linked to its journey.');
    root.innerHTML=items.map(g=>{
      const state=goalWeekState(g,plan);
      const label=state==='week'?'protected this week':state==='rhythm'?'supported by rhythm':'not placed';
      const action=state==='unplaced'?'<button data-plan-add-goal="'+escapeHTML(g.id)+'">Protect this week</button>':'<button disabled>'+label+'</button>';
      return '<div class="plan-goal-row '+state+'"><div><span>'+escapeHTML((g.kind||'goal')+' · '+(g.domain||'Personal'))+'</span><strong>'+escapeHTML(g.title)+'</strong></div><div><em>'+label+'</em>'+action+'</div></div>';
    }).join('');
  }
  function renderCapacity(snapshot){
    const p=snapshot.plan,used=snapshot.minutes,total=snapshot.capacityMinutes,pct=total?Math.round(used/total*100):0,open=Math.max(0,total-used);
    const hasShape=!!((p.blocks||[]).length||p.promise||p.boundary);
    setText('planWeekHours',minsText(used));
    setText('planWeekMeta',hasShape?(pct+'% of '+minsText(total)+' capacity · '+minsText(open)+' open'):'week not composed yet');
    setText('planBlockCount',(p.blocks||[]).length);
    setText('planBlockMeta',p.committedAt?'committed to Calendar':hasShape?'draft · not on Calendar':'no protected blocks');
    setText('planWeekSummary',p.promise||((p.blocks||[]).length?((p.blocks||[]).length+' protected blocks are shaping the week.'):'Shape a week before filling it.'));
    setText('planWeekCopy',p.committedAt?'This composition has crossed into Calendar. Edit the draft deliberately before replacing the committed version.':hasShape?'This is still a draft. Capacity remains editable until you explicitly commit it to Calendar.':'Choose a weekly promise and a few protected blocks before reactive work decides the shape for you.');
    const bar=document.getElementById('planCapacityBar');if(bar)bar.style.width=Math.min(100,pct)+'%';
    setText('planCapacityMeta',minsText(used)+' of '+minsText(total)+' · '+minsText(open)+' intentionally open');
    const boundary=document.getElementById('planBoundary');if(boundary)boundary.textContent=p.boundary?('Not this week · '+p.boundary):'No explicit “not this week” boundary yet.';
    return {pct,open,hasShape};
  }
  function renderCalendarStage(snapshot){
    const root=document.getElementById('planNextBlocks');if(!root)return {events:[],staleCalendar:false};
    const events=weekEvents(),today=dateOnly(new Date()),upcoming=events.filter(x=>x.date>=today).slice(0,4);
    const composerOnCalendar=(customEvents||[]).filter(x=>x.weekComposerKey===snapshot.key);
    const staleCalendar=!snapshot.plan.committedAt&&composerOnCalendar.length>0;
    if(staleCalendar){
      setText('planCalendarSummary','Calendar still holds the last committed shape.');
      setText('planCalendarCopy','The Weekly Composer draft has changed since that commit. Nothing will overwrite Calendar until you commit again.');
    }else if(snapshot.plan.committedAt){
      setText('planCalendarSummary','The current week is protected in time.');
      setText('planCalendarCopy','Committed weekly blocks and recurring rhythms are visible together here. Open space remains part of the architecture.');
    }else if(events.length){
      setText('planCalendarSummary','Some time is protected, but the week draft is still separate.');
      setText('planCalendarCopy','Calendar already contains one-off blocks or recurring rhythms. Weekly Composer remains provisional until you commit it.');
    }else{
      setText('planCalendarSummary','Make the plan concrete only when it earns time.');
      setText('planCalendarCopy','Nothing is protected on this week’s Calendar yet. That can be intentional; a draft does not need to become a commitment.');
    }
    if(!upcoming.length){
      root.innerHTML='<div class="plan-flow-empty compact"><strong>No upcoming protected blocks.</strong><span>Open time is not automatically a problem to solve.</span></div>';
    }else{
      root.innerHTML=upcoming.map(x=>{
        const d=new Date(x.date+'T12:00:00');
        const label=d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
        return '<div class="plan-next-row"><time>'+escapeHTML(label+' · '+x.time)+'</time><strong>'+escapeHTML(x.title)+'</strong><span>'+escapeHTML(x.kind)+'</span></div>';
      }).join('');
    }
    return {events,staleCalendar};
  }
  function renderLens(snapshot,capacity,calendar){
    const states=(goals||[]).map(g=>goalWeekState(g,snapshot.plan));
    const represented=states.filter(x=>x!=='unplaced').length,unplaced=states.filter(x=>x==='unplaced').length;
    let title='Nothing needs interpretation yet.',copy='Create a goal or compose the week and Blueprint will show where direction and time are connected—or deliberately not connected.';
    if(capacity.pct>100){
      title='The draft claims more than the capacity you chose.';
      copy='That is a planning constraint, not a performance judgment. Shorten, defer, or remove a claim before treating the week as concrete.';
    }else if(calendar.staleCalendar){
      title='The draft and Calendar are temporarily different.';
      copy='You changed the week after its last commit. The older calendar shape is being preserved until you explicitly replace it.';
    }else if((goals||[]).length&&unplaced){
      title=unplaced+' active '+(unplaced===1?'goal is':'goals are')+' not asking for time this week.';
      copy='That can be deliberate. A goal does not need a calendar block every week; Blueprint is simply keeping the gap visible so it remains a choice.';
    }else if((goals||[]).length&&represented===(goals||[]).length&&snapshot.plan.committedAt){
      title='Direction and time are connected this week.';
      copy='Each active goal is represented by protected time or a linked rhythm, and the current composition has been committed to Calendar.';
    }else if((goals||[]).length&&!capacity.hasShape){
      title='Direction exists, but this week has no explicit shape.';
      copy='Use Weekly Composer only if deciding capacity in advance would reduce reactive scheduling. Otherwise, leave the week light.';
    }else if(capacity.hasShape&&!snapshot.plan.committedAt){
      title='The week has a shape, but it is still provisional.';
      copy='Keep editing until the draft feels worthy of real calendar space. Drafting is thinking; committing is a separate decision.';
    }
    setText('planAlignmentTitle',title);setText('planAlignmentCopy',copy);
    setText('planGoalMeta',(goals||[]).length?(represented+' represented this week'):'create a direction when useful');
    const flow=document.getElementById('planFlowState');
    if(flow)flow.textContent=snapshot.plan.committedAt?'week committed':capacity.hasShape?'week in draft':(goals||[]).length?'direction exists · week open':'start with direction';
  }
  function renderHero(snapshot,capacity){
    const action=document.getElementById('planPrimaryAction');
    if(!(goals||[]).length){
      setText('planHeroTitle','Choose a direction before building the week.');
      setText('planHeroCopy','Planning becomes useful when it protects something real. Start with one target, character practice, system, or direction—then decide whether it deserves time.');
      if(action)action.textContent='Create a goal';
      if(action){action.removeAttribute('data-page-jump');action.setAttribute('data-capture-type','Goal');action.setAttribute('data-open-capture','');}
      return;
    }
    if(snapshot.plan.committedAt){
      setText('planHeroTitle','Your plan is concrete. Keep enough room for reality.');
      setText('planHeroCopy','The current week has crossed into Calendar. Use Plan to see whether direction, capacity, and protected time still tell the same story.');
      if(action)action.textContent='Review committed week';
    }else if(capacity.hasShape){
      setText('planHeroTitle','Your week has a shape. Decide whether it deserves the calendar.');
      setText('planHeroCopy','The draft is doing its job: making trade-offs visible before they become appointments. Commit only the version you actually want to live.');
      if(action)action.textContent='Review week draft';
    }else{
      setText('planHeroTitle','Turn direction into a week you can actually live.');
      setText('planHeroCopy','Start with what matters, respect finite capacity, then protect only the commitments that deserve real time.');
      if(action)action.textContent='Compose this week';
    }
    if(action){action.removeAttribute('data-capture-type');action.removeAttribute('data-open-capture');action.setAttribute('data-page-jump','week');}
  }
  function renderPlan(){
    if(!document.getElementById('page-plan'))return;
    const snapshot=currentWeek();
    const capacity=renderCapacity(snapshot);
    renderDirection(snapshot.plan);
    const calendar=renderCalendarStage(snapshot);
    renderLens(snapshot,capacity,calendar);
    renderHero(snapshot,capacity);
    setText('planGoalCount',(goals||[]).length);
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-plan-add-goal]');if(!btn)return;
    const result=window.BlueprintWeek?.addGoal?.(btn.dataset.planAddGoal);
    if(result?.ok){showToast('Goal protected in this week');renderPlan();}
    else if(result?.reason==='exists')showToast('Goal is already represented this week');
    else showToast('Open Weekly Composer to place this goal');
  });
  document.addEventListener('blueprint:week-updated',renderPlan);

  const baseGoals=renderGoals;renderGoals=function(){const out=baseGoals.apply(this,arguments);renderPlan();return out};
  const baseSchedules=renderSchedules;renderSchedules=function(){const out=baseSchedules.apply(this,arguments);renderPlan();return out};
  const baseCalendar=renderCalendar;renderCalendar=function(){const out=baseCalendar.apply(this,arguments);renderPlan();return out};
  const baseHubs=renderV12Hubs;renderV12Hubs=function(){const out=baseHubs.apply(this,arguments);renderPlan();return out};

  window.renderPlan=renderPlan;
  renderPlan();
})();