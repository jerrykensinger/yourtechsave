
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
