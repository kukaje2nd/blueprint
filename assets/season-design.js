(()=>{
  const KEY='bp-season-design-v40';
  const $id=id=>document.getElementById(id);
  const clean=v=>String(v??'').trim();
  const defaults={
    name:profile?.seasonName||'Open season',
    posture:'mixed',
    intent:profile?.seasonIntent||'',
    success:[],
    protect:'',
    pause:profile?.seasonAnti||'',
    minimum:'',
    question:'',
    end:profile?.seasonEnd||''
  };
  let state={...defaults,...(store.get(KEY,{})||{})};
  state.success=Array.isArray(state.success)?state.success.slice(0,3):[];
  while(state.success.length<3)state.success.push('');

  function guideNow(){return (store.get('bp-guide-items-v30',[])||[]).filter(x=>x.stage==='now').slice(0,5)}
  function postureLabel(v){return ({build:'Build',maintain:'Maintain',recover:'Recover',connect:'Connect',explore:'Explore',mixed:'Mixed'})[v]||'Mixed'}
  function hydrate(){
    if(!$id('seasonDesignCard'))return;
    $id('seasonDesignName').value=state.name||'';
    $id('seasonDesignEnd').value=state.end||'';
    $id('seasonDesignIntent').value=state.intent||'';
    [1,2,3].forEach(i=>$id('seasonSuccess'+i).value=state.success[i-1]||'');
    $id('seasonDesignProtect').value=state.protect||'';
    $id('seasonDesignPause').value=state.pause||'';
    $id('seasonDesignMinimum').value=state.minimum||'';
    $id('seasonDesignQuestion').value=state.question||'';
    render();
  }
  function read(){
    state={
      ...state,
      name:clean($id('seasonDesignName')?.value)||'Open season',
      end:clean($id('seasonDesignEnd')?.value),
      intent:clean($id('seasonDesignIntent')?.value),
      success:[1,2,3].map(i=>clean($id('seasonSuccess'+i)?.value)),
      protect:clean($id('seasonDesignProtect')?.value),
      pause:clean($id('seasonDesignPause')?.value),
      minimum:clean($id('seasonDesignMinimum')?.value),
      question:clean($id('seasonDesignQuestion')?.value)
    };
    return state;
  }
  function renderGuide(){
    const root=$id('seasonGuideSuggestions'),items=guideNow();if(!root)return;
    $id('seasonGuideBridgeTitle').textContent=items.length?items.length+' Life Guide item'+(items.length===1?' is':'s are')+' in Now.':'Nothing has to become a season priority.';
    root.innerHTML=items.length?items.map(x=>'<button type="button" data-season-guide="'+escapeHTML(x.id)+'">'+escapeHTML(x.title)+'<small>'+escapeHTML((x.kind||'item')+' · '+(x.area||'Personal'))+'</small></button>').join(''):'<small>Move something into Life Guide → Now only when it deserves present attention.</small>';
  }
  function render(){
    if(!$id('seasonDesignCard'))return;
    document.querySelectorAll('[data-season-posture]').forEach(b=>b.classList.toggle('active',b.dataset.seasonPosture===state.posture));
    const meaningful=state.success.filter(Boolean),bits=[postureLabel(state.posture)];
    if(meaningful.length)bits.push(meaningful.length+' success condition'+(meaningful.length===1?'':'s'));
    if(state.protect)bits.push('protected condition');
    if(state.pause)bits.push('not-now boundary');
    $id('seasonSummaryTitle').textContent=state.name||'Open season';
    $id('seasonSummaryCopy').textContent=state.intent||'Add only enough structure to make the next few weeks easier to steer.';
    $id('seasonSummaryChips').innerHTML=bits.map(x=>'<span>'+escapeHTML(x)+'</span>').join('');
    $id('seasonDesignState').textContent=(meaningful.length||state.intent)?'shaped':'open shape';
    const carry=[];
    meaningful.forEach((x,i)=>carry.push(['Success '+(i+1),x]));
    if(state.protect)carry.push(['Protect',state.protect]);
    if(state.minimum)carry.push(['Fallback',state.minimum]);
    $id('seasonCarryList').innerHTML=carry.length?carry.map(x=>'<div><span>'+escapeHTML(x[0])+'</span><strong>'+escapeHTML(x[1])+'</strong></div>').join(''):'<div><span>Open</span><strong>Nothing needs to carry into the week yet.</strong></div>';
    $id('seasonCarryCopy').textContent=meaningful.length?'Week Design can inherit these conditions without claiming calendar time.':'Shape the season only when a longer horizon would actually make weekly choices easier.';
    renderGuide();
  }
  function save(show=true){
    read();
    store.set(KEY,state);
    profile={...profile,seasonName:state.name,seasonIntent:state.intent||profile.seasonIntent,seasonAnti:state.pause||profile.seasonAnti,seasonEnd:state.end||profile.seasonEnd};
    store.set('bp-profile-v5',profile);
    try{renderTemporal?.()}catch{}
    document.dispatchEvent(new CustomEvent('blueprint:season-updated',{detail:{...state}}));
    render();
    if(show)showToast('Season Design saved');
  }
  function seedFromGuide(){
    const items=guideNow();if(!items.length){showToast('Life Guide has no Now items to bring in');return}
    const values=[1,2,3].map(i=>clean($id('seasonSuccess'+i)?.value));
    items.forEach(item=>{const slot=values.findIndex(x=>!x);if(slot>=0)values[slot]=item.title});
    values.forEach((v,i)=>$id('seasonSuccess'+(i+1)).value=v);
    read();render();showToast('Brought Life Guide items into the season draft');
  }
  function seedWeek(){
    save(false);
    const snap=window.BlueprintWeek?.getViewed?.();if(!snap?.plan){showToast('Week Design is not ready yet');return}
    const p=snap.plan;p.success=Array.isArray(p.success)?p.success:['','',''];
    while(p.success.length<3)p.success.push('');
    state.success.filter(Boolean).forEach((x,i)=>{if(!p.success[i])p.success[i]=x});
    if(!p.mode||p.mode==='mixed')p.mode=state.posture;
    if(!p.minimum&&state.minimum)p.minimum=state.minimum;
    window.BlueprintWeek.saveViewed?.();
    showToast('Season shape brought into Week Design');
    go('week');
  }

  document.addEventListener('click',e=>{
    const p=e.target.closest('[data-season-posture]');if(p){state.posture=p.dataset.seasonPosture;render();return}
    const g=e.target.closest('[data-season-guide]');if(g){const item=guideNow().find(x=>String(x.id)===String(g.dataset.seasonGuide));if(!item)return;const values=[1,2,3].map(i=>clean($id('seasonSuccess'+i)?.value));const slot=values.findIndex(x=>!x);if(slot<0){showToast('All three season conditions are already used');return}$id('seasonSuccess'+(slot+1)).value=item.title;read();render();return}
  });
  $id('seedSeasonFromGuide')?.addEventListener('click',seedFromGuide);
  $id('saveSeasonDesign')?.addEventListener('click',()=>save(true));
  $id('saveSeasonDesignTop')?.addEventListener('click',()=>save(true));
  $id('seasonToWeek')?.addEventListener('click',seedWeek);
  document.addEventListener('blueprint:guide-updated',renderGuide);

  if(typeof pageMeta!=='undefined'&&pageMeta.trajectory){
    pageMeta.trajectory.name='Season Design';
    pageMeta.trajectory.summary='Shape a temporary horizon around what matters, what to protect, what can pause, and what a smaller viable season still preserves.';
  }
  if(typeof renderSecondaryNav==='function')renderSecondaryNav(typeof currentPage==='string'?currentPage:'today');
  hydrate();
})();