(function(){
 const form=document.getElementById('internetFinder'),out=document.getElementById('internetFinderResults');
 function trackExternal(){
   document.addEventListener('pointerdown',e=>{
     const a=e.target.closest('.internet-provider-outbound'); if(!a)return;
     if(window.ytsTrack)window.ytsTrack('internet_provider_click',{provider_name:a.dataset.provider||'unknown',link_type:'official_availability'});
   },true);
 }
 trackExternal();
 if(!form||!out)return;
 const val=n=>form.querySelector('input[name="'+n+'"]:checked')?.value||'';
 const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 form.addEventListener('submit',e=>{
   e.preventDefault();
   const zip=(document.getElementById('ifZip').value||'').trim();
   if(!/^\d{5}$/.test(zip)){out.innerHTML='<div class="notice"><strong>Enter a 5-digit ZIP code.</strong></div>';return;}
   const cost=Math.max(0,parseFloat(document.getElementById('ifCost').value)||0);
   const people=parseInt(document.getElementById('ifPeople').value,10)||1;
   const current=document.getElementById('ifCurrent').value;
   const usage=val('internetUsage'),priority=val('internetPriority'),sat=val('satelliteInterest');
   const paths=[];
   if(priority==='speed'||priority==='reliability'||usage==='heavy')paths.push({title:'Check fiber first',text:'If fiber is available at the address, compare its regular price, upload speed, equipment and installation terms.'});
   paths.push({title:'Check local cable and other wired providers',text:'Use the FCC address lookup to identify cable, fiber, DSL or other fixed providers that report service at the exact location.'});
   if(priority==='price'||current==='cable'||current==='dsl')paths.push({title:'Check 5G / fixed wireless',text:'T-Mobile Home Internet and Verizon 5G Home can be worth checking where address-level capacity is available.'});
   if(sat==='yes'||(sat==='backup'&&(current==='dsl'||current==='satellite'||usage!=='heavy')))paths.push({title:'Include satellite in the shortlist',text:'Compare Starlink, Hughesnet and Viasat when wired choices are limited, expensive or unreliable. Pay close attention to latency, equipment and data policies.'});
   const yearly=cost?'<div class="metric"><span class="micro">Current internet cost</span><strong>$'+Math.round(cost*12).toLocaleString()+'</strong><span>per year based on the monthly amount entered</span></div>':'';
   out.innerHTML='<div class="finder-summary"><div class="kicker">ZIP '+esc(zip)+'</div><h2>Research these paths first</h2><p>These are not claims that a provider serves your home. Exact availability still needs an address check.</p></div>'+
   '<div class="finder-card-grid">'+paths.map(p=>'<div class="finder-result-card"><h3>'+esc(p.title)+'</h3><p>'+esc(p.text)+'</p></div>').join('')+'</div>'+
   (yearly?'<div class="savings-metrics">'+yearly+'</div>':'')+
   '<div class="finder-next"><h3>1. Find the local providers at your address</h3><p>The FCC map lists providers, connection technology and maximum advertised speeds reported for individual locations.</p><a class="btn btn-primary internet-provider-outbound" data-provider="FCC National Broadband Map" target="_blank" rel="external" href="https://broadbandmap.fcc.gov/home">Open FCC Broadband Map →</a></div>'+
   '<div class="finder-next"><h3>2. Check fixed-wireless availability</h3><div class="internet-provider-grid"><a class="provider-check-card internet-provider-outbound" data-provider="T-Mobile Home Internet" target="_blank" rel="external" href="https://www.t-mobile.com/home-internet/eligibility.html"><strong>T-Mobile Home Internet</strong><span>Address eligibility check</span></a><a class="provider-check-card internet-provider-outbound" data-provider="Verizon 5G Home" target="_blank" rel="external" href="https://www.verizon.com/home/internet/5g/"><strong>Verizon 5G Home</strong><span>Address availability check</span></a></div></div>'+
   (sat!=='no'?'<div class="finder-next"><h3>3. Check satellite if it fits the situation</h3><div class="internet-provider-grid"><a class="provider-check-card internet-provider-outbound" data-provider="Starlink" target="_blank" rel="external" href="https://starlink.com/res-plans"><strong>Starlink</strong><span>Residential availability</span></a><a class="provider-check-card internet-provider-outbound" data-provider="Hughesnet" target="_blank" rel="external" href="https://www.hughesnet.com/home-satellite-internet-plans"><strong>Hughesnet</strong><span>Satellite / Fusion availability</span></a><a class="provider-check-card internet-provider-outbound" data-provider="Viasat" target="_blank" rel="external" href="https://www.viasat.com/"><strong>Viasat</strong><span>Residential availability</span></a></div><p><a href="/internet/satellite-internet.html">Read the satellite internet guide →</a></p></div>':'')+
   '<div class="related"><strong>Then compare:</strong> regular monthly price, price after promotions, equipment, installation, upload/download speeds, latency, data policies and contract/cancellation terms.</div>';
   if(window.ytsTrack)window.ytsTrack('internet_finder_complete',{household_size:people>=5?'5+':String(people),current_type:current,usage_profile:usage,priority:priority,satellite_interest:sat,has_current_cost:cost>0?'yes':'no'});
   out.scrollIntoView({behavior:'smooth',block:'start'});
 });
})();