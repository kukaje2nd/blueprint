(()=>{
  const RHYTHM_KEY='bp-rhythms-v28';
  const RULE_KEY='bp-choice-rules-v28';
  let rhythms=store.get(RHYTHM_KEY,[])||[];
  let rules=store.get(RULE_KEY,[])||[];

  const $id=id=>document.getElementById(id);
  const uid=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  const esc=v=>escapeHTML(String(v??''));
  const cadenceLabel={daily:'Daily',weekdays:'Weekdays',mwf:'Mon / Wed / Fri',weekends:'Weekends',weekly:'Once a week',flexible:'Flexible'};
  const windowLabel={morning:'Morning',day:'Daytime',evening:'Evening',any:'Any time'};
  const policyLabel={protect:'Protect',move:'Move freely',optional:'Optional'};
  const cadenceDays={
    daily:[0,1,2,3,4,5,6],
    weekdays:[0,1,2,3,4],
    mwf:[0,2,4],
    weekends:[5,6],
    weekly:[7],
    flexible:[7]
  };

  function persist(){
    store.set(RHYTHM_KEY,rhythms);
    store.set(RULE_KEY,rules);
    document.dispatchEvent(new CustomEvent('blueprint:rhythms-updated'));
  }
  function openModal(id){
    const el=$id(id);if(!el)return;
    el.classList.add('open');el.setAttribute('aria-hidden','false');
  }
  function closeModal(id){
    const el=$id(id);if(!el)return;
    el.classList.remove('open');el.setAttribute('aria-hidden','true');
  }
  function scheduleAnchorCount(){
    return (schedules||[]).length;
  }
  function posture(){
    const protectedCount=rhythms.filter(x=>x.policy==='protect').length;
    if(!rhythms.length)return {title:'Open',meta:'structure can stay light'};
    if(protectedCount>=4||rhythms.length>=7)return {title:'Structured',meta:'check whether every rhythm still reduces friction'};
    if(protectedCount>=2)return {title:'Anchored',meta:'a few things are worth defending'};
    return {title:'Flexible',meta:'defaults exist without filling the week'};
  }
  function renderOverview(){
    $id('rhythmCount').textContent=rhythms.length;
    $id('choiceRuleCount').textContent=rules.length;
    $id('rhythmAnchorCount').textContent=scheduleAnchorCount();
    const p=posture();$id('rhythmPosture').textContent=p.title;$id('rhythmPostureMeta').textContent=p.meta;
  }
  function rhythmCard(x){
    const min=x.minimum?'<div class="rhythm-min"><span>Minimum version</span><strong>'+esc(x.minimum)+'</strong></div>':'';
    return '<article class="card rhythm-card-v28" data-rhythm-id="'+esc(x.id)+'">'+
      '<div class="rhythm-card-v28-head"><div><span>'+esc(x.area)+' · '+esc(cadenceLabel[x.cadence]||x.cadence)+'</span><h3>'+esc(x.title)+'</h3></div><b class="rhythm-policy '+esc(x.policy)+'">'+esc(policyLabel[x.policy]||x.policy)+'</b></div>'+
      '<p>'+(x.purpose?esc(x.purpose):'No purpose statement yet. Keep this only if it actually reduces friction.')+'</p>'+
      '<div class="rhythm-meta"><span>'+esc(windowLabel[x.window]||x.window)+'</span><span>'+esc(cadenceLabel[x.cadence]||x.cadence)+'</span></div>'+
      min+
      '<footer><button class="soft-btn" data-use-rhythm="'+esc(x.id)+'">Use today</button><button class="text-link" data-edit-rhythm="'+esc(x.id)+'">Edit →</button></footer>'+
      '</article>';
  }
  function renderRhythms(){
    const root=$id('rhythmList');if(!root)return;
    if(!rhythms.length){
      root.innerHTML='<div class="rhythm-empty"><div><strong>No rhythms yet.</strong><p>Start with something that genuinely reduces decisions: a recurring walk, protected writing window, family dinner, training rhythm, or shutdown boundary.</p></div><button class="soft-btn" data-rhythm-example="walk">Try an example</button></div>';
      return;
    }
    root.innerHTML=rhythms.map(rhythmCard).join('');
  }
  function ruleCard(x){
    return '<article class="choice-rule-card" data-rule-id="'+esc(x.id)+'"><span>When</span><strong>'+esc(x.trigger)+'</strong><i>→</i><span>Choose</span><b>'+esc(x.choice)+'</b>'+(x.reason?'<small>'+esc(x.reason)+'</small>':'')+'<footer><button class="soft-btn" data-use-rule="'+esc(x.id)+'">Use today</button><button class="text-link" data-edit-rule="'+esc(x.id)+'">Edit →</button></footer></article>';
  }
  function renderRules(){
    const root=$id('choiceRuleList');if(!root)return;
    root.innerHTML=rules.length?rules.map(ruleCard).join(''):'<div class="choice-rule-empty"><strong>No choice rules yet.</strong><span>Useful defaults often start with “When…” and remove a recurring decision.</span></div>';
  }
  function scheduleDays(s){
    return Array.isArray(s.days)?s.days.map(Number).filter(n=>n>=0&&n<=6):[];
  }
  function renderWeeklyMap(){
    const root=$id('weeklyRhythmGrid');if(!root)return;
    const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Any'];
    const buckets=Array.from({length:8},()=>({rhythms:[],anchors:[]}));
    rhythms.forEach(r=>{
      (cadenceDays[r.cadence]||[7]).forEach(i=>buckets[i].rhythms.push(r));
    });
    (schedules||[]).forEach(s=>scheduleDays(s).forEach(i=>buckets[i].anchors.push(s)));
    root.innerHTML=days.map((day,i)=>{
      const b=buckets[i];
      const items=[
        ...b.anchors.map(x=>'<span class="weekly-shape-item anchor"><i></i>'+esc(x.title)+'</span>'),
        ...b.rhythms.map(x=>'<span class="weekly-shape-item rhythm '+esc(x.policy)+'"><i></i>'+esc(x.title)+'</span>')
      ].join('');
      return '<div class="weekly-shape-day"><strong>'+day+'</strong><div>'+items+(items?'':'<span class="weekly-shape-open">open</span>')+'</div></div>';
    }).join('');
    const total=rhythms.length+scheduleAnchorCount();
    $id('weeklyRhythmMeta').textContent=total?(rhythms.length+' rhythms · '+scheduleAnchorCount()+' fixed anchors'):'nothing repeating yet';
  }
  function render(){renderOverview();renderRhythms();renderRules();renderWeeklyMap()}

  function resetRhythmForm(){
    $id('rhythmId').value='';$id('rhythmTitle').value='';$id('rhythmArea').value='Personal';$id('rhythmCadence').value='weekdays';$id('rhythmWindow').value='morning';$id('rhythmPolicy').value='move';$id('rhythmPurpose').value='';$id('rhythmMinimum').value='';
    $id('rhythmEditorTitle').textContent='New rhythm';$id('deleteRhythm').hidden=true;
  }
  function editRhythm(id){
    const x=rhythms.find(r=>r.id===id);if(!x)return;
    $id('rhythmId').value=x.id;$id('rhythmTitle').value=x.title||'';$id('rhythmArea').value=x.area||'Personal';$id('rhythmCadence').value=x.cadence||'weekdays';$id('rhythmWindow').value=x.window||'morning';$id('rhythmPolicy').value=x.policy||'move';$id('rhythmPurpose').value=x.purpose||'';$id('rhythmMinimum').value=x.minimum||'';
    $id('rhythmEditorTitle').textContent='Edit rhythm';$id('deleteRhythm').hidden=false;openModal('rhythmEditor');
  }
  function resetRuleForm(){
    $id('choiceRuleId').value='';$id('choiceRuleTrigger').value='';$id('choiceRuleChoice').value='';$id('choiceRuleReason').value='';$id('choiceRuleEditorTitle').textContent='New choice rule';$id('deleteChoiceRule').hidden=true;
  }
  function editRule(id){
    const x=rules.find(r=>r.id===id);if(!x)return;
    $id('choiceRuleId').value=x.id;$id('choiceRuleTrigger').value=x.trigger||'';$id('choiceRuleChoice').value=x.choice||'';$id('choiceRuleReason').value=x.reason||'';
    $id('choiceRuleEditorTitle').textContent='Edit choice rule';$id('deleteChoiceRule').hidden=false;openModal('choiceRuleEditor');
  }
  function useRhythm(id){
    const x=rhythms.find(r=>r.id===id),api=window.BlueprintDayDesign;if(!x||!api)return;
    const d=api.getToday(),support=x.minimum?x.title+' · minimum: '+x.minimum:x.title;
    d.supports=[...new Set([...(d.supports||[]),support])].slice(0,6);
    api.saveToday(d);api.render();go('today');setTimeout(()=>document.getElementById('dayDesignCard')?.scrollIntoView({behavior:'smooth',block:'start'}),70);showToast('Rhythm added as today’s support');
  }
  function useRule(id){
    const x=rules.find(r=>r.id===id),api=window.BlueprintDayDesign;if(!x||!api)return;
    const d=api.getToday();d.choiceRule='When '+x.trigger+', '+x.choice.replace(/^./,c=>c.toLowerCase());api.saveToday(d);api.render();go('today');setTimeout(()=>document.getElementById('dayChoiceRule')?.focus(),180);showToast('Choice rule added to today');
  }

  $id('newRhythmButton')?.addEventListener('click',()=>{resetRhythmForm();openModal('rhythmEditor');setTimeout(()=>$id('rhythmTitle')?.focus(),50)});
  $id('closeRhythmEditor')?.addEventListener('click',()=>closeModal('rhythmEditor'));
  $id('newChoiceRuleButton')?.addEventListener('click',()=>{resetRuleForm();openModal('choiceRuleEditor');setTimeout(()=>$id('choiceRuleTrigger')?.focus(),50)});
  $id('closeChoiceRuleEditor')?.addEventListener('click',()=>closeModal('choiceRuleEditor'));
  ['rhythmEditor','choiceRuleEditor'].forEach(id=>$id(id)?.addEventListener('click',e=>{if(e.target.id===id)closeModal(id)}));

  $id('rhythmForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const id=$id('rhythmId').value||uid('rhythm');
    const item={id,title:$id('rhythmTitle').value.trim(),area:$id('rhythmArea').value,cadence:$id('rhythmCadence').value,window:$id('rhythmWindow').value,policy:$id('rhythmPolicy').value,purpose:$id('rhythmPurpose').value.trim(),minimum:$id('rhythmMinimum').value.trim(),updatedAt:new Date().toISOString()};
    const i=rhythms.findIndex(x=>x.id===id);if(i>=0)rhythms[i]=item;else rhythms.push(item);
    persist();render();closeModal('rhythmEditor');showToast(i>=0?'Rhythm updated':'Rhythm created');
  });
  $id('deleteRhythm')?.addEventListener('click',()=>{
    const id=$id('rhythmId').value;if(!id)return;
    rhythms=rhythms.filter(x=>x.id!==id);persist();render();closeModal('rhythmEditor');showToast('Rhythm removed');
  });
  $id('choiceRuleForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const id=$id('choiceRuleId').value||uid('rule');
    const item={id,trigger:$id('choiceRuleTrigger').value.trim(),choice:$id('choiceRuleChoice').value.trim(),reason:$id('choiceRuleReason').value.trim(),updatedAt:new Date().toISOString()};
    const i=rules.findIndex(x=>x.id===id);if(i>=0)rules[i]=item;else rules.push(item);
    persist();render();closeModal('choiceRuleEditor');showToast(i>=0?'Choice rule updated':'Choice rule created');
  });
  $id('deleteChoiceRule')?.addEventListener('click',()=>{
    const id=$id('choiceRuleId').value;if(!id)return;
    rules=rules.filter(x=>x.id!==id);persist();render();closeModal('choiceRuleEditor');showToast('Choice rule removed');
  });
  $id('rhythmList')?.addEventListener('click',e=>{
    const edit=e.target.closest('[data-edit-rhythm]'),use=e.target.closest('[data-use-rhythm]'),example=e.target.closest('[data-rhythm-example]');
    if(edit){editRhythm(edit.dataset.editRhythm);return}
    if(use){useRhythm(use.dataset.useRhythm);return}
    if(example){
      resetRhythmForm();$id('rhythmTitle').value='Walk after lunch';$id('rhythmArea').value='Health';$id('rhythmCadence').value='weekdays';$id('rhythmWindow').value='day';$id('rhythmPolicy').value='move';$id('rhythmPurpose').value='Create a reliable transition away from screens and give the afternoon a cleaner second start.';$id('rhythmMinimum').value='10 minutes outside';openModal('rhythmEditor');
    }
  });
  $id('choiceRuleList')?.addEventListener('click',e=>{
    const edit=e.target.closest('[data-edit-rule]'),use=e.target.closest('[data-use-rule]');
    if(edit)editRule(edit.dataset.editRule);else if(use)useRule(use.dataset.useRule);
  });
  document.addEventListener('blueprint:week-updated',renderWeeklyMap);
  document.addEventListener('blueprint:rhythms-updated',()=>window.renderPlan?.());

  window.BlueprintRhythms={get:()=>rhythms,getRules:()=>rules,render,useRhythm,useRule};
  render();
})();