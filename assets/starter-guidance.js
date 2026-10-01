(()=>{
  const $id=id=>document.getElementById(id);
  const set=(id,value)=>{const el=$id(id);if(el)el.value=value??''};
  const click=(selector)=>document.querySelector(selector)?.click();
  const toast=msg=>typeof showToast==='function'&&showToast(msg);

  const guideExamples={
    direction:{
      title:'Make the next few weeks feel less scattered',
      kind:'direction',
      area:'Personal',
      why:'I want one direction to be easier to return to when the week gets noisy.',
      note:'This can stay broad until a clearer outcome emerges.'
    },
    commitment:{
      title:'Be fully present for one recurring family commitment',
      kind:'commitment',
      area:'Relationships',
      why:'I do not want important relationships to depend on leftover attention.',
      note:'Keep this visible before deciding whether it needs calendar protection.'
    },
    question:{
      title:'What kind of work gives me energy instead of only using it?',
      kind:'question',
      area:'Work',
      why:'I want to notice patterns before turning this into a career decision.',
      note:'Collect observations; no answer is required yet.'
    }
  };
  function loadGuide(kind){
    const x=guideExamples[kind];if(!x)return;
    window.BlueprintLifeGuide?.openNew?.('now');
    setTimeout(()=>{
      set('guideItemTitle',x.title);set('guideItemKind',x.kind);set('guideItemArea',x.area);
      set('guideItemStage','now');set('guideItemWhy',x.why);set('guideItemNote',x.note);
      $id('guideItemTitle')?.focus();
      toast('Example loaded as a draft — edit anything before saving');
    },50);
  }

  const dayExamples={
    focused:{intent:'build',success:['Finish one meaningful piece of work','Move my body once','End work with a clear stopping point'],boundary:'No new projects today',minimum:'Make one smaller but real move on the main work and stop on time.',rule:'Reduce scope before extending the day'},
    recovery:{intent:'recover',success:['Lower the pace','Eat and move in ways that feel restorative','Leave one block of unscheduled time'],boundary:'No catch-up marathon',minimum:'Do the essentials and protect recovery.',rule:'Choose recovery over optional output'},
    people:{intent:'connect',success:['Be present for one important conversation','Handle one necessary responsibility','Leave room to be unhurried'],boundary:'No multitasking during important conversations',minimum:'Show up well for the most important person or commitment.',rule:'Protect presence before squeezing in extra work'}
  };
  function loadDay(kind){
    const x=dayExamples[kind];if(!x)return;
    document.querySelectorAll('[data-day-intent]').forEach(b=>b.classList.toggle('active',b.dataset.dayIntent===x.intent));
    x.success.forEach((v,i)=>set('daySuccess'+(i+1),v));
    set('dayBoundary',x.boundary);set('dayMinimum',x.minimum);set('dayChoiceRule',x.rule);
    $id('daySuccess1')?.focus();
    toast('Day example loaded — save only if it fits');
  }

  const weekExamples={
    build:{mode:'build',promise:'Move one important outcome forward without filling every open hour.',success:['Ship one meaningful outcome','Keep two recovery windows intact','Finish the week with a clear next step'],boundary:'No second major project',minimum:'Make one real move on the main outcome and keep one recovery window.',choiceRule:'Protect the main outcome before optional work'},
    balanced:{mode:'mixed',promise:'Make progress while keeping the week livable.',success:['Move one meaningful work thread','Protect one relationship or home commitment','Keep enough recovery to avoid borrowing from next week'],boundary:'No automatic yes to optional commitments',minimum:'One meaningful move, one life commitment, and enough rest.',choiceRule:'Protect fixed commitments and recovery before adding more'},
    recovery:{mode:'recover',promise:'Use this week to restore capacity and keep only the essentials moving.',success:['Reduce optional load','Keep essential commitments reliable','Create two genuinely restorative windows'],boundary:'No new projects or catch-up sprints',minimum:'Do the essentials, communicate clearly, and leave margin.',choiceRule:'Recovery wins over optional output'}
  };
  function loadWeek(kind){
    const x=weekExamples[kind],snap=window.BlueprintWeek?.getViewed?.();if(!x||!snap?.plan)return;
    const p=snap.plan;
    p.mode=x.mode;p.promise=x.promise;p.success=[...x.success];p.boundary=x.boundary;p.minimum=x.minimum;p.choiceRule=x.choiceRule;p.committedAt=null;
    window.BlueprintWeek.saveViewed?.();
    window.BlueprintWeekDesign?.render?.();
    toast('Week starter applied — no calendar blocks were added');
  }

  const seasonExamples={
    build:{posture:'build',name:'Build something that matters',intent:'Give one important direction enough room to become real without letting everything else compete for equal priority.',success:['Move one meaningful outcome into the world','Keep health and relationships from becoming collateral damage','Finish with a clearer sense of what deserves the next season'],protect:'Two evenings each week that do not become overflow work',pause:'A second major initiative',minimum:'Make the main outcome meaningfully more real while protecting basic capacity.',question:'What deserves sustained effort when novelty wears off?'},
    recover:{posture:'recover',name:'Rebuild capacity',intent:'Use this period to make life feel more sustainable before asking for another push.',success:['Reduce avoidable overload','Restore a few dependable recovery conditions','Keep essential responsibilities steady'],protect:'Sleep, unhurried meals, and one low-demand block each week',pause:'New optimization projects',minimum:'Stop making the baseline harder and preserve the essentials.',question:'What actually restores me rather than merely distracting me?'},
    explore:{posture:'explore',name:'Explore without rushing the answer',intent:'Create enough space to test possibilities before committing to a narrow direction.',success:['Try a few bounded possibilities','Notice which work or relationships create energy','End with one clearer question or direction'],protect:'Unstructured time for curiosity',pause:'Premature long-term commitments',minimum:'Run one honest experiment and write down what changed.',question:'What becomes interesting when I stop demanding immediate certainty?'}
  };
  function loadSeason(kind){
    const x=seasonExamples[kind];if(!x)return;
    set('seasonDesignName',x.name);set('seasonDesignIntent',x.intent);
    x.success.forEach((v,i)=>set('seasonSuccess'+(i+1),v));
    set('seasonDesignProtect',x.protect);set('seasonDesignPause',x.pause);set('seasonDesignMinimum',x.minimum);set('seasonDesignQuestion',x.question);
    document.querySelectorAll('[data-season-posture]').forEach(b=>b.classList.toggle('active',b.dataset.seasonPosture===x.posture));
    $id('seasonDesignName')?.focus();
    toast('Season example loaded as a draft — save only what feels true');
  }

  document.addEventListener('click',e=>{
    const g=e.target.closest('[data-guide-starter]');if(g){loadGuide(g.dataset.guideStarter);return}
    const d=e.target.closest('[data-day-starter]');if(d){loadDay(d.dataset.dayStarter);return}
    const w=e.target.closest('[data-week-starter]');if(w){loadWeek(w.dataset.weekStarter);return}
    const s=e.target.closest('[data-season-starter]');if(s){loadSeason(s.dataset.seasonStarter)}
  });

  window.BlueprintGuidance={loadGuide,loadDay,loadWeek,loadSeason};
})();