(()=>{
  const KEY='bp-guide-items-v30';
  const KIND_LABEL={direction:'Direction',idea:'Idea',commitment:'Commitment',question:'Question',possibility:'Possibility'};
  const STAGE_LABEL={now:'Now',warm:'Keep warm',later:'Later'};
  let items=store.get(KEY,[])||[];

  const $id=id=>document.getElementById(id);
  const esc=v=>escapeHTML(String(v??''));
  const uid=()=>('guide-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7));
  const setText=(id,value)=>{const el=$id(id);if(el)el.textContent=value};

  function persist(){
    store.set(KEY,items);
    document.dispatchEvent(new CustomEvent('blueprint:guide-updated'));
  }
  function counts(){
    return {
      now:items.filter(x=>x.stage==='now').length,
      warm:items.filter(x=>x.stage==='warm').length,
      later:items.filter(x=>x.stage==='later').length
    };
  }
  function topNow(){return items.find(x=>x.stage==='now')||null}
  function currentWeek(){
    return window.BlueprintWeek?.getCurrent?.()||{plan:{blocks:[],success:[],committedAt:null},minutes:0,capacityMinutes:1080};
  }
  function rhythms(){return window.BlueprintRhythms?.get?.()||store.get('bp-rhythms-v28',[])||[]}
  function calendarAnchors(){
    const today=new Date(),day=today.getDay(),m=new Date(today);m.setHours(12,0,0,0);m.setDate(m.getDate()+(day===0?-6:1-day));
    const pad=n=>String(n).padStart(2,'0'),keys=Array.from({length:7},(_,i)=>{const d=new Date(m);d.setDate(m.getDate()+i);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())});
    return (schedules||[]).length+(customEvents||[]).filter(x=>keys.includes(x.date)).length;
  }
  function openEditor(item=null,stage='now'){
    const el=$id('guideEditor');if(!el)return;
    const data=item||{id:'',title:'',kind:'direction',area:'Personal',stage,why:'',note:''};
    $id('guideItemId').value=data.id||'';
    $id('guideItemTitle').value=data.title||'';
    $id('guideItemKind').value=data.kind||'direction';
    $id('guideItemArea').value=data.area||'Personal';
    $id('guideItemStage').value=data.stage||stage;
    $id('guideItemWhy').value=data.why||'';
    $id('guideItemNote').value=data.note||'';
    $id('guideEditorTitle').textContent=data.id?'Edit guide item':'Something that matters';
    $id('deleteGuideItem').hidden=!data.id;
    $id('guideStructureActions').hidden=!data.id;
    el.classList.add('open');el.setAttribute('aria-hidden','false');
    setTimeout(()=>$id('guideItemTitle')?.focus(),40);
  }
  function closeEditor(){
    const el=$id('guideEditor');if(!el)return;
    el.classList.remove('open');el.setAttribute('aria-hidden','true');
  }
  function itemFromForm(){
    const existing=items.find(x=>x.id===$id('guideItemId').value);
    return {
      ...(existing||{}),
      id:$id('guideItemId').value||uid(),
      title:$id('guideItemTitle').value.trim(),
      kind:$id('guideItemKind').value,
      area:$id('guideItemArea').value,
      stage:$id('guideItemStage').value,
      why:$id('guideItemWhy').value.trim(),
      note:$id('guideItemNote').value.trim(),
      createdAt:existing?.createdAt||new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };
  }
  function card(item){
    return '<article class="guide-item-card '+esc(item.kind)+'" data-guide-id="'+esc(item.id)+'">'+
      '<div class="guide-item-top"><span>'+esc(KIND_LABEL[item.kind]||item.kind)+' · '+esc(item.area||'Personal')+'</span><button data-guide-edit="'+esc(item.id)+'" aria-label="Edit '+esc(item.title)+'">•••</button></div>'+
      '<h3>'+esc(item.title)+'</h3>'+
      (item.why?'<p>'+esc(item.why)+'</p>':'')+
      (item.note?'<small>'+esc(item.note)+'</small>':'')+
      '<footer><select data-guide-stage="'+esc(item.id)+'" aria-label="Move '+esc(item.title)+'"><option value="now" '+(item.stage==='now'?'selected':'')+'>Now</option><option value="warm" '+(item.stage==='warm'?'selected':'')+'>Keep warm</option><option value="later" '+(item.stage==='later'?'selected':'')+'>Later</option></select><button class="text-link" data-guide-edit="'+esc(item.id)+'">Open →</button></footer>'+
      '</article>';
  }
  function emptyCard(stage){
    const copy={
      now:['Nothing needs present attention yet.','Put something here when you want it visible without necessarily turning it into a goal.'],
      warm:['Nothing is being kept warm.','This is a good place for important threads that should not become obligations yet.'],
      later:['Nothing saved for later.','Future possibilities can live here without leaking pressure into the present.']
    }[stage];
    return '<div class="guide-empty"><strong>'+copy[0]+'</strong><span>'+copy[1]+'</span></div>';
  }
  function renderColumns(){
    const c=counts();
    for(const stage of ['now','warm','later']){
      const root=$id('guide'+(stage==='warm'?'Warm':stage[0].toUpperCase()+stage.slice(1))+'List');
      const list=items.filter(x=>x.stage===stage);
      if(root)root.innerHTML=list.length?list.map(card).join(''):emptyCard(stage);
      const meta=$id('guide'+(stage==='warm'?'Warm':stage[0].toUpperCase()+stage.slice(1))+'Meta');
      if(meta)meta.textContent=list.length+' '+(list.length===1?'item':'items');
    }
    setText('guideNowCount',c.now);setText('guideWarmCount',c.warm);setText('guideLaterCount',c.later);
  }
  function renderBridge(){
    const week=currentWeek(),p=week.plan||{},r=rhythms(),anchors=calendarAnchors();
    const structured=(goals||[]).length+r.length+(p.blocks||[]).length;
    setText('guideStructuredCount',structured);
    setText('guideGoalSummary',(goals||[]).length+' '+((goals||[]).length===1?'formal direction':'formal directions'));
    setText('guideRhythmSummary',r.length+' '+(r.length===1?'recurring support':'recurring supports'));
    const success=(p.success||[]).filter(Boolean);
    setText('guideWeekSummary',p.promise||success[0]||((p.blocks||[]).length?((p.blocks||[]).length+' protected blocks'):'week is open'));
    setText('guideCalendarSummary',anchors+' '+(anchors===1?'protected anchor':'protected anchors'));
    const state=$id('guideBridgeState');
    if(state){
      if(!items.length)state.textContent='nothing needs more structure yet';
      else if(items.some(x=>x.stage==='now')&&!structured)state.textContent='your guide can stay loose';
      else state.textContent='structure exists where you chose it';
    }
  }
  function renderInsight(){
    const c=counts(),nowItems=items.filter(x=>x.stage==='now'),questions=nowItems.filter(x=>x.kind==='question'),commitments=nowItems.filter(x=>x.kind==='commitment');
    let title='Start with what you do not want to lose track of.';
    let copy='An idea can stay an idea. A direction can stay broad. Blueprint will suggest structure only when it seems useful.';
    let action='Add something',mode='add';
    if(c.now>=6){
      title='Now is getting crowded.';
      copy='Several things are asking for present attention. You might move one to Keep warm rather than making all of them compete.';
      action='Review Now';mode='review';
    }else if(items.length&&c.now===0){
      title='Your guide has no “Now” item.';
      copy='That can be deliberate. If you want a little orientation, choose one thing that deserves present visibility—not necessarily action.';
      action='Choose something';mode='add';
    }else if(questions.length){
      title='One of your important threads is still a question.';
      copy='It may be more useful to keep the uncertainty visible than to prematurely convert it into a goal.';
      action='Keep it open';mode='review';
    }else if(commitments.length&&!rhythms().length){
      title='A recurring commitment may want a lighter default.';
      copy='If one of these repeats often, a Rhythm can reduce the number of times you have to decide how it fits.';
      action='See rhythms';mode='rhythms';
    }else if(c.now>0&&c.now<=3){
      title='Your present field is relatively clear.';
      copy='A few visible priorities with warm and later space around them is enough. You do not need to formalize everything.';
      action='Design this week';mode='week';
    }
    setText('guideInsightTitle',title);setText('guideInsightCopy',copy);
    const b=$id('guideInsightAction');if(b){b.textContent=action;b.dataset.guideInsight=mode}
  }
  function renderPlan(){
    renderColumns();renderBridge();renderInsight();
    window.renderAdaptiveToday?.();
  }
  function useToday(item){
    const api=window.BlueprintDayDesign;if(!api){showToast('Day Design is unavailable');return}
    const d=api.getToday(),success=Array.isArray(d.success)?[...d.success]:['','',''];
    const existing=success.some(x=>String(x).toLowerCase()===item.title.toLowerCase());
    if(existing){showToast('Already part of today');go('today');return}
    const idx=success.findIndex(x=>!String(x||'').trim());
    if(idx<0){showToast('Today already has three success conditions');go('today');return}
    success[idx]=item.title;d.success=success;api.saveToday(d);api.render();closeEditor();go('today');
    setTimeout(()=>document.getElementById('dayDesignCard')?.scrollIntoView({behavior:'smooth',block:'start'}),70);
    showToast('Added to today without creating a task');
  }
  function useWeek(item){
    const snap=window.BlueprintWeek?.getCurrent?.();if(!snap){showToast('Week Design is unavailable');return}
    const p=snap.plan;p.success=Array.isArray(p.success)?[...p.success.slice(0,3),...Array(3).fill('')].slice(0,3):['','',''];
    if(p.success.some(x=>String(x).toLowerCase()===item.title.toLowerCase())){showToast('Already part of this week');go('week');return}
    const idx=p.success.findIndex(x=>!String(x||'').trim());
    if(idx<0){showToast('This week already has three success conditions');go('week');return}
    p.success[idx]=item.title;p.committedAt=null;
    window.BlueprintWeek?.saveViewed?.();
    document.dispatchEvent(new CustomEvent('blueprint:week-design-updated'));
    closeEditor();go('week');showToast('Brought into Week Design without claiming calendar time');
  }
  function makeGoal(item){
    closeEditor();
    openCapture('Goal',{title:item.title,desc:item.why||item.note,domain:item.area||'Personal',kind:item.kind==='direction'?'direction':'target',horizon:'Flexible'});
  }
  function makeRhythm(item){
    closeEditor();
    if(window.BlueprintRhythms?.openNew){
      window.BlueprintRhythms.openNew({title:item.title,area:item.area||'Personal',purpose:item.why||item.note});
      return;
    }
    go('routines');showToast('Open Rhythms to give this a recurring shape');
  }
  function structureAction(type){
    const id=$id('guideItemId').value,item=items.find(x=>x.id===id);if(!item)return;
    if(type==='today')useToday(item);
    else if(type==='week')useWeek(item);
    else if(type==='goal')makeGoal(item);
    else if(type==='rhythm')makeRhythm(item);
  }

  $id('newGuideItem')?.addEventListener('click',()=>openEditor(null,'now'));
  document.querySelectorAll('[data-guide-new-stage]').forEach(b=>b.addEventListener('click',()=>openEditor(null,b.dataset.guideNewStage)));
  $id('closeGuideEditor')?.addEventListener('click',closeEditor);
  $id('guideEditor')?.addEventListener('click',e=>{if(e.target.id==='guideEditor')closeEditor()});
  $id('guideForm')?.addEventListener('submit',e=>{
    e.preventDefault();const item=itemFromForm();if(!item.title)return;
    const i=items.findIndex(x=>x.id===item.id);if(i>=0)items[i]=item;else items.unshift(item);
    persist();renderPlan();openEditor(item);showToast(i>=0?'Guide item updated':'Added to your Life Guide');
  });
  $id('deleteGuideItem')?.addEventListener('click',()=>{
    const id=$id('guideItemId').value;if(!id)return;
    items=items.filter(x=>x.id!==id);persist();closeEditor();renderPlan();showToast('Removed from Life Guide');
  });
  $id('guideStructureActions')?.addEventListener('click',e=>{const b=e.target.closest('[data-guide-use]');if(b)structureAction(b.dataset.guideUse)});
  document.querySelector('.life-guide-board')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-guide-edit]');if(!b)return;
    const item=items.find(x=>x.id===b.dataset.guideEdit);if(item)openEditor(item);
  });
  document.querySelector('.life-guide-board')?.addEventListener('change',e=>{
    const s=e.target.closest('[data-guide-stage]');if(!s)return;
    const item=items.find(x=>x.id===s.dataset.guideStage);if(!item)return;
    item.stage=s.value;item.updatedAt=new Date().toISOString();persist();renderPlan();
  });
  $id('guideInsightAction')?.addEventListener('click',e=>{
    const mode=e.currentTarget.dataset.guideInsight;
    if(mode==='week')go('week');
    else if(mode==='rhythms')go('routines');
    else if(mode==='review')document.querySelector('.guide-column.now')?.scrollIntoView({behavior:'smooth',block:'start'});
    else openEditor(null,'now');
  });

  document.addEventListener('blueprint:week-updated',renderBridge);
  document.addEventListener('blueprint:rhythms-updated',renderBridge);
  document.addEventListener('blueprint:day-design-updated',()=>window.renderAdaptiveToday?.());

  const baseGoals=renderGoals;renderGoals=function(){const out=baseGoals.apply(this,arguments);renderBridge();return out};
  const baseSchedules=renderSchedules;renderSchedules=function(){const out=baseSchedules.apply(this,arguments);renderBridge();return out};
  const baseCalendar=renderCalendar;renderCalendar=function(){const out=baseCalendar.apply(this,arguments);renderBridge();return out};

  window.BlueprintLifeGuide={
    get:()=>items,
    topNow,
    openNew:(stage='now')=>openEditor(null,stage),
    open:id=>{const item=items.find(x=>x.id===id);if(item)openEditor(item)},
    render:renderPlan
  };
  window.renderPlan=renderPlan;
  renderPlan();
})();