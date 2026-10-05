(function(){
 const mountCurrent=document.getElementById('currentPromos');
 if(!mountCurrent)return;
 const mountEnding=document.getElementById('endingPromos');
 const mountEnded=document.getElementById('endedPromos');
 const filters=document.getElementById('promoFilters');
 const notice=document.getElementById('promoFreshnessNotice');
 let all=[],policy={max_age_days:7},activeFilter='All';

 const DAY=86400000;
 const today=()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())};
 const parseDate=s=>s?new Date(s+'T00:00:00'):null;
 const ageDays=s=>Math.floor((today()-parseDate(s))/DAY);
 const daysUntil=s=>Math.ceil((parseDate(s)-today())/DAY);
 const fmt=s=>s?new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(parseDate(s)):'Not published';
 const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

 function state(p){
   const end=p.end_date?daysUntil(p.end_date):null;
   if(p.status==='ended'||(end!==null&&end<0))return 'ended';
   const fresh=ageDays(p.last_verified)<=Number(policy.max_age_days||7);
   if(p.status==='current'&&fresh){
     if(end!==null&&end>=0&&end<=14)return 'ending';
     return 'current';
   }
   return 'stale';
 }

 function card(p,status){
   const link=p.affiliate_url||p.source;
   const linkLabel=p.affiliate_url?(p.affiliate_label||'View offer'):'Verify with provider';
   const endText=p.end_date?'<div><span>Published end date</span><strong>'+esc(fmt(p.end_date))+'</strong></div>':'<div><span>Published end date</span><strong>Not published</strong></div>';
   const statusLabel=status==='ending'?'Ending soon':status==='ended'?'Ended':'Current';
   return '<article class="promo-card '+status+'">'+
     '<div class="promo-card-top"><span class="promo-category">'+esc(p.category)+'</span><span class="promo-status '+status+'">'+statusLabel+'</span></div>'+
     '<h3>'+esc(p.provider)+'</h3><h4>'+esc(p.title)+'</h4>'+
     '<p>'+esc(p.summary)+'</p>'+
     '<div class="promo-meta"><div><span>Last confirmed active</span><strong>'+esc(fmt(p.last_verified))+'</strong></div>'+endText+'</div>'+
     '<div class="promo-eligibility"><strong>Who should check it:</strong> '+esc(p.eligibility)+'</div>'+
     '<a class="btn btn-outline promo-source" href="'+esc(link)+'" rel="external sponsored noopener" target="_blank">'+esc(linkLabel)+' →</a>'+
   '</article>';
 }

 function empty(text){return '<div class="promo-empty">'+esc(text)+'</div>'}

 function render(){
   const visible=all.filter(p=>activeFilter==='All'||p.category===activeFilter);
   const current=visible.filter(p=>state(p)==='current');
   const ending=visible.filter(p=>state(p)==='ending');
   const ended=visible.filter(p=>state(p)==='ended').sort((a,b)=>(b.end_date||b.last_verified).localeCompare(a.end_date||a.last_verified));
   const stale=visible.filter(p=>state(p)==='stale');

   mountCurrent.innerHTML=current.length?current.map(p=>card(p,'current')).join(''):empty('No currently verified promotions in this category.');
   mountEnding.innerHTML=ending.length?ending.map(p=>card(p,'ending')).join(''):empty('No promotions with a published end date in the next 14 days.');
   mountEnded.innerHTML=ended.length?ended.slice(0,12).map(p=>card(p,'ended')).join(''):empty('No ended promotions have been archived yet.');

   if(stale.length){
     notice.className='freshness stale';
     notice.textContent=stale.length+' promotion'+(stale.length===1?' is':'s are')+' hidden from Current because '+(stale.length===1?'it has':'they have')+' not been reverified within '+policy.max_age_days+' days.';
   }else{
     notice.className='freshness fresh';
     notice.textContent='Current offers are limited to promotions verified within the last '+policy.max_age_days+' days.';
   }

   [...filters.querySelectorAll('button')].forEach(b=>b.classList.toggle('active',b.dataset.category===activeFilter));
 }

 fetch('/data/promotions.json',{cache:'no-store'}).then(r=>{
   if(!r.ok)throw new Error('Could not load promotions');
   return r.json();
 }).then(data=>{
   policy=data.policy||policy;
   all=Array.isArray(data.promotions)?data.promotions:[];
   const cats=['All',...new Set(all.map(p=>p.category).filter(Boolean))];
   filters.innerHTML=cats.map(c=>'<button type="button" class="promo-filter" data-category="'+esc(c)+'">'+esc(c)+'</button>').join('');
   filters.addEventListener('click',e=>{
     const b=e.target.closest('[data-category]');if(!b)return;
     activeFilter=b.dataset.category;render();
   });
   render();
 }).catch(()=>{
   notice.className='freshness stale';
   notice.textContent='Promotion data is temporarily unavailable. Please verify offers directly with the provider.';
   mountCurrent.innerHTML=empty('Promotion data could not be loaded.');
   mountEnding.innerHTML=empty('Promotion data could not be loaded.');
   mountEnded.innerHTML=empty('Promotion data could not be loaded.');
 });
})();