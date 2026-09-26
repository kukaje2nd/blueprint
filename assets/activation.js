(()=>{
  const KEY='bp-activation-v26';
  const DEPTH_PAGES={
    lab:new Set(['lab','experiments','metrics','routines']),
    reflect:new Set(['reflect','review','memory','compass','inbox','archive'])
  };
  const persistedKeys=['bp-goals-v5','bp-experiments-v5','bp-schedules-v5','bp-week-plans-v17','bp-daily-pulse-v13','bp-checkins-v3','bp-weekly-syntheses-v14'];
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
  function milestones(){
    const week=currentWeek().plan||{},ownedGoals=hasPersisted('bp-goals-v5')?goals:[];
    const direction=ownedGoals.length>0;
    const shapedWeek=!!(week.promise||(week.blocks||[]).length);
    const observed=(dailyPulses||[]).length>0;
    const learning=(dailyPulses||[]).length>=3||(checkins||[]).length>=2||(typeof weeklySyntheses!=='undefined'&&weeklySyntheses.length>0);
    return {direction,week:shapedWeek,pulse:observed,learn:learning};
  }
  function access(){
    const m=milestones();
    const intentionalExperiment=hasPersisted('bp-experiments-v5')&&(experiments||[]).length>0;
    return {
      lab:activation.mode==='full'||intentionalExperiment||(m.direction&&m.week&&m.pulse),
      reflect:activation.mode==='full'||m.learn,
      milestones:m
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
      {id:'direction',done:m.direction,kicker:'01 · Direction',title:'Choose one direction',copy:'What would make the next few weeks meaningfully better?',action:'Choose direction'},
      {id:'week',done:m.week,kicker:'02 · Week',title:'Give it a place',copy:'Protect a small amount of real capacity before the calendar fills itself.',action:'Shape this week'},
      {id:'pulse',done:m.pulse,kicker:'03 · Notice',title:'Capture one observation',copy:'Log energy, focus, mood, and one sentence only if it would help you notice context.',action:'Log today'},
      {id:'learn',done:m.learn,kicker:'04 · Learn',title:'Let a pattern earn reflection',copy:'After a few observations, Reflect becomes useful because there is something real to compare.',action:'Keep observing'}
    ];
  }
  function currentStep(){
    const steps=stepModel();
    return steps.find(x=>!x.done)||null;
  }
  function performStep(id){
    if(id==='direction'){openCapture('Goal');return}
    if(id==='week'){go('week');return}
    if(id==='pulse'){
      go('today');
      setTimeout(()=>document.querySelector('.daily-pulse')?.scrollIntoView({behavior:'smooth',block:'center'}),60);
      return;
    }
    if(id==='learn'){
      if(access().reflect)go('reflect');
      else{
        go('today');
        setTimeout(()=>document.querySelector('.daily-pulse')?.scrollIntoView({behavior:'smooth',block:'center'}),60);
        showToast('A few observations will make reflection useful');
      }
      return;
    }
    go('today');
  }
  function renderFocusMini(){
    const box=document.getElementById('focusMini');if(!box)return;
    const owned=hasPersisted('bp-goals-v5')?goals:[];
    const first=owned[0];
    const title=profile?.focus||first?.title||'No primary focus yet';
    const copy=profile?.note||(first?'Keep the current direction small enough to protect.':'Choose one direction before building more structure.');
    box.querySelector('strong').textContent=title;
    box.querySelector('p').textContent=copy;
  }
  function renderSteps(){
    const root=document.getElementById('activationSteps');if(!root)return;
    const steps=stepModel();
    root.innerHTML=steps.map((s,i)=>'<button class="activation-step '+(s.done?'done':'')+'" data-activation-step="'+s.id+'" '+(s.done?'disabled':'')+'><span>'+(s.done?'✓':String(i+1).padStart(2,'0'))+'</span><div><strong>'+escapeHTML(s.title)+'</strong><small>'+escapeHTML(s.done?'Complete · the next layer can build on this':s.copy)+'</small></div></button>').join('');
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
        pulse:['Plans become useful when reality can answer back.','Notice what is true today.','One lightweight observation is enough. You are collecting context, not grading yourself.'],
        learn:['Do not force meaning too early.','Let the evidence repeat.','A few days of observations will make Reflect useful instead of theoretical.']
      }[step.id];
      document.getElementById('activationNextKicker').textContent=map[0];
      document.getElementById('activationNextTitle').textContent=map[1];
      document.getElementById('activationNextCopy').textContent=map[2];
      const btn=document.getElementById('activationNextAction');btn.textContent=step.action;btn.dataset.activationAction=step.id;
      document.getElementById('activationTitle').textContent='Start with one useful loop.';
      document.getElementById('activationCopy').textContent=a.lab?'Your foundation is taking shape. Deeper tools are appearing only when they have evidence to work with.':'Blueprint will reveal more only when there is enough evidence for the extra structure to become useful.';
    }else{
      document.getElementById('activationNextKicker').textContent='Foundation complete';
      document.getElementById('activationNextTitle').textContent='You have enough structure to learn from.';
      document.getElementById('activationNextCopy').textContent='Keep the interface simple, or reveal the full system whenever deeper tools solve a real problem.';
      const btn=document.getElementById('activationNextAction');btn.textContent=a.reflect?'Open Reflect':'Open Lab';btn.dataset.activationAction=a.reflect?'reflect':'lab';
      document.getElementById('activationTitle').textContent='Your first loop is alive.';
      document.getElementById('activationCopy').textContent='Direction, capacity, observation, and learning now connect. Complexity can stay optional.';
    }
  }
  function renderNavigation(){
    const a=access(),simple=activation.mode==='simple';
    document.body.classList.toggle('activation-simple',simple);
    document.body.classList.toggle('activation-full',!simple);
    for(const [space,allowed] of [['lab',a.lab],['reflect',a.reflect]]){
      const btn=document.querySelector('#primaryNav [data-space="'+space+'"]');if(!btn)continue;
      btn.classList.toggle('activation-locked',simple&&!allowed);
      btn.setAttribute('aria-disabled',String(simple&&!allowed));
      const small=btn.querySelector('small');
      if(small)small.textContent=simple&&!allowed?(space==='lab'?'after your first loop':'after repeated evidence'):(space==='lab'?'Try + measure':'Learn + decide');
    }
    const toggle=document.getElementById('complexityToggleLabel');
    if(toggle)toggle.textContent=simple?'Show full Blueprint':'Start simple';
    const full=document.getElementById('activationFullAction');
    if(full)full.textContent=simple?'Show full Blueprint':'Keep Start simple';
    const card=document.getElementById('activationCard');
    if(card)card.hidden=!simple;
  }
  function renderFreshCopy(){
    const owned=hasPersisted('bp-goals-v5')?goals:[];
    if(activation.mode==='simple'&&!owned.length){
      const outcome=document.getElementById('primaryOutcome');if(outcome)outcome.textContent='What would make the next few weeks meaningfully better?';
      const copy=document.getElementById('heroCopy');if(copy)copy.textContent='You do not need to configure a life operating system. Choose one direction, protect a little time, and let Blueprint learn from what happens.';
      const advance=document.getElementById('todayAdvanceTitle');if(advance)advance.textContent='Choose one direction worth moving';
      const advanceCopy=document.getElementById('todayAdvanceCopy');if(advanceCopy)advanceCopy.textContent='Start with a meaningful change, not with a complete taxonomy of your life.';
    }
    renderFocusMini();
  }
  function renderActivation(){
    renderNavigation();
    renderSteps();
    renderNext();
    renderFreshCopy();
  }

  document.getElementById('complexityToggle')?.addEventListener('click',()=>setMode(activation.mode==='simple'?'full':'simple'));
  document.getElementById('activationFullAction')?.addEventListener('click',()=>setMode(activation.mode==='simple'?'full':'simple'));
  document.getElementById('activationNextAction')?.addEventListener('click',e=>performStep(e.currentTarget.dataset.activationAction));
  document.getElementById('activationSteps')?.addEventListener('click',e=>{const b=e.target.closest('[data-activation-step]');if(b&&!b.disabled)performStep(b.dataset.activationStep)});

  document.addEventListener('click',e=>{
    if(activation.mode!=='simple')return;
    const target=e.target.closest('[data-page],[data-page-jump]');
    if(!target)return;
    const page=target.dataset.page||target.dataset.pageJump;
    const a=access();
    const labLocked=DEPTH_PAGES.lab.has(page)&&!a.lab;
    const reflectLocked=DEPTH_PAGES.reflect.has(page)&&!a.reflect;
    if(!labLocked&&!reflectLocked)return;
    e.preventDefault();e.stopImmediatePropagation();
    go('today');
    setTimeout(()=>document.getElementById('activationCard')?.scrollIntoView({behavior:'smooth',block:'start'}),70);
    showToast(labLocked?'Lab appears after direction, a shaped week, and one observation':'Reflect appears after enough evidence exists to compare');
  },true);

  document.addEventListener('blueprint:week-updated',()=>setTimeout(renderActivation,0));
  document.addEventListener('click',e=>{
    if(e.target.closest('#savePulse,#saveCapture,[data-delete-goal],[data-delete-experiment]'))setTimeout(renderActivation,80);
  });

  if(typeof renderGoals==='function'){
    const base=renderGoals;renderGoals=function(){const out=base.apply(this,arguments);setTimeout(renderActivation,0);return out};
  }
  if(typeof renderWorkspace==='function'){
    const base=renderWorkspace;renderWorkspace=function(){const out=base.apply(this,arguments);setTimeout(renderActivation,0);return out};
  }
  window.BlueprintActivation={render:renderActivation,setMode,getState:()=>activation,getAccess:access};
  renderActivation();
})();