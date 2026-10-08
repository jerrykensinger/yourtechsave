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

  const wirelessDataPromise=fetch('/data/wireless-providers.json',{cache:'no-store'})
    .then(r=>r.ok?r.json():Promise.reject(new Error('provider data unavailable')))
    .catch(()=>null);

  function money(n){
    return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);
  }
  function moneyPerLine(n){
    return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2}).format(n||0);
  }
  function numberValue(id){
    return Math.max(0,parseFloat(document.getElementById(id)?.value||'0')||0);
  }
  function checkedValue(name){
    return form.querySelector('input[name="'+name+'"]:checked')?.value||'';
  }
  function normalizeName(value){
    return String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  }
  function formatDate(iso){
    const d=new Date(iso+'T12:00:00');
    if(Number.isNaN(d.getTime()))return iso;
    return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d);
  }
  function daysOld(iso){
    const d=new Date(iso+'T00:00:00');
    if(Number.isNaN(d.getTime()))return Infinity;
    return Math.floor((Date.now()-d.getTime())/86400000);
  }
  function show(i,moveFocus=true){
    current=Math.max(0,Math.min(steps.length-1,i));
    steps.forEach((step,index)=>step.classList.toggle('active',index===current));
    if(bar)bar.style.width=progress[current]+'%';
    if(progressLabel)progressLabel.textContent=labels[current];
    if(progressCount)progressCount.textContent=counts[current];
    window.scrollTo({top:0,behavior:'smooth'});
    if(moveFocus){
      const heading=steps[current]?.querySelector('h2');
      if(heading){
        heading.setAttribute('tabindex','-1');
        heading.focus({preventScroll:true});
      }
    }
  }
  function beginIfNeeded(){
    if(started)return;
    started=true;
    if(window.ytsTrack)window.ytsTrack('checkup_start',{checkup_type:'tech_spending_checkup'});
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

  const deviceWrap=document.getElementById('quickDevicePaymentWrap');
  function syncDevicePayment(){
    const choice=checkedValue('deviceIncluded');
    if(deviceWrap)deviceWrap.classList.toggle('is-hidden',choice==='no');
    if(choice==='no'){
      const input=document.getElementById('quickDevicePayments');
      if(input)input.value='';
    }
  }
  form.querySelectorAll('input[name="deviceIncluded"]').forEach(radio=>radio.addEventListener('change',syncDevicePayment));
  syncDevicePayment();

  function makeOpportunity(type,score,title,summary,detail,href,cta,badge){
    return {type:type,score:score,title:title,summary:summary,detail:detail,href:href,cta:cta,badge:badge};
  }

  function buildWirelessBenchmark(data,lines,currentProvider,serviceTotal){
    if(!data||!Array.isArray(data.providers)||!data.policy)return null;
    const maxAge=Math.max(0,parseInt(data.policy.max_age_days||'7',10)||7);
    const currentKey=normalizeName(currentProvider);
    const candidates=[];

    data.providers.forEach(provider=>{
      if(!provider||normalizeName(provider.name)===currentKey)return;
      if(daysOld(provider.last_verified)>maxAge)return;
      (provider.plans||[]).forEach(plan=>{
        if(typeof plan.standard_monthly_price!=='number')return;
        const perLine=plan.standard_monthly_price;
        candidates.push({
          provider:provider.name,
          plan:plan.name,
          perLine:perLine,
          monthlyTotal:perLine*lines,
          verified:provider.last_verified,
          note:plan.pricing_note||''
        });
      });
    });

    if(!candidates.length)return null;
    candidates.sort((a,b)=>a.perLine-b.perLine);

    const low=candidates[0];
    const high=candidates[candidates.length-1];
    const freshest=candidates.reduce((latest,c)=>!latest||c.verified>latest?c.verified:latest,'');

    let annualLow=null;
    let annualHigh=null;
    if(serviceTotal>0){
      const differences=candidates
        .map(c=>Math.max(0,(serviceTotal-c.monthlyTotal)*12))
        .filter(v=>v>0)
        .sort((a,b)=>a-b);
      if(differences.length){
        annualLow=differences[0];
        annualHigh=differences[differences.length-1];
      }
    }

    return {
      candidates,
      low,
      high,
      annualLow,
      annualHigh,
      verified:freshest,
      maxAge
    };
  }

  async function buildResults(){
    const lines=Math.max(1,parseInt(checkedValue('lines')||'1',10));
    const provider=checkedValue('wirelessProvider');
    const wireless=numberValue('quickWirelessCost');
    const deviceIncluded=checkedValue('deviceIncluded');
    const devicePayments=numberValue('quickDevicePayments');
    const internetProvider=document.getElementById('quickInternetProvider')?.value||'';
    const internet=numberValue('quickInternetCost');
    const internetHappy=checkedValue('internetHappy');
    const extras=extraBoxes.filter(b=>b.checked&&b!==none).map(b=>b.value);
    const extrasCost=numberValue('quickExtrasCost');
    const total=wireless+internet+extrasCost;

    let serviceTotal=wireless;
    let serviceEstimateClean=true;
    if(deviceIncluded==='yes'){
      if(devicePayments>0)serviceTotal=Math.max(0,wireless-devicePayments);
      else serviceEstimateClean=false;
    }else if(deviceIncluded==='unsure'){
      if(devicePayments>0)serviceTotal=Math.max(0,wireless-devicePayments);
      else serviceEstimateClean=false;
    }
    const perLine=serviceTotal?serviceTotal/lines:0;

    document.getElementById('quickMonthlyTotal').textContent=total?money(total):'Not enough entered';

    const wirelessData=await wirelessDataPromise;
    const benchmark=(wireless&&serviceEstimateClean)
      ? buildWirelessBenchmark(wirelessData,lines,provider,serviceTotal)
      : null;

    const savingsEstimate=document.getElementById('quickSavingsEstimate');
    const savingsNote=document.getElementById('quickSavingsNote');
    if(benchmark&&benchmark.annualHigh){
      if(benchmark.annualLow&&Math.round(benchmark.annualLow)!==Math.round(benchmark.annualHigh)){
        savingsEstimate.textContent=money(benchmark.annualLow)+'–'+money(benchmark.annualHigh)+'/yr';
      }else{
        savingsEstimate.textContent='Up to '+money(benchmark.annualHigh)+'/yr';
      }
      savingsNote.textContent='Directional standard-price comparison; promos excluded and taxes/fees, eligibility and features can differ';
    }else if(wireless&&!serviceEstimateClean){
      savingsEstimate.textContent='Need service-only cost';
      savingsNote.textContent='Estimate phone payments above so we do not compare device financing with service';
    }else{
      savingsEstimate.textContent='No direct estimate';
      savingsNote.textContent='We only show a dollar benchmark when fresh provider data supports it';
    }

    let wirelessScore=1;
    if(perLine>=55)wirelessScore=4;
    else if(perLine>=40)wirelessScore=3;
    else if(perLine>=28)wirelessScore=2;
    if(!serviceEstimateClean&&wirelessScore>1)wirelessScore-=0.5;

    let wirelessSummary='';
    let wirelessDetail='';
    if(wireless){
      if(serviceEstimateClean){
        wirelessSummary='Estimated service cost: '+money(serviceTotal)+'/month • '+moneyPerLine(perLine)+' per line';
        if(benchmark){
          wirelessDetail='Fresh tracked standard plan rates currently range from '+moneyPerLine(benchmark.low.perLine)+' to '+moneyPerLine(benchmark.high.perLine)+' per line among the records we can compare directly. Promotions are excluded. Some advertised prices include taxes and fees while others do not, so treat the gap as directional. Data, hotspot, billing terms, eligibility and coverage can also change the real fit. Freshest record used: '+formatDate(benchmark.verified)+'.';
        }else{
          wirelessDetail='We could not build a fresh dollar benchmark from the provider records available right now, so use the plan finder to compare features and current pricing directly.';
        }
      }else{
        wirelessSummary='About '+money(wireless/lines)+' per line from the total you entered';
        wirelessDetail='That amount may include phone financing. Add an estimate for monthly phone payments so the checkup can separate service from devices before comparing plan prices.';
      }
    }else{
      wirelessSummary=provider?provider+' selected':'Wireless details were limited';
      wirelessDetail='Add your monthly wireless cost to get a service-cost benchmark, or use the plan finder to compare providers by features.';
    }

    let internetScore=1;
    if(internet>=110)internetScore=4;
    else if(internet>=80)internetScore=3;
    else if(internet>=60)internetScore=2;
    if(internetHappy==='no')internetScore+=1.5;
    else if(internetHappy==='mostly')internetScore+=0.5;

    let internetSummary=internet
      ? money(internet)+'/month • '+money(internet*12)+'/year'+(internetProvider?' with '+internetProvider:'')
      : (internetProvider||'Home internet details were limited');
    let internetDetail=internetHappy==='no'
      ? 'Because you are not happy with speed or reliability, compare both price and connection type before paying for a faster tier.'
      : 'Check whether your current price, speed tier and connection type still match how your household uses the service.';

    let extrasScore=0.5;
    if(extrasCost>=90)extrasScore=4;
    else if(extrasCost>=50)extrasScore=3;
    else if(extrasCost>0)extrasScore=2;
    if(extras.length>=3)extrasScore+=1;
    else if(extras.length>=1)extrasScore+=0.5;

    let extrasSummary=extras.length?extras.join(', '):'No specific extras selected';
    if(extrasCost)extrasSummary+=' • '+money(extrasCost)+'/month • '+money(extrasCost*12)+'/year';
    const extrasDetail=extras.length
      ? 'Review recurring entertainment and protection costs before canceling anything. Start with services you use least or may already receive through another plan or benefit.'
      : 'If you have recurring TV, streaming, music or protection charges, a quick audit can uncover costs that are easy to overlook.';

    const opportunities=[
      makeOpportunity('wireless',wirelessScore,'Wireless',wirelessSummary,wirelessDetail,'/compare/plan-finder.html','Compare My Wireless Options','Wireless'),
      makeOpportunity('internet',internetScore,'Home internet',internetSummary,internetDetail,'/internet/finder.html','Review My Internet','Internet'),
      makeOpportunity('extras',extrasScore,'TV, streaming & protection',extrasSummary,extrasDetail,'/guides/streaming-subscription-audit.html','Review Subscriptions & Extras','Subscriptions')
    ].sort((a,b)=>b.score-a.score);

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
      if(window.ytsTrack)window.ytsTrack('checkup_complete',{checkup_type:'tech_spending_checkup'});
    }
  }

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    beginIfNeeded();
    await buildResults();
    show(steps.length-1);
  });

  document.getElementById('quickStartOver')?.addEventListener('click',()=>{
    form.reset();
    completed=false;
    started=false;
    syncDevicePayment();
    show(0);
  });

  show(0,false);
})();