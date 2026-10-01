(()=>{
  const KEY='bp-activation-v26';
  const DEPTH_PAGES={
    lab:new Set(['lab','experiments','metrics','routines']),
    reflect:new Set(['reflect','review','memory','compass','inbox','archive'])
  };
  const persistedKeys=['bp-guide-items-v30','bp-goals-v5','bp-experiments-v5','bp-schedules-v5','bp-week-plans-v17','bp-day-design-v27','bp-checkins-v3','bp-weekly-syntheses-v14'];
  const hasPersisted=k=>storage.getItem(k)!==null;
  const getState=()=>{
    let s=store.get(KEY,null);
    if(!s){
      const established=persistedKeys.filter(hasPersisted).length>=3;
      s={mode:established?'full':'simple',startedAt:new Date().toISOString(),source:established?'existing-workspace':'first-week'};
      store.set(KEY,s);
    }
    return s;
  };
  let activation=getState();

  function currentWeek(){
    if(window.BlueprintWeek?.getCurrent)return window.BlueprintWeek.getCurrent();
    const d=new Date();d.setHours(12,0,0,0);const day=d.getDay();d.setDate(d.getDate()+(day===0?-6:1-day));
    const pad=n=>String(n).padStart(2,'0'),key=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
    const plans=store.get('bp-week-plans-v17',{})||{},plan=plans[key]||{capacity:18,promise:'',boundary:'',blocks:[],committedAt:null};
    return {key,plan,minutes:(plan.blocks||[]).reduce((a,b)=>a+(Number(b.duration)||0),0),capacityMinutes:(Number(plan.capacity)||18)*60};
  }
  function reviewEvidence(){
    const synth=store.get('bp-weekly-syntheses-v14',[])||[];
    const reviews=store.get('bp-experiment-reviews-v16',[])||[];
    const observations=store.get('bp-checkins-v3',[])||[];
    return {ready:synth.length>0||reviews.length>0||observations.length>=2,count:synth.length+reviews.length+observations.length};
  }
  function milestones(){
    const week=currentWeek().plan||{},ownedGoals=hasPersisted('bp-goals-v5')?goals:[];
    const design=window.BlueprintDayDesign?.getToday?.()||{updatedAt:null,boundary:'',minimum:'',choiceRule:'',supports:[]};
    const guideNow=(window.BlueprintLifeGuide?.get?.()||[]).some(x=>x.stage==='now');const direction=ownedGoals.length>0||guideNow;
    const shapedWeek=!!(week.promise||(week.blocks||[]).length);
    const day=!!design.updatedAt;
    const flex=!!(design.minimum||design.boundary||design.choiceRule||(design.supports||[]).length);
    return {direction,week:shapedWeek,day,flex};
  }
  function access(){
    const m=milestones(),review=reviewEvidence();
    const intentionalExperiment=hasPersisted('bp-experiments-v5')&&(experiments||[]).length>0;
    return {
      lab:activation.mode==='full'||intentionalExperiment||(m.direction&&m.week&&m.day),
      reflect:activation.mode==='full'||review.ready,
      milestones:m,review
    };
  }
  function setMode(mode){
    activation={...activation,mode,changedAt:new Date().toISOString()};
    store.set(KEY,activation);
    renderActivation();
    showToast(mode==='full'?'Full Blueprint revealed':'Start simple restored');
  }
  function stepModel(){
    const m=milestones();
    return [
      {id:'direction',done:m.direction,title:'Choose one thing that matters',copy:'A direction, commitment, question, or possibility is enough.',action:'Choose direction'},
      {id:'week',done:m.week,title:'Make room for it this week',copy:'Give it a little real capacity without filling the whole calendar.',action:'Shape this week'},
      {id:'day',done:m.day,title:'Define a good day',copy:'Name what would make today worthwhile and leave room for reality.',action:'Design today'},
      {id:'flex',done:m.flex,title:'Add a fallback',copy:'Choose a smaller version so a changed day does not become a failed day.',action:'Add flexibility'}
    ];
  }
  function currentStep(){return stepModel().find(x=>!x.done)||null}
  function scrollToDesign(focusId){
    go('today');
    setTimeout(()=>{
      document.getElementById('dayDesignCard')?.scrollIntoView({behavior:'smooth',block:'start'});
      if(focusId)setTimeout(()=>document.getElementById(focusId)?.focus(),220);
    },70);
  }
  function performStep(id){
    if(id==='direction'){if(window.BlueprintLifeGuide?.openNew){go('plan');setTimeout(()=>window.BlueprintLifeGuide.openNew('now'),70)}else openCapture('Goal');return}
    if(id==='week'){go('week');return}
    if(id==='day'){scrollToDesign('daySuccess1');return}
    if(id==='flex'){scrollToDesign('dayMinimum');return}
    if(id==='lab'||id==='reflect'){go(id);return}
    go('today');
  }
  function renderFocusMini(){
    const box=document.getElementById('focusMini');if(!box)return;
    const owned=hasPersisted('bp-goals-v5')?goals:[],first=owned[0],guide=window.BlueprintLifeGuide?.topNow?.();
    const d=window.BlueprintDayDesign?.getToday?.();
    const firstSuccess=(d?.success||[]).find(Boolean);
    const title=firstSuccess||guide?.title||profile?.focus||first?.title||'Nothing needs to be primary yet';
    const copy=d?.boundary?('Boundary · '+d.boundary):(guide?.why||(first?'Keep the current direction visible without over-structuring it.':'Add something to your Life Guide when you want it remembered.'));
    box.querySelector('strong').textContent=title;
    box.querySelector('p').textContent=copy;
  }
  function renderSteps(){
    const root=document.getElementById('activationSteps');if(!root)return;
    const steps=stepModel();
    root.innerHTML=steps.map((s,i)=>'<button class="activation-step '+(s.done?'done':'')+'" data-activation-step="'+s.id+'" '+(s.done?'disabled':'')+'><span>'+(s.done?'✓':String(i+1).padStart(2,'0'))+'</span><div><strong>'+escapeHTML(s.title)+'</strong><small>'+escapeHTML(s.done?'Complete · this layer is available when you need it':s.copy)+'</small></div></button>').join('');
    const done=steps.filter(s=>s.done).length;
    const value=document.getElementById('activationProgressValue');if(value)value.textContent=done+'/4';
    const ring=document.getElementById('activationProgressRing');if(ring)ring.style.setProperty('--activation-progress',(done/4*100)+'%');
  }
  function renderNext(){
    const step=currentStep(),a=access();
    if(step){
      const map={
        direction:['First step','Choose one thing that matters.','That is enough to begin. You can decide later whether it needs a goal, project, or schedule.'],
        week:['Next step','Make a little room for it this week.','Protect enough capacity to make progress and leave the rest of the week breathable.'],
        day:['Next step','Define what a good day looks like.','Choose a few success conditions and respect what is already fixed.'],
        flex:['Last foundation step','Give the plan a fallback.','Create a smaller viable version so reality can change without turning the day into a failure.']
      }[step.id];
      document.getElementById('activationNextKicker').textContent=map[0];
      document.getElementById('activationNextTitle').textContent=map[1];
      document.getElementById('activationNextCopy').textContent=map[2];
      const btn=document.getElementById('activationNextAction');btn.textContent=step.action;btn.dataset.activationAction=step.id;
      document.getElementById('activationTitle').textContent='Build your Blueprint one step at a time.';
      document.getElementById('activationCopy').textContent=a.lab?'Your foundation is taking shape. Deeper tools can stay optional.':'The rest of Blueprint stays out of the way until it becomes useful.';
    }else{
      document.getElementById('activationNextKicker').textContent='Foundation complete';
      document.getElementById('activationNextTitle').textContent='You are ready to use Blueprint normally.';
      document.getElementById('activationNextCopy').textContent='Your direction, week, day, and fallback now connect. Open deeper tools only when they answer a real question.';
      const btn=document.getElementById('activationNextAction');btn.textContent=a.lab?'Open Lab':'Review today';btn.dataset.activationAction=a.lab?'lab':'day';
      document.getElementById('activationTitle').textContent='Your foundation is ready.';
      document.getElementById('activationCopy').textContent='Blueprint can now support your choices without asking you to manage the system itself.';
    }
  }
  function renderNavigation(){
    const a=access(),simple=activation.mode==='simple';
    document.body.classList.toggle('activation-simple',simple);
    document.body.classList.toggle('activation-full',!simple);
    document.body.classList.toggle('activation-has-design',a.milestones.day);
    document.body.classList.toggle('activation-has-week',a.milestones.week);
    document.body.classList.toggle('activation-has-direction',a.milestones.direction);
    for(const [space,allowed] of [['lab',a.lab],['reflect',a.reflect]]){
      const btn=document.querySelector('#primaryNav [data-space="'+space+'"]');if(!btn)continue;
      btn.classList.toggle('activation-locked',simple&&!allowed);
      btn.setAttribute('aria-disabled',String(simple&&!allowed));
      const small=btn.querySelector('small');
      if(small)small.textContent=simple&&!allowed?(space==='lab'?'after your first design loop':'when something is worth reviewing'):(space==='lab'?'Test + learn':'Learn + decide');
    }
    const toggle=document.getElementById('complexityToggleLabel');if(toggle)toggle.textContent=simple?'Show full Blueprint':'Start simple';
    const full=document.getElementById('activationFullAction');if(full)full.textContent=simple?'Show full Blueprint':'Keep Start simple';
    const card=document.getElementById('activationCard');if(card)card.hidden=!simple;
  }
  function renderFreshCopy(){
    const owned=hasPersisted('bp-goals-v5')?goals:[];
    if(activation.mode==='simple'&&!owned.length&&!window.BlueprintDayDesign?.exists?.()){
      const outcome=document.getElementById('primaryOutcome');if(outcome)outcome.textContent='What would make the next few weeks meaningfully better?';
      const copy=document.getElementById('heroCopy');if(copy)copy.textContent='You do not need to configure a life operating system. Choose one direction, protect a little time, and design days that can flex with reality.';
    }
    renderFocusMini();
  }
  function renderActivation(){renderNavigation();renderSteps();renderNext();renderFreshCopy()}

  document.getElementById('complexityToggle')?.addEventListener('click',()=>setMode(activation.mode==='simple'?'full':'simple'));
  document.getElementById('activationFullAction')?.addEventListener('click',()=>setMode(activation.mode==='simple'?'full':'simple'));
  document.getElementById('activationNextAction')?.addEventListener('click',e=>performStep(e.currentTarget.dataset.activationAction));
  document.getElementById('activationSteps')?.addEventListener('click',e=>{const b=e.target.closest('[data-activation-step]');if(b&&!b.disabled)performStep(b.dataset.activationStep)});

  document.addEventListener('click',e=>{
    if(activation.mode!=='simple')return;
    const target=e.target.closest('[data-page],[data-page-jump]');if(!target)return;
    const page=target.dataset.page||target.dataset.pageJump,a=access();
    const labLocked=DEPTH_PAGES.lab.has(page)&&!a.lab,reflectLocked=DEPTH_PAGES.reflect.has(page)&&!a.reflect;
    if(!labLocked&&!reflectLocked)return;
    e.preventDefault();e.stopImmediatePropagation();go('today');
    setTimeout(()=>document.getElementById('activationCard')?.scrollIntoView({behavior:'smooth',block:'start'}),70);
    showToast(labLocked?'Lab appears after direction, a shaped week, and a designed day':'Reflect appears when there is something meaningful to review');
  },true);

  document.addEventListener('blueprint:week-updated',()=>setTimeout(renderActivation,0));
  document.addEventListener('blueprint:day-design-updated',()=>setTimeout(renderActivation,0));
  document.addEventListener('blueprint:guide-updated',()=>setTimeout(renderActivation,0));
  document.addEventListener('click',e=>{if(e.target.closest('#saveCapture,[data-delete-goal],[data-delete-experiment]'))setTimeout(renderActivation,80)});

  if(typeof renderGoals==='function'){const base=renderGoals;renderGoals=function(){const out=base.apply(this,arguments);setTimeout(renderActivation,0);return out}}
  if(typeof renderWorkspace==='function'){const base=renderWorkspace;renderWorkspace=function(){const out=base.apply(this,arguments);setTimeout(renderActivation,0);return out}}
  window.BlueprintActivation={render:renderActivation,setMode,getState:()=>activation,getAccess:access};
  renderActivation();
})();