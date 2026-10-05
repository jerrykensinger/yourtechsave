(function(){
  const form=document.getElementById('quickCheckForm');
  if(!form)return;

  const steps=[...form.querySelectorAll('.quick-step')];
  const bar=document.getElementById('quickProgressBar');
  const progressLabel=document.getElementById('quickProgressLabel');
  const progressCount=document.getElementById('quickProgressCount');
  let current=0;
  let started=false;
  let completed=false;

  const labels=['Ready to start','Household','Wireless','Internet','TV, streaming & protection','Results'];
  const progress=[0,25,50,75,100,100];
  const counts=['0 of 4','1 of 4','2 of 4','3 of 4','4 of 4','Complete'];

  function money(n){
    return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);
  }
  function numberValue(id){
    return Math.max(0,parseFloat(document.getElementById(id)?.value||'0')||0);
  }
  function checkedValue(name){
    return form.querySelector('input[name="'+name+'"]:checked')?.value||'';
  }
  function show(i){
    current=Math.max(0,Math.min(steps.length-1,i));
    steps.forEach((step,index)=>step.classList.toggle('active',index===current));
    if(bar)bar.style.width=progress[current]+'%';
    if(progressLabel)progressLabel.textContent=labels[current];
    if(progressCount)progressCount.textContent=counts[current];
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function beginIfNeeded(){
    if(started)return;
    started=true;
    if(window.ytsTrack)window.ytsTrack('checkup_start',{checkup_type:'quick_90_second'});
  }

  form.querySelectorAll('[data-next]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      beginIfNeeded();
      show(current+1);
    });
  });
  form.querySelectorAll('[data-prev]').forEach(btn=>btn.addEventListener('click',()=>show(current-1)));

  const none=document.getElementById('extrasNone');
  const extraBoxes=[...form.querySelectorAll('input[name="extras"]')];
  extraBoxes.forEach(box=>{
    box.addEventListener('change',()=>{
      if(box===none&&box.checked){
        extraBoxes.forEach(other=>{if(other!==none)other.checked=false;});
      }else if(box!==none&&box.checked&&none){
        none.checked=false;
      }
    });
  });

  function makeOpportunity(type,score,title,summary,detail,href,cta,badge){
    return {type:type,score:score,title:title,summary:summary,detail:detail,href:href,cta:cta,badge:badge};
  }

  function buildResults(){
    const lines=Math.max(1,parseInt(checkedValue('lines')||'1',10));
    const provider=checkedValue('wirelessProvider');
    const wireless=numberValue('quickWirelessCost');
    const deviceIncluded=checkedValue('deviceIncluded');
    const internetProvider=document.getElementById('quickInternetProvider')?.value||'';
    const internet=numberValue('quickInternetCost');
    const internetHappy=checkedValue('internetHappy');
    const extras=extraBoxes.filter(b=>b.checked&&b!==none).map(b=>b.value);
    const extrasCost=numberValue('quickExtrasCost');
    const total=wireless+internet+extrasCost;
    const perLine=wireless?wireless/lines:0;

    document.getElementById('quickMonthlyTotal').textContent=total?money(total):'Not enough entered';

    let wirelessScore=1;
    if(perLine>=55)wirelessScore=4;
    else if(perLine>=40)wirelessScore=3;
    else if(perLine>=28)wirelessScore=2;
    if(deviceIncluded==='yes'&&wirelessScore>1)wirelessScore-=0.5;

    let wirelessSummary=wireless ? 'About '+money(perLine)+' per line each month' : (provider ? provider+' selected' : 'Wireless details were limited');
    let wirelessDetail='';
    if(deviceIncluded==='yes') wirelessDetail='Your estimate may include phone financing, so separate service from device payments before comparing carriers.';
    else if(perLine>=40) wirelessDetail='Your current cost per line is worth benchmarking against lower-cost and alternative-network options.';
    else wirelessDetail='A quick benchmark can confirm whether your current plan still fits your line count, network and feature needs.';

    let internetScore=1;
    if(internet>=110)internetScore=4;
    else if(internet>=80)internetScore=3;
    else if(internet>=60)internetScore=2;
    if(internetHappy==='no')internetScore+=1.5;
    else if(internetHappy==='mostly')internetScore+=0.5;

    let internetSummary=internet ? money(internet)+'/month'+(internetProvider?' with '+internetProvider:'') : (internetProvider||'Home internet details were limited');
    let internetDetail=internetHappy==='no'
      ? 'Because you are not happy with speed or reliability, compare both price and connection type before paying for a faster tier.'
      : 'Check whether your current price, speed tier and connection type still match how your household uses the service.';

    let extrasScore=0.5;
    if(extrasCost>=90)extrasScore=4;
    else if(extrasCost>=50)extrasScore=3;
    else if(extrasCost>0)extrasScore=2;
    if(extras.length>=3)extrasScore+=1;
    else if(extras.length>=1)extrasScore+=0.5;

    let extrasSummary=extras.length ? extras.join(', ') : 'No specific extras selected';
    if(extrasCost)extrasSummary+=' • about '+money(extrasCost)+'/month';
    const extrasDetail=extras.length
      ? 'Review recurring entertainment and protection costs before canceling anything. Start with the services you use least or duplicate elsewhere.'
      : 'If you have recurring TV, streaming, music or protection charges, a quick audit can uncover costs that are easy to overlook.';

    const opportunities=[
      makeOpportunity('wireless',wirelessScore,'Wireless',wirelessSummary,wirelessDetail,'/compare/plan-finder.html','Compare My Wireless Options','Wireless'),
      makeOpportunity('internet',internetScore,'Home internet',internetSummary,internetDetail,'/internet/finder.html','Review My Internet','Internet'),
      makeOpportunity('extras',extrasScore,'TV, streaming & protection',extrasSummary,extrasDetail,'/guides/streaming-subscription-audit.html','Review Subscriptions & Extras','Subscriptions')
    ].sort((a,b)=>b.score-a.score);

    document.getElementById('quickAreaCount').textContent=opportunities.length;
    const mount=document.getElementById('quickOpportunities');
    mount.innerHTML=opportunities.map((o,index)=>{
      const label=index===0?'Highest impact':(index===1?'Next':'Also worth checking');
      return '<article class="quick-opportunity '+(index===0?'featured':'')+'">'+
        '<div class="quick-opportunity-rank"><span>'+(index+1)+'</span><div><small>'+label+'</small><h3>'+o.title+'</h3></div></div>'+
        '<div class="quick-opportunity-summary">'+o.summary+'</div>'+
        '<p>'+o.detail+'</p>'+
        '<a class="btn '+(index===0?'btn-green':'btn-outline')+'" href="'+o.href+'">'+o.cta+' →</a>'+
      '</article>';
    }).join('');

    if(!completed){
      completed=true;
      if(window.ytsTrack)window.ytsTrack('checkup_complete',{checkup_type:'quick_90_second'});
    }
  }

  form.addEventListener('submit',e=>{
    e.preventDefault();
    beginIfNeeded();
    buildResults();
    show(steps.length-1);
  });

  document.getElementById('quickStartOver')?.addEventListener('click',()=>{
    form.reset();
    completed=false;
    started=false;
    show(0);
  });

  show(0);
})();