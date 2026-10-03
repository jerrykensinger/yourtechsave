(function(){
 const MEASUREMENT_ID='G-DFTEWX4YVT';
 const CONSENT_KEY='yts_analytics_consent';
 window.dataLayer=window.dataLayer||[];
 window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
 const stored=localStorage.getItem(CONSENT_KEY);
 gtag('consent','default',{
   analytics_storage:'denied',
   ad_storage:'denied',
   ad_user_data:'denied',
   ad_personalization:'denied',
   wait_for_update:500
 });
 if(stored==='granted')gtag('consent','update',{analytics_storage:'granted'});
 const tag=document.createElement('script');
 tag.async=true;
 tag.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(MEASUREMENT_ID);
 document.head.appendChild(tag);
 gtag('js',new Date());
 gtag('config',MEASUREMENT_ID,{send_page_view:false});

 let pageViewSent=false;
 function track(name,params){
   if(localStorage.getItem(CONSENT_KEY)!=='granted')return;
   gtag('event',name,params||{});
 }
 function sendPageView(){
   if(pageViewSent||localStorage.getItem(CONSENT_KEY)!=='granted')return;
   pageViewSent=true;
   gtag('event','page_view',{
     page_title:document.title,
     page_location:location.href,
     page_path:location.pathname
   });
 }
 window.ytsTrack=track;
 if(stored==='granted')sendPageView();

 function removeBanner(){document.getElementById('analyticsConsent')?.remove()}
 function showBanner(){
   if(document.getElementById('analyticsConsent')||localStorage.getItem(CONSENT_KEY))return;
   const box=document.createElement('div');
   box.id='analyticsConsent';
   box.className='analytics-consent';
   box.innerHTML='<div><strong>Help us improve YourTechSave</strong><p>With your permission, we use Google Analytics to understand which pages and tools are useful. We do not send the dollar amounts or answers you enter in the Tech Spending Checkup to Analytics. <a href="/privacy.html">Privacy details</a>.</p></div><div class="analytics-consent-actions"><button class="btn btn-primary" type="button" data-consent="accept">Allow analytics</button><button class="btn btn-outline" type="button" data-consent="decline">No thanks</button></div>';
   document.body.appendChild(box);
   box.querySelector('[data-consent="accept"]').addEventListener('click',()=>{
     localStorage.setItem(CONSENT_KEY,'granted');
     gtag('consent','update',{analytics_storage:'granted'});
     removeBanner();
     sendPageView();
   });
   box.querySelector('[data-consent="decline"]').addEventListener('click',()=>{
     localStorage.setItem(CONSENT_KEY,'denied');
     gtag('consent','update',{analytics_storage:'denied'});
     removeBanner();
   });
 }

 function bindEvents(){
   if(!stored)showBanner();

   const checkup=document.getElementById('checkupForm');
   if(checkup){
     let started=false,completed=false;
     document.addEventListener('click',e=>{
       if(!started&&e.target.closest('#checkupForm [data-next]')){
         started=true;
         track('checkup_start',{debug_mode:true});
       }
     },true);
     checkup.addEventListener('submit',()=>{
       if(completed)return;
       completed=true;
       track('checkup_complete',{debug_mode:true});
     },true);
   }

   if(location.pathname==='/calculators.html'){
     const sent=new Set();
     document.addEventListener('input',e=>{
       const id=e.target&&e.target.id;
       if((id==='cw'||id==='cl')&&!sent.has('wireless')){
         const cost=parseFloat(document.getElementById('cw')?.value||'0');
         if(cost>0){sent.add('wireless');track('calculator_used',{calculator_type:'wireless_cost_per_line'})}
       }
       if(id==='cm'&&!sent.has('annual')){
         const monthly=parseFloat(document.getElementById('cm')?.value||'0');
         if(monthly>0){sent.add('annual');track('calculator_used',{calculator_type:'monthly_to_annual'})}
       }
     });
   }

   document.addEventListener('click',e=>{
     const link=e.target.closest('#providerComparison a.btn');
     if(!link)return;
     const panel=link.closest('.provider-panel');
     const provider=link.dataset.provider||panel?.querySelector('h2')?.textContent?.trim()||'unknown';
     track('provider_link_click',{
       provider_name:provider,
       link_type:link.dataset.linkType||'official'
     });
   });
 }

 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindEvents);
 else bindEvents();
})();


