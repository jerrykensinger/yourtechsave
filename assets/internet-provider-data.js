(async function(){
 const root=document.getElementById('internetProviderComparison'); if(!root)return;
 const status=document.getElementById('internetFreshnessStatus');
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const fmt=d=>new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',day:'numeric'}).format(new Date(d+'T12:00:00'));
 try{
   const data=await fetch('/data/internet-providers.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('provider data unavailable');return r.json()});
   const requested=(root.dataset.providerIds||'').split(',').map(x=>x.trim()).filter(Boolean);
   const providers=requested.length?data.providers.filter(p=>requested.includes(p.id)):data.providers;
   if(!providers.length)throw new Error('no provider records');
   const now=new Date(),max=data.policy.max_age_days;
   const age=p=>Math.floor((now-new Date(p.last_verified+'T23:59:59'))/86400000);
   const stale=providers.some(p=>age(p)>max);
   if(status){
     status.className='freshness '+(stale?'stale':'fresh');
     status.innerHTML=stale
       ? '<strong>Re-verification required.</strong> Time-sensitive internet prices are hidden because at least one provider record is more than '+max+' days old. Use the official address checks below for current pricing.'
       : '<strong>Internet provider facts verified '+fmt(providers.reduce((a,p)=>a<p.last_verified?a:p.last_verified,providers[0].last_verified))+'.</strong> Regular pricing is kept separate from temporary promotions and exact availability still requires an address check.';
   }
   let html='';
   for(const p of providers){
     const isStale=age(p)>max;
     const out=p.affiliate_url||p.availability_check_url||p.official_plans_url;
     const linkType=p.affiliate_url?'affiliate':'official_availability';
     const rel=p.affiliate_url?'external sponsored noopener':'external noopener';
     html+='<section class="provider-panel"><div class="provider-head"><div><div class="kicker">'+esc(p.technology)+'</div><h2>'+esc(p.name)+'</h2><div class="micro">Last verified: '+fmt(p.last_verified)+'</div></div><a class="btn btn-outline internet-provider-directory-link" href="'+esc(out)+'" target="_blank" rel="'+rel+'" data-provider="'+esc(p.name)+'" data-link-type="'+linkType+'">'+(p.affiliate_url?'Visit provider (affiliate)':'Check address availability')+'</a></div>';
     html+='<div class="notice"><strong>Availability:</strong> '+esc(p.availability_note)+'</div>';
     html+='<div class="provider-facts">';
     (p.facts||[]).forEach(f=>html+='<div class="fact-row"><strong>'+esc(f.label)+'</strong><span>'+esc(f.value)+'</span><a href="'+esc(f.source)+'" rel="external">Source</a></div>');
     html+='</div><h3>Current plan records</h3><div class="plan-grid">';
     (p.plans||[]).forEach(pl=>{
       let price='Check address pricing';
       if(!stale&&!isStale){
         if(pl.display_price)price=esc(pl.display_price);
         else if(typeof pl.standard_monthly_price==='number')price='$'+pl.standard_monthly_price+'/mo';
       } else if(typeof pl.standard_monthly_price==='number'||pl.display_price) price='Price hidden until reverified';
       html+='<div class="plan-card"><strong>'+esc(pl.name)+'</strong><div class="plan-price">'+price+'</div><div class="micro">'+esc(pl.pricing_note)+'</div>'+(pl.source?'<div class="micro" style="margin-top:8px"><a href="'+esc(pl.source)+'" rel="external">Plan/source details</a></div>':'')+'</div>';
     });
     html+='</div>';
     if((p.promotions||[]).length)html+='<div class="comparison-policy" style="margin-top:18px"><strong>Promotions monitored separately.</strong> Limited-time offers and bundle discounts are not used as the regular-price baseline.</div>';
     html+='</section>';
   }
   root.innerHTML=html;
   root.querySelectorAll('.internet-provider-directory-link').forEach(a=>a.addEventListener('click',()=>{
     if(window.ytsTrack)window.ytsTrack('internet_provider_click',{provider_name:a.dataset.provider||'unknown',link_type:a.dataset.linkType||'official_availability',source:'provider_directory'});
   }));
 }catch(e){
   if(status){status.className='freshness stale';status.innerHTML='<strong>Internet provider data could not be loaded.</strong> Use the official availability links on this page for current information.'}
   root.innerHTML='';
 }
})();