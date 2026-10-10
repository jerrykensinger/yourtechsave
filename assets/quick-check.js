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

  function validateDevicePayments(){
const w=numberValue('quickWirelessCost'),d=numberValue('quickDevicePayments');
const err=document.getElementById('quickDevicePaymentError'),inp=document.getElementById('quickDevicePayments');
if(d>0&&d>w){
if(err){err.hidden=false;err.textContent='Phone payments cannot be greater than the wireless total you entered.';}
if(inp)inp.focus();
return false;
}
if(err){err.hidden=true;err.textContent='';}
return true;
}
['quickWirelessCost','quickDevicePayments'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>{if(current===2)validateDevicePayments();}));

form.querySelectorAll('[data-next]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      beginIfNeeded();
      if(current===2&&!validateDevicePayments())return;
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
  document.getElementById('quickDevicePayments')?.addEventListener('input',()=>{
    const error=document.getElementById('quickDevicePaymentError');
    if(error){error.hidden=true;error.textContent='';}
  });
  syncDevicePayment();

  function makeOpportunity(type,score,title,summary,detail,href,cta,badge,extraHtml){
    return {type:type,score:score,title:title,summary:summary,detail:detail,href:href,cta:cta,badge:badge,extraHtml:extraHtml||''};
  }

  function escapeHtml(value){
    return String(value||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function providerFact(provider,pattern){
    return (provider.facts||[]).find(f=>pattern.test(String(f.label||'')))?.value||'';
  }
  function taxLabel(provider){
    const text=providerFact(provider,/taxes?.*fees/i);
    if(/included/i.test(text))return 'Taxes & fees included';
    if(/extra|not included/i.test(text))return 'Taxes & fees extra';
    return 'Taxes & fees vary';
  }
  function billingLabel(plan){
    const note=String(plan.pricing_note||'');
    if(/paid up front|12-month/i.test(note))return '12-month term • paid upfront';
    return 'Monthly billing';
  }
  function comparisonHref(currentProvider,candidateProvider){
    const key=[normalizeName(currentProvider),normalizeName(candidateProvider)].sort().join('|');
    const map={
      'att|visible':'/compare/visible-vs-att.html',
      'att|tmobile':'/compare/att-vs-t-mobile.html',
      'att|verizon':'/compare/verizon-vs-att.html',
      'mintmobile|usmobile':'/compare/us-mobile-vs-mint-mobile.html',
      'mintmobile|visible':'/compare/visible-vs-mint-mobile.html',
      'tmobile|verizon':'/compare/verizon-vs-t-mobile.html',
      'tmobile|visible':'/compare/visible-vs-t-mobile.html',
      'usmobile|visible':'/compare/visible-vs-us-mobile.html',
      'verizon|visible':'/compare/visible-vs-verizon.html'
    };
    return map[key]||'/compare/plan-finder.html';
  }

  function exampleTitle(example){
const p=String(example.provider||'').trim(),n=String(example.plan||'').trim();
if(!n||n.toLowerCase()===p.toLowerCase())return escapeHtml(p+' (standard plan)');
if(n.toLowerCase().startsWith(p.toLowerCase()))return escapeHtml(n);
return escapeHtml(p+' — '+n);
}
function exampleLink(example){
const generic=example.href==='/compare/plan-finder.html'&&/^https?:\/\//.test(example.source||'');
return generic
?{href:example.source,text:'View official plan page ↗',attrs:' target="_blank" rel="noopener noreferrer"'}
:{href:example.href,text:'Review this option →',attrs:''};
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
          listedDifference:serviceTotal-(perLine*lines),
          verified:provider.last_verified,
          note:plan.pricing_note||'',
          taxes:taxLabel(provider),
          billing:billingLabel(plan),
          href:comparisonHref(currentProvider,provider.name),
          source:plan.source||provider.official_plans_url||''
        });
      });
    });

    if(!candidates.length)return null;
    candidates.sort((a,b)=>a.perLine-b.perLine);

    const byProvider=new Map();
    candidates.forEach(candidate=>{
      const key=normalizeName(candidate.provider);
      if(!byProvider.has(key)||candidate.perLine<byProvider.get(key).perLine){
        byProvider.set(key,candidate);
      }
    });
    const examples=[...byProvider.values()].sort((a,b)=>a.perLine-b.perLine).slice(0,3);
    if(!examples.length)return null;

    const dates=examples.map(c=>c.verified).filter(Boolean).sort();
    return {
      examples,
      oldestVerified:dates[0]||'',
      newestVerified:dates[dates.length-1]||'',
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
    const deviceInput=document.getElementById('quickDevicePayments');
    const deviceError=document.getElementById('quickDevicePaymentError');
    if(devicePayments>wireless&&devicePayments>0){
      if(deviceError){
        deviceError.hidden=false;
        deviceError.textContent='Phone payments cannot be greater than the wireless total you entered.';
      }
      show(2);
      requestAnimationFrame(()=>deviceInput?.focus());
      return false;
    }
    if(deviceError){
      deviceError.hidden=true;
      deviceError.textContent='';
    }

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
    if(benchmark&&benchmark.examples.length){
      savingsEstimate.textContent=benchmark.examples.length+' plan'+(benchmark.examples.length===1?'':'s');
      savingsNote.textContent='Named fresh examples below • not tier-matched savings estimates';
    }else if(wireless&&!serviceEstimateClean){
      savingsEstimate.textContent='Need service-only cost';
      savingsNote.textContent='Estimate phone payments above before we compare plan prices';
    }else{
      savingsEstimate.textContent='No fresh examples';
      savingsNote.textContent='Your cost per line still appears below with next-step guidance';
    }

    let wirelessScore=1;
    if(perLine>=55)wirelessScore=4;
    else if(perLine>=40)wirelessScore=3;
    else if(perLine>=28)wirelessScore=2;
    if(!serviceEstimateClean&&wirelessScore>1)wirelessScore-=0.5;
if(benchmark&&benchmark.examples.some(e=>e.listedDifference>=20))wirelessScore=Math.max(wirelessScore,4.5);

    let wirelessSummary='';
    let wirelessDetail='';
    let wirelessExamplesHtml='';
    if(wireless){
      if(serviceEstimateClean){
        wirelessSummary='Estimated service cost: '+money(serviceTotal)+'/month • '+moneyPerLine(perLine)+' per line';
        if(benchmark){
          const dateText=benchmark.oldestVerified===benchmark.newestVerified
            ? 'Verified '+formatDate(benchmark.oldestVerified)
            : 'Verified '+formatDate(benchmark.oldestVerified)+'–'+formatDate(benchmark.newestVerified);
          wirelessDetail='These are named recently verified plan examples, not a claim that they match your current plan tier. Compare data, hotspot, taxes/fees, billing terms, eligibility and coverage before switching. '+dateText+'.';
          wirelessExamplesHtml='<div class="wireless-examples"><div class="wireless-examples-title">Fresh plan examples to review</div>'+
            benchmark.examples.map(example=>{
              const diff=Math.round(example.listedDifference);
              let diffText='Listed total is about the same as your service-only estimate';
              if(diff>0)diffText=money(diff)+'/month lower listed price than your service-only estimate';
              if(diff<0)diffText=money(Math.abs(diff))+'/month higher listed price than your service-only estimate';
              return '<div class="wireless-example">'+
                '<div class="wireless-example-head"><div><strong>'+exampleTitle(example)+'</strong><span>'+moneyPerLine(example.perLine)+'/line • '+money(example.monthlyTotal)+'/month for '+lines+' line'+(lines===1?'':'s')+'</span></div><span class="wireless-gap">'+escapeHtml(diffText)+'</span></div>'+
                '<div class="wireless-meta"><span>'+escapeHtml(example.taxes)+'</span><span>'+escapeHtml(example.billing)+'</span><span>Verified '+escapeHtml(formatDate(example.verified))+'</span></div>'+
                '<div class="wireless-note">'+escapeHtml(example.note)+'</div>'+
                '<a href="'+escapeHtml(exampleLink(example).href)+'"'+exampleLink(example).attrs+'>'+exampleLink(example).text+'</a>'+
              '</div>';
            }).join('')+
            '<div class="wireless-examples-foot">Listed-price differences are not guaranteed savings. Promotions are excluded, and these examples are not automatically matched to your current data or feature tier.</div></div>';
        }else{
          wirelessDetail='We only show prices we have re-verified recently. Here is your cost per line so you can use the plan finder to compare features and current pricing without relying on stale numbers.';
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
      makeOpportunity('wireless',wirelessScore,'Wireless',wirelessSummary,wirelessDetail,'/compare/plan-finder.html','Compare My Wireless Options','Wireless',wirelessExamplesHtml),
      makeOpportunity('internet',internetScore,'Home internet',internetSummary,internetDetail,'/internet/finder.html','Review My Internet','Internet'),
      makeOpportunity('extras',extrasScore,'TV, streaming & protection',extrasSummary,extrasDetail,'/guides/streaming-subscription-audit.html','Review Subscriptions & Extras','Subscriptions')
    ].sort((a,b)=>b.score-a.score);

    const mount=document.getElementById('quickOpportunities');
    mount.innerHTML=opportunities.map((o,index)=>{
      const hasBenchmark=o.type==='wireless'&&benchmark&&benchmark.examples.length>0;
const label=index===0?(hasBenchmark?'Highest impact':'Largest cost to review'):(index===1?'Next':'Also worth checking');
      return '<article class="quick-opportunity '+(index===0?'featured':'')+'">'+
        '<div class="quick-opportunity-rank"><span>'+(index+1)+'</span><div><small>'+label+'</small><h3>'+o.title+'</h3></div></div>'+
        '<div class="quick-opportunity-summary">'+o.summary+'</div>'+
        '<p>'+o.detail+'</p>'+
        (o.extraHtml||'')+
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
    const built=await buildResults();
    if(built!==false)show(steps.length-1);
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
