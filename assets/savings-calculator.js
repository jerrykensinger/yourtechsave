(function(){
 const form=document.getElementById('savingsCalculator'),out=document.getElementById('savingsResults'); if(!form||!out)return;
 const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Math.abs(n)||0);
 const pct=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(Math.abs(n)||0)+'%';
 form.addEventListener('submit',e=>{
   e.preventDefault();
   const current=Math.max(0,parseFloat(document.getElementById('scCurrent').value)||0);
   const alternative=Math.max(0,parseFloat(document.getElementById('scAlternative').value)||0);
   const lines=Math.max(1,parseInt(document.getElementById('scLines').value,10)||1);
   const switchCost=Math.max(0,parseFloat(document.getElementById('scSwitchCost').value)||0);
   if(current<=0){out.innerHTML='<div class="notice"><strong>Enter your current monthly service cost.</strong></div>';return;}
   const monthly=current-alternative,annual=monthly*12,twoYear=monthly*24-switchCost;
   const currentPer=current/lines,altPer=alternative/lines;
   const percent=current?monthly/current*100:0;
   const saving=monthly>0,even=Math.abs(monthly)<0.005;
   let headline,detail,tone='green';
   if(saving){headline=money(monthly)+' estimated monthly savings';detail=money(annual)+' per year before one-time switching costs.'}
   else if(even){headline='About the same monthly service cost';detail='The recurring service prices are essentially equal, so features and coverage become the main comparison.';tone='neutral'}
   else{headline=money(monthly)+' more per month';detail='The alternative costs '+money(Math.abs(annual))+' more per year before considering feature differences.';tone='neutral'}
   let breakeven='';
   if(saving&&switchCost>0){const months=switchCost/monthly;breakeven='<div class="metric"><span class="micro">Estimated break-even</span><strong>'+months.toFixed(months<10?1:0)+' months</strong><span>to recover '+money(switchCost)+' in one-time switching costs</span></div>'}
   else if(saving){breakeven='<div class="metric"><span class="micro">Estimated break-even</span><strong>Immediate</strong><span>No one-time switching cost entered</span></div>'}
   else{breakeven='<div class="metric"><span class="micro">Break-even</span><strong>—</strong><span>The alternative does not reduce recurring service cost</span></div>'}
   out.innerHTML='<div class="savings-summary '+tone+'"><div class="kicker">Estimated difference</div><h2>'+headline+'</h2><p>'+detail+'</p></div>'+
   '<div class="savings-metrics"><div class="metric"><span class="micro">Current cost per line</span><strong>'+money(currentPer)+'</strong><span>per month</span></div>'+
   '<div class="metric"><span class="micro">Alternative cost per line</span><strong>'+money(altPer)+'</strong><span>per month</span></div>'+
   '<div class="metric '+(saving?'green':'')+'"><span class="micro">'+(saving?'Annual savings':'Annual difference')+'</span><strong>'+money(annual)+'</strong><span>'+(saving?pct(percent)+' lower recurring service cost':even?'No material recurring difference':pct(percent)+' higher recurring service cost')+'</span></div>'+
   '<div class="metric '+(saving&&twoYear>0?'green':'')+'"><span class="micro">24-month net difference</span><strong>'+money(twoYear)+'</strong><span>'+(twoYear>0?'after entered switching costs':twoYear<0?'additional cost after entered switching costs':'no net difference')+'</span></div>'+breakeven+'</div>'+
   '<div class="related"><strong>Next:</strong> <a href="/compare/plan-finder.html">narrow the providers worth comparing</a> or <a href="/compare/">open the wireless comparison center</a>.</div>';
   if(window.ytsTrack){window.ytsTrack('calculator_used',{calculator_type:'cell_phone_savings'});window.ytsTrack('savings_calculator_complete',{line_count:String(lines),has_switching_cost:switchCost>0?'yes':'no',result_direction:saving?'savings':even?'same':'higher_cost',debug_mode:true})}
   out.scrollIntoView({behavior:'smooth',block:'start'});
 });
})();