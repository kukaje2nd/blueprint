(()=>{
  const DAY_NAMES=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const MODE_COPY={
    build:['Build','Concentrate effort around visible movement.'],
    maintain:['Maintain','Keep important systems moving without expanding the week.'],
    recover:['Recover','Restore capacity and reduce optional demands.'],
    connect:['Connect','Let people and shared life shape the week.'],
    explore:['Explore','Create room for learning, curiosity, and uncertain work.'],
    mixed:['Mixed','Hold a few different kinds of life without forcing one theme.']
  };
  const api=()=>window.BlueprintWeek;
  const viewed=()=>api()?.getViewed?.();
  const esc=v=>escapeHTML(String(v??''));
  const mins=n=>{n=Math.max(0,Math.round(Number(n)||0));if(!n)return'0h';const h=Math.floor(n/60),m=n%60;return ((h?h+'h':'')+(m?' '+m+'m':'')).trim()};

  function plan(){
    const v=viewed();if(!v)return null;
    const p=v.plan;
    p.mode=p.mode||'mixed';
    p.success=Array.isArray(p.success)?[...p.success.slice(0,3),...Array(3).fill('')].slice(0,3):['','',''];
    p.minimum=p.minimum||'';
    p.choiceRule=p.choiceRule||'';
    p.lightDay=p.lightDay===undefined?'':String(p.lightDay);
    return p;
  }
  function save(){
    api()?.saveViewed?.();
    document.dispatchEvent(new CustomEvent('blueprint:week-design-updated'));
  }
  function fixedReality(){
    const v=viewed();if(!v)return[];
    const dates=v.dates.map(d=>{
      const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
      return y+'-'+m+'-'+day;
    });
    const rows=[];
    (schedules||[]).forEach(s=>{
      (s.days||[]).forEach(di=>{
        const day=Number(di);if(day<0||day>6)return;
        rows.push({day,time:s.time||'09:00',title:s.title,source:'recurring'});
      });
    });
    (customEvents||[]).forEach(e=>{
      const day=dates.indexOf(e.date);if(day<0)return;
      rows.push({day,time:e.time||'09:00',title:e.title,source:e.weekComposerKey===v.key?'committed week':'calendar'});
    });
    const seen=new Set();
    return rows.sort((a,b)=>a.day-b.day||String(a.time).localeCompare(String(b.time))).filter(x=>{
      const key=x.day+'|'+x.time+'|'+String(x.title).toLowerCase();
      if(seen.has(key))return false;seen.add(key);return true;
    });
  }
  function renderMode(p){
    document.querySelectorAll('#weekModePicker [data-week-mode]').forEach(b=>b.classList.toggle('active',b.dataset.weekMode===p.mode));
  }
  function renderSuccess(p){
    p.success.forEach((value,i)=>{
      const el=document.getElementById('weekSuccess'+(i+1));
      if(el&&document.activeElement!==el)el.value=value||'';
    });
    const count=p.success.filter(Boolean).length;
    const out=document.getElementById('weekSuccessCount');if(out)out.textContent=count+' / 3 defined';
  }
  function renderFlex(p){
    const minimum=document.getElementById('weekMinimum');
    const rule=document.getElementById('weekChoiceRule');
    if(minimum&&document.activeElement!==minimum)minimum.value=p.minimum||'';
    if(rule&&document.activeElement!==rule)rule.value=p.choiceRule||'';
    const light=document.getElementById('weekLightDay'),v=viewed();
    if(light&&v){
      const current=light.value;
      light.innerHTML='<option value="">No designated light day</option>'+v.dates.map((d,i)=>'<option value="'+i+'">'+DAY_NAMES[i]+' · '+d.toLocaleDateString([],{month:'short',day:'numeric'})+'</option>').join('');
      light.value=p.lightDay!==undefined?p.lightDay:current;
    }
    const count=[p.boundary,p.minimum,p.choiceRule,p.lightDay!==''?'light':''].filter(Boolean).length;
    const state=document.getElementById('weekFlexState');if(state)state.textContent=count?count+' flexibility '+(count===1?'choice':'choices'):'open';
  }
  function renderReality(){
    const root=document.getElementById('weekRealityGrid'),v=viewed();if(!root||!v)return;
    const items=fixedReality(),count=document.getElementById('weekAnchorCount');
    if(count)count.textContent=items.length+' '+(items.length===1?'anchor':'anchors');
    root.innerHTML=v.dates.map((d,day)=>{
      const rows=items.filter(x=>x.day===day);
      return '<div class="week-reality-day"><header><span>'+DAY_NAMES[day]+'</span><strong>'+d.getDate()+'</strong></header><div>'+(rows.length?rows.map(x=>'<div class="week-reality-item"><time>'+esc(x.time)+'</time><strong>'+esc(x.title)+'</strong><small>'+esc(x.source)+'</small></div>').join(''):'<span class="week-reality-open">open</span>')+'</div></div>';
    }).join('');
  }
  function renderRhythms(){
    const root=document.getElementById('weekRhythmList');if(!root)return;
    const rhythms=window.BlueprintRhythms?.get?.()||store.get('bp-rhythms-v28',[])||[];
    if(!rhythms.length){
      root.innerHTML='<div class="week-day-empty">No recurring supports yet. Add rhythms only when they reduce decisions.</div>';
      return;
    }
    root.innerHTML=rhythms.slice(0,6).map(r=>'<div class="week-rhythm-row '+esc(r.policy||'move')+'"><i></i><span><strong>'+esc(r.title)+'</strong><small>'+esc((r.cadence||'flexible')+' · '+(r.window||'any time'))+'</small></span><em>'+esc(r.policy==='protect'?'protect':r.policy==='optional'?'optional':'move freely')+'</em></div>').join('');
  }
  function renderLightDay(p){
    const days=[...document.querySelectorAll('#weekCanvas .week-day')];
    days.forEach((el,i)=>{
      const light=String(i)===String(p.lightDay);
      el.classList.toggle('is-light-day',light);
      const meta=el.querySelector('.week-day-head em');
      if(light&&meta)meta.textContent='light day';
      const open=el.querySelector('.day-open');
      if(light&&open)open.textContent='keep the edges open';
      const empty=el.querySelector('.week-day-empty');
      if(light&&empty&&!el.querySelector('.week-block'))empty.innerHTML='Deliberately light.<br>Overflow does not live here.';
    });
  }
  function renderStory(p){
    const blocks=p.blocks||[],protectedM=blocks.reduce((a,b)=>a+(Number(b.duration)||0),0),success=p.success.filter(Boolean),anchors=fixedReality();
    const rhythms=window.BlueprintRhythms?.get?.()||store.get('bp-rhythms-v28',[])||[];
    let title='The week has room to breathe.';
    let copy='A useful week can be lightly structured: a few success conditions, visible constraints, and enough slack to revise the plan.';
    if(p.mode==='recover'){
      title='This week is designed to restore capacity.';
      copy='Let recovery be the primary architecture. Success conditions should be compatible with lower intensity, not secretly compete with it.';
    }else if(p.lightDay!==''&&protectedM>0){
      title=DAY_NAMES[Number(p.lightDay)]+' is carrying deliberate slack.';
      copy='Keep that day from becoming the automatic home for overflow. A light day only works if its openness is protected.';
    }else if(success.length&&anchors.length){
      title='Intent and reality are both visible.';
      copy='You have '+success.length+' success '+(success.length===1?'condition':'conditions')+', '+anchors.length+' fixed '+(anchors.length===1?'anchor':'anchors')+', and '+rhythms.length+' background '+(rhythms.length===1?'rhythm':'rhythms')+'. Protected blocks should serve that shape—not replace it.';
    }
    const h=document.getElementById('weekStoryTitle'),c=document.getElementById('weekStoryCopy');
    if(h)h.textContent=title;if(c)c.textContent=copy;
  }
  function renderBridge(p){
    const title=document.getElementById('todayWeekPromise'),meta=document.getElementById('todayWeekCapacity');if(!title||!meta)return;
    const success=p.success.filter(Boolean),used=(p.blocks||[]).reduce((a,b)=>a+(Number(b.duration)||0),0),cap=(Number(p.capacity)||18)*60;
    title.textContent=p.promise||success[0]||((p.blocks||[]).length?((p.blocks||[]).length+' protected blocks this week.'):'Your week is still open.');
    const parts=[mins(used)+' protected',Math.max(0,Math.round((cap-used)/60*10)/10)+'h guardrail left'];
    if(p.lightDay!=='')parts.push(DAY_NAMES[Number(p.lightDay)]+' kept light');
    if(p.minimum)parts.push('fallback defined');
    if(p.committedAt)parts.push('committed');
    meta.textContent=parts.join(' · ');
  }
  function render(){
    const p=plan();if(!p)return;
    renderMode(p);renderSuccess(p);renderFlex(p);renderReality();renderRhythms();renderLightDay(p);renderStory(p);renderBridge(p);
  }
  function updateField(mutator){
    const p=plan();if(!p)return;
    mutator(p);p.committedAt=null;save();
  }
  function seedFromSystem(){
    setTimeout(()=>{
      const p=plan();if(!p)return;
      const ownedGoals=(typeof goals!=='undefined'&&Array.isArray(goals))?goals:[];
      let changed=false;
      if(!p.success[0]&&ownedGoals[0]){p.success[0]=ownedGoals[0].title;changed=true}
      if(!p.minimum){
        p.minimum=p.success[0]?'Make a smaller but real move on '+p.success[0].toLowerCase()+', keep one recovery window, and let the rest flex.':'Protect one meaningful move and enough recovery to stay adaptable.';
        changed=true;
      }
      if(!p.choiceRule){p.choiceRule='Protect sleep and existing commitments before adding optional evening work.';changed=true}
      if(changed){p.committedAt=null;save()}
    },0);
  }

  document.getElementById('weekModePicker')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-week-mode]');if(!b)return;
    updateField(p=>p.mode=b.dataset.weekMode);
  });
  [1,2,3].forEach(i=>document.getElementById('weekSuccess'+i)?.addEventListener('change',e=>updateField(p=>p.success[i-1]=e.target.value.trim())));
  document.getElementById('weekMinimum')?.addEventListener('change',e=>updateField(p=>p.minimum=e.target.value.trim()));
  document.getElementById('weekChoiceRule')?.addEventListener('change',e=>updateField(p=>p.choiceRule=e.target.value.trim()));
  document.getElementById('weekLightDay')?.addEventListener('change',e=>updateField(p=>p.lightDay=e.target.value));
  document.getElementById('weekBoundary')?.addEventListener('change',()=>setTimeout(render,0));
  document.getElementById('weekAutoCompose')?.addEventListener('click',seedFromSystem);
  document.addEventListener('blueprint:week-updated',()=>setTimeout(render,0));
  document.addEventListener('blueprint:rhythms-updated',()=>setTimeout(render,0));

  window.BlueprintWeekDesign={render,get:plan,fixedReality};
  render();
})();