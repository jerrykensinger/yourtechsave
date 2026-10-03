(function(){
 const form=document.getElementById('planFinder'),out=document.getElementById('finderResults'); if(!form||!out)return;
 const providers={
  visible:{name:'Visible',net:['verizon'],billing:['monthly','annual'],cost:true,simple:true,features:false},
  verizon:{name:'Verizon',net:['verizon'],billing:['monthly'],cost:false,simple:false,features:true},
  'us-mobile':{name:'US Mobile',net:['verizon','t-mobile','att','flexible'],billing:['monthly','annual'],cost:true,simple:true,features:true},
  'mint-mobile':{name:'Mint Mobile',net:['t-mobile'],billing:['annual'],cost:true,simple:false,features:false},
  att:{name:'AT&T',net:['att'],billing:['monthly'],cost:false,simple:false,features:true},
  't-mobile':{name:'T-Mobile',net:['t-mobile'],billing:['monthly'],cost:false,simple:false,features:true}
 };
 const pairs={
  'att|t-mobile':'/compare/att-vs-t-mobile.html','att|verizon':'/compare/verizon-vs-att.html','t-mobile|verizon':'/compare/verizon-vs-t-mobile.html',
  'mint-mobile|us-mobile':'/compare/us-mobile-vs-mint-mobile.html','mint-mobile|visible':'/compare/visible-vs-mint-mobile.html',
  't-mobile|visible':'/compare/visible-vs-t-mobile.html','att|visible':'/compare/visible-vs-att.html','us-mobile|visible':'/compare/visible-vs-us-mobile.html','verizon|visible':'/compare/visible-vs-verizon.html'
 };
 const val=n=>form.querySelector('input[name="'+n+'"]:checked')?.value||'';
 const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 function linkFor(a,b){return pairs[[a,b].sort().join('|')]||'/compare/'}
 function reason(id,network,billing,hotspot,priority,lines){
   const p=providers[id],r=[];
   if(network!=='any'&&p.net.includes(network))r.push(network==='flexible'?'supports multiple network options':'matches your network direction');
   if(billing==='annual'&&p.billing.includes('annual'))r.push('offers a bulk/annual path');
   if(billing==='monthly'&&p.billing.includes('monthly'))r.push('fits monthly billing');
   if(priority==='cost'&&p.cost)r.push('has lower-cost plan structures');
   if(priority==='features'&&p.features)r.push('has broader premium-feature options');
   if(priority==='simple'&&p.simple)r.push('has a comparatively simple billing structure');
   if(hotspot==='heavy'&&(id==='verizon'||id==='att'||id==='t-mobile'||id==='visible'||id==='us-mobile'))r.push('has plans worth reviewing for hotspot use');
   if(lines>=4&&(id==='verizon'||id==='att'||id==='t-mobile'))r.push('uses multi-line pricing worth checking for a family account');
   return r.slice(0,3);
 }
 form.addEventListener('submit',e=>{
   e.preventDefault();
   const lines=+document.getElementById('pfLines').value,current=document.getElementById('pfCurrent').value,network=val('network'),billing=val('billing'),hotspot=val('hotspot'),priority=val('priority');
   const scores={}; Object.keys(providers).forEach(id=>{const p=providers[id];let s=0;
     if(network==='any')s+=1; else if(p.net.includes(network))s+=4; else if(network==='flexible'&&p.net.includes('flexible'))s+=5;
     if(billing==='either')s+=1; else if(p.billing.includes(billing))s+=3; else if(billing==='monthly'&&id==='mint-mobile')s-=2;
     if(priority==='cost'&&p.cost)s+=3;if(priority==='features'&&p.features)s+=3;if(priority==='simple'&&p.simple)s+=3;
     if(hotspot==='heavy'&&['verizon','att','t-mobile','visible','us-mobile'].includes(id))s+=2;
     if(lines>=4&&['verizon','att','t-mobile'].includes(id))s+=2;
     if(current===id)s-=1;
     scores[id]=s;
   });
   let ids=Object.keys(scores).sort((a,b)=>scores[b]-scores[a]);
   if(current){ids=ids.filter(x=>x!==current);ids=[current,...ids];}
   const focus=ids.slice(0,4);
   let html='<div class="finder-summary"><div class="kicker">Research paths</div><h2>Start with these options</h2><p>These are not ranked winners. They are the providers most relevant to the preferences you selected.</p></div><div class="finder-card-grid">';
   focus.forEach(id=>{const rs=reason(id,network,billing,hotspot,priority,lines);html+='<div class="finder-result-card"><h3>'+esc(providers[id].name)+'</h3><p>'+(rs.length?esc(rs.join(' • ')):'Worth including in a broad comparison.')+'</p></div>'});
   html+='</div>';
   const comparisons=[]; const base=current||focus[0]; focus.filter(x=>x!==base).slice(0,3).forEach(x=>comparisons.push({a:base,b:x,url:linkFor(base,x)}));
   if(!comparisons.length&&focus.length>1)comparisons.push({a:focus[0],b:focus[1],url:linkFor(focus[0],focus[1])});
   html+='<div class="finder-next"><h3>Open the next comparison</h3><div class="comparison-strip">';
   comparisons.forEach(c=>html+='<a href="'+c.url+'">'+esc(providers[c.a].name)+' vs. '+esc(providers[c.b].name)+'</a>');
   html+='</div><p class="micro">If a direct matchup is not published yet, the link opens the main comparison hub.</p></div>';
   if(billing==='monthly'&&focus.includes('mint-mobile'))html+='<div class="notice"><strong>Billing note:</strong> Mint Mobile is still shown because its pricing can be competitive, but its lower regular effective rates generally require paying for multiple months up front.</div>';
   if(window.ytsTrack)window.ytsTrack('plan_finder_complete',{line_count:String(lines),network_preference:network,billing_preference:billing,hotspot_need:hotspot,priority:priority,debug_mode:true});
   out.innerHTML=html; out.scrollIntoView({behavior:'smooth',block:'start'});
 });
})();