(function(){
 const nav=document.querySelector('.nav'),mb=document.querySelector('.menu-btn'); if(mb)mb.onclick=()=>nav.classList.toggle('open');
 const form=document.getElementById('checkupForm'); if(!form)return;
 const steps=[...document.querySelectorAll('.step')],bar=document.querySelector('.progress span');let current=0;
 const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);
 const num=id=>Math.max(0,parseFloat(document.getElementById(id)?.value)||0);
 function show(i){current=Math.max(0,Math.min(steps.length-1,i));steps.forEach((s,x)=>s.classList.toggle('active',x===current));bar.style.width=((current+1)/steps.length*100)+'%';scrollTo({top:0,behavior:'smooth'})}
 document.querySelectorAll('[data-next]').forEach(b=>b.onclick=()=>show(current+1));document.querySelectorAll('[data-prev]').forEach(b=>b.onclick=()=>show(current-1));
 const wrap=document.getElementById('subscriptions');
 function addSub(){const r=document.createElement('div');r.className='sub-row';r.innerHTML='<label>Service<input class="sub-name" placeholder="Netflix"></label><label>Monthly cost<input class="sub-cost" type="number" min="0" step=".01" placeholder="0"></label><label>Use<select class="sub-use"><option value="frequent">Frequent</option><option value="sometimes">Sometimes</option><option value="rarely">Rarely</option></select></label><button class="remove" type="button">Remove</button>';r.querySelector('.remove').onclick=()=>r.remove();wrap.appendChild(r)}
 document.getElementById('addSub')?.addEventListener('click',addSub);addSub();addSub();
 form.onsubmit=e=>{e.preventDefault();const wireless=num('wirelessCost'),lines=Math.max(1,num('lines')||1),internet=num('internetCost'),protection=num('protectionCost'),devices=num('devicePayments');
 const subs=[...document.querySelectorAll('.sub-row')].map(r=>({name:r.querySelector('.sub-name').value.trim()||'Subscription',cost:Math.max(0,parseFloat(r.querySelector('.sub-cost').value)||0),use:r.querySelector('.sub-use').value})).filter(x=>x.cost>0);
 const subTotal=subs.reduce((a,b)=>a+b.cost,0),rare=subs.filter(x=>x.use==='rarely'),rareTotal=rare.reduce((a,b)=>a+b.cost,0),total=wireless+internet+protection+devices+subTotal;
 monthlyTotal.textContent=money(total);annualTotal.textContent=money(total*12);rareAnnual.textContent=money(rareTotal*12);wirelessPerLine.textContent=money(wireless/lines);
 const o=[];if(rareTotal)o.push(['Review rarely used subscriptions',money(rareTotal)+'/mo identified','Canceling only the subscriptions you marked as rarely used would reduce spending by '+money(rareTotal*12)+' per year.']);
 if(wireless)o.push(['Benchmark your wireless service',money(wireless/lines)+'/line','This is your current service cost per line. Verified carrier comparisons will be added after the plan-data process is operating.']);
 if(internet)o.push(['Review your internet tier',money(internet)+'/mo','Compare the speed you pay for with the way your household actually uses the connection.']);
 if(protection)o.push(['Review device protection',money(protection*12)+'/yr','Compare annual protection cost with the devices covered, deductibles and replacement rules.']);
 opportunities.innerHTML=(o.length?o:[['Add a few costs to see opportunities','No estimate yet','Enter current technology spending to build a useful snapshot.']]).map((x,i)=>'<div class="opp"><div class="opp-top"><h3>'+(i+1)+'. '+x[0]+'</h3><span class="pill">'+x[1]+'</span></div><p>'+x[2]+'</p></div>').join('');
 show(steps.length-1)}
 document.getElementById('copyShare')?.addEventListener('click',async()=>{const t="I used YourTechSave's free Tech Spending Checkup. Try yours at https://yourtechsave.com/checkup.html";try{await navigator.clipboard.writeText(t);copyShare.textContent='Copied'}catch(e){alert(t)}});show(0);
})();
(function(){const n=document.querySelector('.nav-links');if(n&&!n.querySelector('a[href="/compare/"]')){const a=document.createElement('a');a.href='/compare/';a.textContent='Compare';const before=n.querySelector('a[href="/methodology.html"]');n.insertBefore(a,before||null)}})();
