(function(){
 const tierMount=document.getElementById('storageTiers');
 if(!tierMount)return;
 const backupMount=document.getElementById('backupTable');
 const filters=document.getElementById('storageFilters');
 const status=document.getElementById('storageFreshness');
 const DAY=86400000;
 const TIERS=[
  {id:'all',label:'All sizes'},
  {id:'small',label:'Up to 200 GB'},
  {id:'medium',label:'500 GB to 1 TB'},
  {id:'large',label:'2 TB'},
  {id:'xlarge',label:'5 TB and up'},
  {id:'unlimited',label:'Unlimited'}
 ];
 let providers=[],policy={max_age_days:7},active='all';

 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const today=()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())};
 const ageDays=s=>Math.floor((today()-new Date(s+'T00:00:00'))/DAY);
 const fmtDate=s=>new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date(s+'T12:00:00'));
 const money=n=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 const isNum=n=>typeof n==='number'&&isFinite(n);
 const fresh=p=>{const a=ageDays(p.last_verified);return isFinite(a)&&a<=Number(policy.max_age_days||7)};

 // Lowest standard price per month for a plan, using annual billing when listed.
 function bestMonthly(pl){
  const c=[];
  if(isNum(pl.standard_monthly_price))c.push(pl.standard_monthly_price);
  if(isNum(pl.annual_billed_price))c.push(pl.annual_billed_price/12);
  return c.length?Math.min.apply(null,c):null;
 }
 function perTb(pl){
  const m=bestMonthly(pl);
  return isNum(pl.storage_gb)&&pl.storage_gb>0&&m!==null?m/(pl.storage_gb/1000):null;
 }

 function row(p,pl,ok){
  const hidden='<span class="micro">Hidden until reverified</span>';
  const mo=ok&&isNum(pl.standard_monthly_price)?money(pl.standard_monthly_price):(ok?'Not listed':hidden);
  const yr=ok&&isNum(pl.annual_billed_price)?money(pl.annual_billed_price)+'<div class="micro">'+money(pl.annual_billed_price/12)+'/mo</div>':(ok?'Not listed':hidden);
  const per=perTb(pl);
  const perTxt=ok?(per!==null?'<strong>'+money(per)+'</strong>':'n/a'):hidden;
  const users=pl.users?'<div class="micro">'+esc(pl.users)+'</div>':'';
  return '<tr><td><strong>'+esc(pl.name)+'</strong><div class="micro">'+esc(p.name)+'</div>'+users+'</td>'+
   '<td>'+esc(pl.storage_label)+'</td><td>'+mo+'</td><td>'+yr+'</td><td>'+perTxt+'</td>'+
   '<td class="storage-note">'+esc(pl.extras||'')+(pl.pricing_note?'<div class="micro">'+esc(pl.pricing_note)+'</div>':'')+
   '<div class="micro"><a href="'+esc(pl.source)+'" rel="external noopener" target="_blank">Official source</a></div></td></tr>';
 }

 function render(){
  const rows=[];
  providers.filter(p=>p.category==='cloud_storage').forEach(p=>{
   const ok=fresh(p);
   p.plans.forEach(pl=>{if(active==='all'||pl.tier===active)rows.push({p:p,pl:pl,ok:ok,per:perTb(pl)})});
  });
  // Cheapest cost per TB first; unknown or hidden prices last.
  rows.sort((a,b)=>{
   const av=a.ok&&a.per!==null?a.per:Infinity,bv=b.ok&&b.per!==null?b.per:Infinity;
   return av-bv||a.pl.name.localeCompare(b.pl.name);
  });
  tierMount.innerHTML=rows.length?
   '<table class="comparison-table"><thead><tr><th>Plan</th><th>Storage</th><th>Billed monthly</th><th>Billed yearly</th><th>Cost per TB per month</th><th>What else to know</th></tr></thead><tbody>'+rows.map(r=>row(r.p,r.pl,r.ok)).join('')+'</tbody></table>':
   '<div class="promo-empty">No plans in this size range.</div>';

  const bk=providers.filter(p=>p.category==='backup');
  const brows=[];
  bk.forEach(p=>{const ok=fresh(p);p.plans.forEach(pl=>brows.push(row(p,pl,ok)))});
  if(backupMount)backupMount.innerHTML='<table class="comparison-table"><thead><tr><th>Plan</th><th>Storage</th><th>Billed monthly</th><th>Billed yearly</th><th>Cost per TB per month</th><th>What else to know</th></tr></thead><tbody>'+brows.join('')+'</tbody></table>';

  if(filters)[...filters.querySelectorAll('button')].forEach(b=>b.classList.toggle('active',b.dataset.tier===active));

  const stale=providers.filter(p=>!fresh(p));
  if(status){
   if(stale.length){
    status.className='freshness stale';
    status.innerHTML='<strong>Re-verification required.</strong> Prices for '+stale.map(p=>esc(p.name)).join(', ')+' are hidden because the records are more than '+esc(policy.max_age_days)+' days old. Use the official source links for current pricing.';
   }else{
    const oldest=providers.reduce((a,p)=>a<p.last_verified?a:p.last_verified,providers[0].last_verified);
    status.className='freshness fresh';
    status.innerHTML='<strong>Prices verified '+fmtDate(oldest)+'.</strong> Each plan links to the provider page it came from. Prices are shown without tax and without first-year promotions.';
   }
  }
 }

 fetch('/data/storage-providers.json',{cache:'no-store'}).then(r=>{
  if(!r.ok)throw new Error('storage data unavailable');
  return r.json();
 }).then(data=>{
  policy=data.policy||policy;
  providers=Array.isArray(data.providers)?data.providers:[];
  if(!providers.length)throw new Error('no storage records');
  if(filters){
   filters.innerHTML=TIERS.map(t=>'<button type="button" class="promo-filter" data-tier="'+t.id+'">'+esc(t.label)+'</button>').join('');
   filters.addEventListener('click',e=>{const b=e.target.closest('[data-tier]');if(!b)return;active=b.dataset.tier;render()});
  }
  render();
 }).catch(()=>{
  if(status){status.className='freshness stale';status.innerHTML='<strong>Storage pricing could not be loaded.</strong> Use the official provider links on this page for current prices.'}
  tierMount.innerHTML='';
  if(backupMount)backupMount.innerHTML='';
 });
})();
