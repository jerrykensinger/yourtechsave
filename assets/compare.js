
(async function(){
 const root=document.getElementById('providerComparison'); if(!root)return;
 const status=document.getElementById('freshnessStatus');
 const fmt=d=>new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',day:'numeric'}).format(new Date(d+'T12:00:00'));
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 try{
   const data=await fetch('/data/wireless-providers.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('data unavailable');return r.json()});
   const now=new Date(),max=data.policy.max_age_days;
   const aged=p=>Math.floor((now-new Date(p.last_verified+'T23:59:59'))/86400000);
   const stale=data.providers.some(p=>aged(p)>max);
   status.className='freshness '+(stale?'stale':'fresh');
   status.innerHTML=stale
    ? '<strong>Re-verification required.</strong> Specific provider prices are hidden because at least one record is more than '+max+' days old. Use the official provider links below for current pricing.'
    : '<strong>Provider facts verified '+fmt(data.providers[0].last_verified)+'.</strong> Standard prices shown below exclude temporary promotions. We re-check time-sensitive plan data at least weekly.';
   let html='';
   for(const p of data.providers){
     const isStale=aged(p)>max;
     const out=p.affiliate_url||p.official_plans_url;
     const linkType=p.affiliate_url?'affiliate':'official';
     const rel=linkType==='affiliate'?'external sponsored':'external';
     html+='<section class="provider-panel"><div class="provider-head"><div><div class="kicker">Provider</div><h2>'+esc(p.name)+'</h2><div class="micro">Last verified: '+fmt(p.last_verified)+'</div></div><a class="btn btn-outline provider-outbound" href="'+esc(out)+'" target="_blank" rel="'+rel+' noopener" data-provider="'+esc(p.name)+'" data-link-type="'+linkType+'">'+(p.affiliate_url?'Visit provider (affiliate)':'View official plans')+'</a></div>';
     html+='<div class="provider-facts">';
     p.facts.forEach(f=>html+='<div class="fact-row"><strong>'+esc(f.label)+'</strong><span>'+esc(f.value)+'</span><a href="'+esc(f.source)+'" rel="external">Source</a></div>');
     html+='</div><h3>Current plan records</h3><div class="plan-grid">';
     p.plans.forEach(pl=>{
       const price=(!stale && !isStale && typeof pl.standard_monthly_price==='number')?'$'+pl.standard_monthly_price+'/mo':'See official pricing';
       html+='<div class="plan-card"><strong>'+esc(pl.name)+'</strong><div class="plan-price">'+price+'</div><div class="micro">'+esc(pl.pricing_note)+'</div></div>';
     });
     html+='</div></section>';
   }
   root.innerHTML=html;
   root.querySelectorAll('a.provider-outbound').forEach(link=>{
     link.addEventListener('click',()=>{
       const provider=link.dataset.provider||'unknown';
       const linkType=link.dataset.linkType||'official';
       if(window.ytsTrack) window.ytsTrack('provider_link_click',{
         provider_name:provider,
         link_type:linkType,
         debug_mode:true
       });
     });
   });
 }catch(e){
   status.className='freshness stale';status.innerHTML='<strong>Provider data could not be loaded.</strong> Specific prices are unavailable. Use the official provider links in the Sources section.';
   root.innerHTML='';
 }
})();