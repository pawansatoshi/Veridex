(function(){
  function esc(v){return String(v??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]||c))}
  function createFlow(){
    if(document.getElementById("vx-spatial")) return;
    const report=document.getElementById("report");
    if(!report) return;
    const anchor=report.querySelector(".summary");
    if(!anchor) return;
    const section=document.createElement("section");
    section.className="vx-spatial";
    section.id="vx-spatial";
    section.setAttribute("aria-label","Evidence flow visualization");
    section.innerHTML=`<div class="vx-spatial-head"><div><div class="kicker">Evidence flow</div><h3>From contract to conclusion.</h3></div><p>Visual state follows the returned analysis — never the other way around.</p></div><div class="vx-flow" role="list"><div class="vx-node" data-step="0" role="listitem"><b>01 · Contract</b><span data-value="contract">Target</span></div><div class="vx-node" data-step="1" role="listitem"><b>02 · Code</b><span data-value="code">Resolved code</span></div><div class="vx-node" data-step="2" role="listitem"><b>03 · Evidence</b><span data-value="evidence">Verification</span></div><div class="vx-node" data-step="3" role="listitem"><b>04 · Capability</b><span data-value="capability">4 observations</span></div><div class="vx-node" data-step="4" role="listitem"><b>05 · Authority</b><span data-value="authority">Control path</span></div><div class="vx-node" data-step="5" role="listitem"><b>06 · Confidence</b><span data-value="confidence">Conclusive state</span></div></div><div class="vx-graph" id="vx-graph" aria-label="Proxy code relationship"></div><p class="vx-spatial-note" id="vx-note">Waiting for an analysis result.</p></section>`;
    anchor.insertAdjacentElement("afterend",section);
  }
  function setStage(n){
    document.querySelectorAll("#vx-spatial .vx-node").forEach((node,i)=>{node.classList.toggle("active",i===n);node.classList.toggle("done",i<n)});
    document.querySelectorAll("#vx-spatial .vx-node").forEach((node,i)=>{if(i<n)node.nextElementSibling?.classList.add("lit")});
  }
  function render(data,address){
    createFlow();
    const box=document.getElementById("vx-spatial"); if(!box)return;
    const a=data?.result||data||{}; const p=a.proxy||{}; const v=a.verification||{}; const ps=a.providerStatus||{};
    const caps=a.capabilities||[];
    box.dataset.status=a.conclusive?"conclusive":(caps.some(c=>c.result==="error")?"error":"inconclusive");
    box.querySelector('[data-value="contract"]').textContent=(a.contract?.contractAddress||address||"Target").slice(0,10)+"…";
    box.querySelector('[data-value="code"]').textContent=p.codeAddress&&p.codeAddress!==a.contract?.contractAddress?"Implementation resolved":"Contract code";
    box.querySelector('[data-value="evidence"]').textContent=v.status||"Evidence state";
    box.querySelector('[data-value="capability"]').textContent=caps.length+" observations";
    const authority=caps.filter(c=>c.evidence&&c.evidence.authority).length;
    box.querySelector('[data-value="authority"]').textContent=authority?authority+" control path"+(authority>1?"s":""):"Authority fields";
    box.querySelector('[data-value="confidence"]').textContent=Math.round((a.confidence||0)*100)+"% · "+(a.conclusive?"conclusive":"uncertain");
    const graph=box.querySelector("#vx-graph");
    const state=a.contract?.contractAddress||address||""; const code=a.contract?.codeAddress||p.codeAddress||state;
    graph.innerHTML=`<span class="vx-graph-node">state · ${esc(state)}</span><span class="vx-graph-arrow">→</span><span class="vx-graph-node">code · ${esc(code)}</span><span class="vx-graph-arrow">→</span><span class="vx-graph-node">${esc(p.status||"direct composition")}</span>`;
    box.querySelector("#vx-note").textContent=p.status&&p.status!=="direct"?"The graph separates the address holding live state from the code address used for capability evidence.":"No proxy composition was established; the requested contract address remains the code and state context.";
    setStage(0);
    [1,2,3,4,5].forEach((stage,i)=>setTimeout(()=>setStage(stage),220*(i+1)));
  }
  window.VeridexSpatial={createFlow,setStage,render};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",createFlow);else createFlow();
})();
