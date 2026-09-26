(()=>{
  const KEY='bp-day-design-v27';
  const pad=n=>String(n).padStart(2,'0');
  const ymdLocal=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const todayKey=()=>ymdLocal(new Date());
  const empty=()=>({date:todayKey(),intent:'build',success:['','',''],supports:[],boundary:'',minimum:'',choiceRule:'',updatedAt:null});
  const all=()=>store.get(KEY,{})||{};
  const getToday=()=>({...empty(),...(all()[todayKey()]||{})});
  const saveToday=design=>{
    const map=all();
    map[todayKey()]={...design,date:todayKey(),updatedAt:new Date().toISOString()};
    store.set(KEY,map);
    document.dispatchEvent(new CustomEvent('blueprint:day-design-updated',{detail:{design:map[todayKey()]}}));
    return map[todayKey()];
  };
  const esc=v=>escapeHTML(String(v??''));
  const setText=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};

  function anchors(){
    if(window.renderAdaptiveToday&&window.BlueprintToday?.blocks)return window.BlueprintToday.blocks();
    const d=new Date(),di=d.getDay()===0?6:d.getDay()-1,date=todayKey();
    const recurring=(schedules||[]).filter(x=>Array.isArray(x.days)&&x.days.includes(di)).map(x=>({title:x.title,time:x.time||'09:00',source:'rhythm'}));
    const oneOff=(customEvents||[]).filter(x=>x.date===date).map(x=>({title:x.title,time:x.time||'09:00',source:x.weekComposerId?'weekly plan':'calendar'}));
    return [...recurring,...oneOff].sort((a,b)=>String(a.time).localeCompare(String(b.time)));
  }
  function renderAnchors(){
    const root=document.getElementById('dayDesignAnchors');if(!root)return;
    const items=anchors();
    root.innerHTML=items.length?items.slice(0,6).map(x=>'<div class="day-anchor"><time>'+esc(x.time)+'</time><strong>'+esc(x.title)+'</strong><span>'+esc(x.source)+'</span></div>').join(''):'<div class="day-design-empty"><strong>Nothing is fixed yet.</strong><span>Open space is allowed. Add a calendar block only when something deserves protection.</span></div>';
    setText('dayDesignAnchorCount',items.length+' '+(items.length===1?'anchor':'anchors'));
  }
  function renderSupports(design){
    const root=document.getElementById('daySupportList');if(!root)return;
    root.innerHTML=design.supports.length?design.supports.map((x,i)=>'<button type="button" class="support-chip" data-remove-support="'+i+'"><span>'+esc(x)+'</span><i>×</i></button>').join(''):'<span class="support-empty">No supports chosen. That can be fine.</span>';
  }
  function render(){
    const d=getToday();
    document.querySelectorAll('[data-day-intent]').forEach(b=>b.classList.toggle('active',b.dataset.dayIntent===d.intent));
    (d.success||[]).slice(0,3).forEach((v,i)=>{const el=document.getElementById('daySuccess'+(i+1));if(el&&document.activeElement!==el)el.value=v||''});
    const boundary=document.getElementById('dayBoundary');if(boundary&&document.activeElement!==boundary)boundary.value=d.boundary||'';
    const minimum=document.getElementById('dayMinimum');if(minimum&&document.activeElement!==minimum)minimum.value=d.minimum||'';
    const rule=document.getElementById('dayChoiceRule');if(rule&&document.activeElement!==rule)rule.value=d.choiceRule||'';
    setText('dayDesignState',d.updatedAt?'designed today':'open shape');
    renderSupports(d);renderAnchors();
  }
  function readForm(){
    const current=getToday();
    return {
      ...current,
      intent:document.querySelector('[data-day-intent].active')?.dataset.dayIntent||current.intent||'build',
      success:[1,2,3].map(i=>document.getElementById('daySuccess'+i)?.value.trim()||''),
      boundary:document.getElementById('dayBoundary')?.value.trim()||'',
      minimum:document.getElementById('dayMinimum')?.value.trim()||'',
      choiceRule:document.getElementById('dayChoiceRule')?.value.trim()||''
    };
  }
  function saveFromForm({quiet=false}={}){
    const d=saveToday(readForm());render();
    if(!quiet)showToast('Day shape saved');
    return d;
  }
  document.getElementById('dayIntentPicker')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-day-intent]');if(!b)return;
    document.querySelectorAll('[data-day-intent]').forEach(x=>x.classList.toggle('active',x===b));
    saveFromForm({quiet:true});
  });
  document.getElementById('saveDayDesign')?.addEventListener('click',()=>saveFromForm());
  document.getElementById('addDaySupport')?.addEventListener('click',()=>{
    const input=document.getElementById('daySupportInput'),value=input?.value.trim();if(!value)return;
    const d=readForm();if(!d.supports.includes(value))d.supports=[...d.supports,value].slice(0,6);
    if(input)input.value='';saveToday(d);render();showToast('Support added');
  });
  document.getElementById('daySupportInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();document.getElementById('addDaySupport')?.click()}});
  document.getElementById('daySupportList')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-remove-support]');if(!b)return;
    const d=readForm();d.supports=d.supports.filter((_,i)=>i!==Number(b.dataset.removeSupport));saveToday(d);render();
  });
  document.getElementById('clearDayDesign')?.addEventListener('click',()=>{
    const map=all();delete map[todayKey()];store.set(KEY,map);render();document.dispatchEvent(new CustomEvent('blueprint:day-design-updated',{detail:{design:getToday()}}));showToast('Today is open again');
  });
  document.addEventListener('blueprint:week-updated',()=>setTimeout(renderAnchors,0));
  window.BlueprintDayDesign={getToday,saveToday,render,exists:()=>!!getToday().updatedAt,anchors};
  render();
  window.renderAdaptiveToday?.();
})();