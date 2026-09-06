(function(){
  const path=location.pathname;
  const back=document.getElementById('floatingBack');
  if(back){const update=()=>back.classList.toggle('visible',scrollY>120);addEventListener('scroll',update,{passive:true});update();back.addEventListener('click',()=>{if(history.length>1)history.back();else location.href=path.startsWith('/telegraph')?'/telegraph/':'/';});}

  document.querySelectorAll('[data-expand]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.getAttribute('data-expand');const el=document.getElementById(id);if(!el)return;const open=el.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));const label=btn.querySelector('[data-expand-label]');if(label)label.textContent=open?'Hide evidence':'View evidence →';}));
  document.querySelectorAll('[data-example-address]').forEach(btn=>btn.addEventListener('click',()=>{const input=document.querySelector(btn.getAttribute('data-target')||'#address');if(input){input.value=btn.getAttribute('data-example-address');input.focus();}}));

  // Mobile-first navigation: preserve all links, but place them behind a predictable menu.
  document.querySelectorAll('.ux-nav').forEach(nav=>{
    if(nav.querySelector('.ux-menu-toggle'))return;
    const toggle=document.createElement('button');
    toggle.className='ux-menu-toggle';
    toggle.type='button';
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Open navigation');
    toggle.innerHTML='<span aria-hidden="true">☰</span>';
    nav.appendChild(toggle);
    const links=nav.querySelector('.ux-navlinks');
    if(!links)return;
    const close=()=>{nav.classList.remove('nav-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');toggle.innerHTML='<span aria-hidden="true">☰</span>';};
    toggle.addEventListener('click',()=>{const open=nav.classList.toggle('nav-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');toggle.innerHTML=open?'<span aria-hidden="true">×</span>':'<span aria-hidden="true">☰</span>';});
    links.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
    addEventListener('resize',()=>{if(innerWidth>760)close()},{passive:true});
  });

  // Guided progress for the two analysis experiences without changing their request logic.
  function attachProgress(form, mode){
    if(!form || form.dataset.progressAttached)return;
    form.dataset.progressAttached='1';
    const status=document.createElement('div');
    status.className='ux-live-status';
    status.setAttribute('aria-live','polite');
    status.innerHTML='<strong></strong><span></span>';
    form.parentNode.insertBefore(status,form.nextSibling);
    const title=status.querySelector('strong');
    const detail=status.querySelector('span');
    const stages=mode==='track3'[
      ? ['Reviewing contract','Validating address and reading deterministic evidence…','Requesting live Telegraph intelligence…','Comparing independent signals…','Preparing the decision…']
      : ['Analyzing contract','Validating address and reading structure…','Resolving proxy and verification evidence…','Inspecting capabilities…','Preparing the assessment…']
    ];
  }

  // Lightweight implementation of guided progress; it deliberately observes existing result DOM.
  function setupGuidedProgress(form, mode){
    if(!form || form.dataset.guided)return;
    form.dataset.guided='1';
    const status=document.createElement('div');
    status.className='ux-live-status';
    status.setAttribute('aria-live','polite');
    const title=document.createElement('strong');
    const detail=document.createElement('span');
    status.append(title,document.createTextNode(' '),detail);
    form.parentNode.insertBefore(status,form.nextSibling);
    const result=document.getElementById(mode==='track3'?'decision':'result');
    let timer=null,index=0;
    const stages=mode==='track3'
      ? [['Reviewing contract','Validating the address and reading primary evidence.'],['Reading on-chain evidence','Resolving structure, capabilities, and confidence.'],['Consulting Telegraph','Requesting live independent intelligence.'],['Comparing signals','Checking agreement and conflict state.'],['Finalizing assessment','Preparing the evidence-backed decision.']]
      : [['Analyzing contract','Validating the address and reading structure.'],['Resolving evidence','Checking proxy composition and verification.'],['Inspecting capabilities','Evaluating ownership, upgradeability, pause, and mint.'],['Assembling assessment','Preparing the capability surface.']];
    const stop=()=>{if(timer){clearInterval(timer);timer=null}status.classList.remove('show')};
    form.addEventListener('submit',()=>{
      index=0;status.classList.add('show');title.textContent=stages[0][0];detail.textContent=stages[0][1];
      if(timer)clearInterval(timer);
      timer=setInterval(()=>{if(result && result.classList.contains('show')){stop();return}index=Math.min(index+1,stages.length-1);title.textContent=stages[index][0];detail.textContent=stages[index][1]},900);
      setTimeout(()=>{if(result && result.classList.contains('show'))stop()},10000);
    },true);
    const observer=new MutationObserver(()=>{if(result && result.classList.contains('show'))stop()});
    if(result)observer.observe(result,{attributes:true,attributeFilter:['class']});
  }
  setupGuidedProgress(document.querySelector('#form'),path.includes('/telegraph/application/')?'track3':'analyze');

  // Track 3: keep the raw provider payload available, but make it progressive disclosure.
  if(path.includes('/telegraph/application/')){
    const review=document.querySelector('#tgReview');
    const box=review&&review.closest('.review');
    if(box && !document.getElementById('tgTechnicalToggle')){
      const button=document.createElement('button');
      button.id='tgTechnicalToggle';
      button.type='button';
      button.className='ux-btn small';
      button.setAttribute('aria-expanded','false');
      button.textContent='View technical Telegraph response →';
      box.style.display='none';
      box.parentNode.insertBefore(button,box.nextSibling);
      button.addEventListener('click',()=>{const open=box.style.display!=='none';box.style.display=open?'none':'block';button.setAttribute('aria-expanded',String(!open));button.textContent=open?'View technical Telegraph response →':'Hide technical Telegraph response ←';});
    }
    const note=document.getElementById('tgNote');
    if(note){const observer=new MutationObserver(()=>{const text=note.textContent||'';if(text.includes('not configured/available'))note.textContent='Telegraph is unavailable for this deployment. Primary deterministic evidence remains valid; no negative finding is inferred from the provider state.'});observer.observe(note,{childList:true,characterData:true,subtree:true});}
  }
})();