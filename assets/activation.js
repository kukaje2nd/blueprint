(()=>{
  const KEY='bp-activation-v26';
  const activityKeys=[
    'bp-goals-v5','bp-experiments-v5','bp-custom-metrics-v12','bp-daily-pulse-v13',
    'bp-week-plans-v17','bp-weekly-syntheses-v14','bp-checkins-v3','bp-onboarding-v13',
    'bp-memories-v8','bp-events-v2','bp-schedules-v5','bp-inbox-v2','bp-principles-v9',
    'bp-decisions-v9','bp-people-v10','bp-commitments-v10'
  ];
  const hasPersistentActivity=activityKeys.some(k=>storage.getItem(k)!=null);
  let activation=store.get(KEY,null);
  const beganFresh=!activation&&!hasPersistentActivity;
  let activationKind='target';

  if(!activation){
    activation={
      version:26,
      mode:beganFresh?'simple':'full',
      completed:!beganFresh,
      origin:beganFresh?'fresh':'migrated',
      startedAt:beganFresh?'':new Date().toISOString(),
      dismissedPath:!beganFresh
    };
    store.set(KEY,activation);
  }

  const saveActivation=()=>store.set(KEY,activation);
  const setText=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
  const safe=(fn)=>{try{if(typeof fn==='function')fn()}catch(_){}};

  function neutralProfile(){
    profile={
      ...profile,
      northStar:'Build a life that becomes clearer through deliberate choices and useful evidence.',
      focus:'Choose one meaningful change.',
      note:'Start simple. Protect one meaningful change, notice what happens, and add structure only when it solves a real problem.',
      mode:profile.mode||'build',
      dayStart:profile.dayStart||'08:00',
      dayEnd:profile.dayEnd||'18:00',
      seasonName:'Open season',
      seasonEnd:'',
      seasonIntent:'Learn what deserves more structure through use.',
      seasonAnti:'Do not add complexity before it solves a real problem.',
      systemDepth:'light'
    };
    store.set('bp-profile-v5',profile);
  }

  function initializeFreshWorkspace(){
    inbox=[];customEvents=[];checkins=[];goals=[];goalJourneys={};experiments=[];schedules=[];
    customMetrics=[];memories=[];installedProtocols=[];principles=[];council=[];decisions=[];
    people=[];commitments=[];weeklySyntheses=[];dailyPulses=[];installedKits=[];
    try{experimentImpact={}}catch(_){}
    try{experimentReviews=[]}catch(_){}
    try{metricLogs={}}catch(_){}
    try{routineDone={}}catch(_){}

    const emptyArrays=[
      'bp-inbox-v2','bp-events-v2','bp-checkins-v3','bp-goals-v5','bp-experiments-v5',
      'bp-schedules-v5','bp-custom-metrics-v12','bp-memories-v8','bp-protocols-v8',
      'bp-principles-v9','bp-council-v9','bp-decisions-v9','bp-people-v10',
      'bp-commitments-v10','bp-weekly-syntheses-v14','bp-daily-pulse-v13',
      'bp-template-installs-v13','bp-experiment-reviews-v16'
    ];
    emptyArrays.forEach(k=>store.set(k,[]));
    ['bp-goal-journeys-v15','bp-experiment-impact-v16','bp-metric-logs-v16','bp-routines-v3','bp-week-plans-v17','bp-week-snapshots-v17'].forEach(k=>store.set(k,{}));
    onboarding={completed:true,domains:[],structure:'light',reviewDay:'Friday',templateId:''};
    store.set('bp-onboarding-v13',onboarding);
    neutralProfile();
    refreshWorkspace();
  }

  function refreshWorkspace(){
    safe(renderInbox);safe(renderGoals);safe(renderExperiments);safe(renderMetrics);safe(renderSchedules);
    safe(renderWorkspace);safe(renderAccountSettings);safe(renderCheckins);safe(renderCalendar);
    safe(renderMemory);safe(renderDecisionArchitecture);safe(renderCommons);safe(renderLibrary);
    safe(renderSetupState);safe(renderV12Hubs);safe(window.renderAdaptiveToday);safe(window.renderPlan);
    renderExperience();
  }

  function currentWeekState(){
    try{
      if(window.BlueprintWeek?.getCurrent)return window.BlueprintWeek.getCurrent();
    }catch(_){}
    return {plan:{promise:'',blocks:[],committedAt:null},minutes:0,capacityMinutes:1080};
  }

  function evidenceState(){
    const w=currentWeekState(),plan=w.plan||{},pulses=dailyPulses||[],logs=checkins||[],synth=weeklySyntheses||[];
    const directionReady=(goals||[]).length>0;
    const weekReady=!!(plan.promise||(plan.blocks||[]).length);
    const pulseReady=pulses.length>0;
    const labReady=(experiments||[]).length>0||pulses.length>=3||logs.length>0;
    const reflectReady=synth.length>0||pulses.length>=3||logs.length>=2;
    const learnReady=reflectReady;
    return {directionReady,weekReady,pulseReady,labReady,reflectReady,learnReady,plan,pulses,logs,synth};
  }

  function renderActivationPath(state=evidenceState()){
    const root=document.getElementById('activationPath');if(!root)return;
    root.hidden=!!activation.dismissedPath;
    root.classList.toggle('complete',state.directionReady&&state.weekReady&&state.pulseReady&&state.learnReady);
    const steps={
      direction:state.directionReady,
      week:state.weekReady,
      pulse:state.pulseReady,
      learn:state.learnReady
    };
    Object.entries(steps).forEach(([k,v])=>{
      const b=root.querySelector('[data-activation-step="'+k+'"]');
      if(b)b.classList.toggle('done',!!v);
    });
    setText('activationDirectionMeta',state.directionReady?((goals||[])[0]?.title||'Direction chosen'):'Name one meaningful change.');
    setText('activationWeekMeta',state.weekReady?((state.plan.blocks||[]).length+' protected '+((state.plan.blocks||[]).length===1?'block':'blocks')):'Give it realistic space.');
    setText('activationPulseMeta',state.pulseReady?(state.pulses.length+' pulse '+(state.pulses.length===1?'entry':'entries')+' captured'):'Log one 45-second pulse.');
    setText('activationLearnMeta',state.learnReady?'Enough evidence exists for a useful reflection.':'Reflection becomes useful after evidence exists.');
    const done=[state.directionReady,state.weekReady,state.pulseReady,state.learnReady].filter(Boolean).length;
    setText('activationPathCopy',done===4?'Your first loop is complete. Keep the system only as deep as it remains useful.':done===0?'One direction. One realistic week. One small signal. Reflection can come after reality has something to say.':done+' of 4 first-loop steps have real evidence behind them.');
    const dismiss=document.getElementById('activationPathDismiss');if(dismiss)dismiss.textContent=done===4?'First loop complete · Hide guide':'Hide guide';
  }

  function simpleAllowed(page,state=evidenceState()){
    const base=new Set(['today','plan','week','goals','calendar','lab','experiments','reflect','review','you','settings']);
    if(state.labReady){base.add('metrics');base.add('routines')}
    if(state.reflectReady){base.add('memory');base.add('inbox')}
    return base.has(page);
  }

  function applySecondaryDepth(state=evidenceState()){
    if(activation.mode!=='simple')return;
    document.querySelectorAll('#secondaryNav [data-page]').forEach(b=>{
      b.hidden=!simpleAllowed(b.dataset.page,state);
    });
  }

  function renderExperience(){
    const state=evidenceState(),simple=activation.mode==='simple';
    document.body.classList.toggle('experience-simple',simple);
    document.body.classList.toggle('experience-full',!simple);
    document.body.classList.toggle('activation-origin-fresh',activation.origin==='fresh');
    document.body.classList.toggle('lab-ready',state.labReady);
    document.body.classList.toggle('reflect-ready',state.reflectReady);
    document.body.classList.toggle('first-loop-complete',state.directionReady&&state.weekReady&&state.pulseReady&&state.learnReady);

    const toggle=document.getElementById('experienceToggle');
    if(toggle)toggle.setAttribute('aria-pressed',simple?'true':'false');
    setText('experienceToggleLabel',simple?'Simple view':'Full system');
    setText('experienceToggleHint',simple?'Depth reveals itself as useful':'All layers visible');

    const navCopy={
      today:'Run the present',
      plan:'Direction + time',
      lab:state.labReady?'Questions worth testing':'When a question appears',
      reflect:state.reflectReady?'Learn from evidence':'After evidence appears',
      you:'Profile + deeper tools'
    };
    document.querySelectorAll('#primaryNav [data-space]').forEach(b=>{
      const space=b.dataset.space,small=b.querySelector('small');
      b.classList.toggle('depth-muted',simple&&((space==='lab'&&!state.labReady)||(space==='reflect'&&!state.reflectReady)||space==='you'));
      if(small&&navCopy[space])small.textContent=navCopy[space];
    });

    const atlas=document.getElementById('atlasLaunch');
    if(atlas){
      const strong=atlas.querySelector('strong'),small=atlas.querySelector('small');
      if(strong)strong.textContent=simple?'Explore Blueprint':'Jump anywhere';
      if(small)small.textContent=simple?'Everything remains available':'Search every layer';
    }

    renderActivationPath(state);
    applySecondaryDepth(state);
  }

  function setExperience(mode){
    activation.mode=mode==='full'?'full':'simple';
    saveActivation();
    document.body.classList.remove('plan-tools-open');
    renderExperience();
    safe(()=>renderSecondaryNav(currentPage));
    showToast(activation.mode==='simple'?'Simple view enabled':'Full system revealed');
  }

  function shapeFor(kind,title){
    if(kind==='character')return {
      horizon:'Ongoing practice',
      desc:'Practice '+title.toLowerCase()+' through concrete behavior you can notice, rather than turning identity into a score.',
      metric:'Behavioral evidence worth reflecting on'
    };
    if(kind==='system')return {
      horizon:'Ongoing system',
      desc:'Make '+title.toLowerCase()+' easier to repeat with less friction and less dependence on willpower.',
      metric:'Evidence that the rhythm is becoming repeatable'
    };
    if(kind==='direction')return {
      horizon:'Open direction',
      desc:'Move toward '+title.toLowerCase()+' through choices that keep the direction alive without inventing a false finish line.',
      metric:'Evidence of aligned choices'
    };
    return {
      horizon:'Next 4–8 weeks',
      desc:'Make visible progress toward '+title.toLowerCase()+', then refine the finish line after the first week of real evidence.',
      metric:'Define the finish line after the first week'
    };
  }

  function completeActivation(withGoal){
    if(withGoal){
      const input=document.getElementById('activationOutcome'),title=(input?.value||'').trim();
      if(!title){
        input?.classList.add('needs-value');
        input?.focus();
        setTimeout(()=>input?.classList.remove('needs-value'),700);
        return;
      }
      const shape=shapeFor(activationKind,title);
      const goal={
        id:'activation-goal-'+Date.now(),
        kind:activationKind,
        domain:'Personal',
        horizon:shape.horizon,
        title,
        desc:shape.desc,
        progress:0,
        metric:shape.metric,
        confidence:'high',
        links:[]
      };
      goals=[goal];
      store.set('bp-goals-v5',goals);
      profile.focus=title;
      profile.note='Protect one meaningful move toward this direction, then notice what reality teaches you before adding more structure.';
      profile.systemDepth='light';
      store.set('bp-profile-v5',profile);
    }

    activation.completed=true;
    activation.startedAt=activation.startedAt||new Date().toISOString();
    activation.mode='simple';
    saveActivation();
    closeActivation();
    refreshWorkspace();
    safe(()=>go('today',{instant:true}));
    showToast(withGoal?'Your Blueprint starts with one direction':'Blank slate ready');
  }

  function openActivation(){
    document.getElementById('activationBackdrop')?.classList.add('open');
    document.getElementById('activationModal')?.classList.add('open');
    setTimeout(()=>document.getElementById('activationOutcome')?.focus(),100);
  }
  function closeActivation(){
    document.getElementById('activationBackdrop')?.classList.remove('open');
    document.getElementById('activationModal')?.classList.remove('open');
  }

  if(beganFresh)initializeFreshWorkspace();

  const secondaryBase=renderSecondaryNav;
  renderSecondaryNav=function(page){
    secondaryBase(page);
    applySecondaryDepth();
  };

  document.getElementById('experienceToggle')?.addEventListener('click',()=>setExperience(activation.mode==='simple'?'full':'simple'));
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-experience-full]')){setExperience('full');return}
    const shape=e.target.closest('[data-activation-kind]');
    if(shape){
      activationKind=shape.dataset.activationKind;
      document.querySelectorAll('[data-activation-kind]').forEach(b=>b.classList.toggle('active',b===shape));
      return;
    }
    const pulse=e.target.closest('[data-activation-step="pulse"]');
    if(pulse){
      document.querySelector('.daily-pulse')?.scrollIntoView({behavior:'smooth',block:'center'});
      setTimeout(()=>document.getElementById('pulseEnergy')?.focus(),450);
    }
  });
  document.getElementById('activationStart')?.addEventListener('click',()=>completeActivation(true));
  document.getElementById('activationSkip')?.addEventListener('click',()=>completeActivation(false));
  document.getElementById('activationPathDismiss')?.addEventListener('click',()=>{
    activation.dismissedPath=true;saveActivation();renderActivationPath();
  });
  document.getElementById('planRevealTools')?.addEventListener('click',()=>{
    document.body.classList.add('plan-tools-open');
    const b=document.getElementById('planRevealTools');if(b)b.textContent='Tools shown';
  });

  ['savePulse','weekCommit','saveCheckin'].forEach(id=>{
    document.getElementById(id)?.addEventListener('click',()=>setTimeout(renderExperience,80));
  });
  document.addEventListener('blueprint:week-updated',()=>setTimeout(renderExperience,0));

  const goalsBase=renderGoals;
  renderGoals=function(){const out=goalsBase.apply(this,arguments);renderExperience();return out};
  const experimentsBase=renderExperiments;
  renderExperiments=function(){const out=experimentsBase.apply(this,arguments);renderExperience();return out};

  window.BlueprintActivation={
    get:()=>({...activation,state:evidenceState()}),
    setExperience,
    reopen:openActivation
  };

  renderExperience();
  if(!activation.completed)setTimeout(openActivation,120);
})();