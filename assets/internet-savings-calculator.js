(function(){
 const form=document.getElementById('internetSavingsCalculator'),out=document.getElementById('internetSavingsResults'); if(!form||!out)return;
 const num=id=>Math.max(0,parseFloat(document.getElementById(id)?.value)||0);
 const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Math.abs(n)||0);
 const resultLabel=(n,savingLabel,costLabel)=>n>0?savingLabel:n<0?costLabel:'No net difference';
 function signedCopy(n,savingText,costText,equalText){return n>0?savingText:n<0?costText:equalText}
 form.addEventListener('submit',e=>{
   e.preventDefault();
   const curService=num('isCurrentService'),curEquip=num('isCurrentEquipment'),altService=num('isAltService'),altEquip=num('isAltEquipment');
   const promoService=num('isPromoService'),promoMonths=Math.min(36,Math.max(0,Math.floor(num('isPromoMonths')))),switchCost=num('isSwitchCost');
   if(curService<=0||altService<=0){out.innerHTML='<div class="notice"><strong>Enter both the current and alternative regular monthly service costs.</strong></div>';return;}
   const currentMonthly=curService+curEquip,regularMonthly=altService+altEquip;
   const usePromo=promoService>0&&promoMonths>0;
   const promoMonthly=(usePromo?promoService:altService)+altEquip;
   const altCostForMonths=months=>{
     const promoUsed=usePromo?Math.min(months,promoMonths):0;
     return promoMonthly*promoUsed+regularMonthly*(months-promoUsed)+switchCost;
   };
   const current12=currentMonthly*12,current24=currentMonthly*24;
   const alt12=altCostForMonths(12),alt24=altCostForMonths(24);
   const diff12=current12-alt12,diff24=current24-alt24,postPromoMonthly=currentMonthly-regularMonthly;
   const yearTone=diff12>0?'green':'neutral',twoTone=diff24>0?'green':'neutral';
   let promoNote=usePromo?'<div class="notice"><strong>Promo modeled:</strong> '+money(promoService)+'/mo service for '+promoMonths+' month'+(promoMonths===1?'':'s')+', then '+money(altService)+'/mo regular service, plus any monthly equipment entered.</div>':'<div class="notice"><strong>No introductory rate modeled.</strong> The alternative uses its regular monthly price for the full comparison.</div>';
   let warning='';
   if(usePromo&&postPromoMonthly<0&&diff12>0)warning='<div class="notice"><strong>Watch the post-promo price.</strong> The alternative saves money in the first year under the introductory rate but costs '+money(postPromoMonthly)+' more per month after the promotion ends.</div>';
   out.innerHTML='<div class="savings-summary '+yearTone+'"><div class="kicker">First-year result</div><h2>'+resultLabel(diff12,money(diff12)+' estimated first-year savings',money(diff12)+' more in the first year')+'</h2><p>'+signedCopy(diff12,'The alternative is lower over the first 12 months after the one-time costs you entered.','The alternative is higher over the first 12 months after the one-time costs you entered.','The first-year costs are essentially equal.')+'</p></div>'+
   '<div class="savings-metrics"><div class="metric"><span class="micro">Current monthly total</span><strong>'+money(currentMonthly)+'</strong><span>service + recurring equipment</span></div>'+
   '<div class="metric"><span class="micro">Alternative regular monthly total</span><strong>'+money(regularMonthly)+'</strong><span>after any introductory rate ends</span></div>'+
   '<div class="metric '+yearTone+'"><span class="micro">12-month net difference</span><strong>'+money(diff12)+'</strong><span>'+signedCopy(diff12,'estimated savings','additional cost','no net difference')+'</span></div>'+
   '<div class="metric '+twoTone+'"><span class="micro">24-month net difference</span><strong>'+money(diff24)+'</strong><span>'+signedCopy(diff24,'estimated savings','additional cost','no net difference')+'</span></div>'+
   '<div class="metric '+(postPromoMonthly>0?'green':'')+'"><span class="micro">After the promo</span><strong>'+money(postPromoMonthly)+'/mo</strong><span>'+signedCopy(postPromoMonthly,'lower recurring cost','higher recurring cost','same recurring cost')+'</span></div>'+
   '<div class="metric"><span class="micro">One-time costs modeled</span><strong>'+money(switchCost)+'</strong><span>installation, activation or cancellation costs entered</span></div></div>'+
   promoNote+warning+
   '<div class="related"><strong>Next:</strong> confirm address availability with the <a href="/internet/finder.html">Home Internet Finder</a>, review <a href="/internet/providers.html">current provider records</a>, and compare speed, latency and data policies before switching.</div>';
   if(window.ytsTrack){window.ytsTrack('calculator_used',{calculator_type:'home_internet_savings'});window.ytsTrack('internet_savings_calculator_complete',{has_promo:usePromo?'yes':'no',has_equipment:(curEquip>0||altEquip>0)?'yes':'no',has_switching_cost:switchCost>0?'yes':'no',year1_direction:diff12>0?'savings':diff12<0?'higher_cost':'same',month24_direction:diff24>0?'savings':diff24<0?'higher_cost':'same'})}
   out.scrollIntoView({behavior:'smooth',block:'start'});
 });
})();