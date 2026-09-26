(()=>{
  const KEY='bp-activation-v26';
  const DEPTH_PAGES={
    lab:new Set(['lab','experiments','metrics']),
    reflect:new Set(['reflect','review','memory','compass','inbox','archive'])
  };
  const persistedKeys=['bp-goals-v5','bp-experiments-v5','bp-schedules-v5','bp-week-plans-v17','bp-day-design-v27','bp-rhythms-v28','bp-choice-rules-v28','bp-checkins-v3','bp-weekly-syntheses-v14'];
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
    const direction=ownedGoals.length>0;
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
      {id:'direction',done:m.direction,title:'Choose one direction',copy:'What would make the next few weeks meaningfully better?',action:'Choose direction'},
      {id:'week',done:m.week,title:'Give it a place',copy:'Protect a small amount of real capacity before the calendar fills itself.',action:'Shape this week'},
      {id:'day',done:m.day,title:'Design a successful day',copy:'Define success conditions, fixed reality, and enough open space for the day to stay human.',action:'Design today'},
      {id:'flex',done:m.flex,title:'Make the plan flexible',copy:'Add a boundary, support, choice rule, or minimum viable version so reality can change the day without breaking it.',action:'Add flexibility'}
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
    if(id==='direction'){openCapture('Goal');return}
    if(id==='week'){go('week');return}
    if(id==='day'){scrollToDesign('daySuccess1');return}
    if(id==='flex'){scrollToDesign('dayMinimum');return}
    if(id==='lab'||id==='reflect'){go(id);return}
    go('today');
  }
  function renderFocusMini(){
    const box=document.getElementById('focusMini');if(!box)return;
    const owned=hasPersisted('bp-goals-v5')?goals:[],first=owned[0];
    const d=window.BlueprintDayDesign?.getToday?.();
    const firstSuccess=(d?.success||[]).find(Boolean);
    const title=firstSuccess||profile?.focus||first?.title||'No primary direction yet';
    const copy=d?.boundary?('Boundary · '+d.boundary):(first?'Keep the current direction small enough to protect.':'Choose one direction before building more structure.');
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
        direction:['Start smaller than the whole system.','Choose one direction.','A target, character practice, system, or broad direction is enough. You can refine it later.'],
        week:['Direction needs a realistic claim on time.','Give the direction a place this week.','Choose a small amount of protected capacity. The rest can remain open.'],
        day:['A calendar is not a definition of success.','Design today around what matters.','Name a few success conditions, respect fixed reality, and keep open space visible.'],
        flex:['A good plan survives contact with reality.','Give today a smaller version.','Add a boundary, support, choice rule, or minimum viable day so changing the plan does not mean failing it.']
      }[step.id];
      document.getElementById('activationNextKicker').textContent=map[0];
      document.getElementById('activationNextTitle').textContent=map[1];
      document.getElementById('activationNextCopy').textContent=map[2];
      const btn=document.getElementById('activationNextAction');btn.textContent=step.action;btn.dataset.activationAction=step.id;
      document.getElementById('activationTitle').textContent='Start with one useful design loop.';
      document.getElementById('activationCopy').textContent=a.lab?'Your foundation is taking shape. Deeper tools appear when they solve a real question.':'Blueprint will reveal more only when the extra structure becomes useful.';
    }else{
      document.getElementById('activationNextKicker').textContent='Foundation complete';
      document.getElementById('activationNextTitle').textContent='You can design without over-managing.';
      document.getElementById('activationNextCopy').textContent='Direction, weekly capacity, a successful-day shape, and flexibility now connect. Deeper tools can stay optional.';
      const btn=document.getElementById('activationNextAction');btn.textContent=a.lab?'Open Lab':'Review today';btn.dataset.activationAction=a.lab?'lab':'day';
      document.getElementById('activationTitle').textContent='Your first design loop is alive.';
      document.getElementById('activationCopy').textContent='The system now helps structure choices without turning daily life into a performance dashboard.';
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
      if(small)small.textContent=simple&&!allowed?(space==='lab'?'after your first design loop':'when something is worth reviewing'):(space==='lab'?'Try + measure':'Learn + decide');
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
  document.addEventListener('click',e=>{if(e.target.closest('#saveCapture,[data-delete-goal],[data-delete-experiment]'))setTimeout(renderActivation,80)});

  if(typeof renderGoals==='function'){const base=renderGoals;renderGoals=function(){const out=base.apply(this,arguments);setTimeout(renderActivation,0);return out}}
  if(typeof renderWorkspace==='function'){const base=renderWorkspace;renderWorkspace=function(){const out=base.apply(this,arguments);setTimeout(renderActivation,0);return out}}
  window.BlueprintActivation={render:renderActivation,setMode,getState:()=>activation,getAccess:access};
  renderActivation();
})();