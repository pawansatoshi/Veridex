(function(){
  const path=location.pathname;
  const back=document.getElementById('floatingBack');
  if(back){const update=()=>back.classList.toggle('visible',scrollY>120);addEventListener('scroll',update,{passive:true});update();back.addEventListener('click',()=>{if(history.length>1)history.back();else location.href=path.startsWith('/telegraph')?'/telegraph/':'/';});}
  document.querySelectorAll('[data-expand]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.getAttribute('data-expand');const el=document.getElementById(id);if(!el)return;const open=el.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));const label=btn.querySelector('[data-expand-label]');if(label)label.textContent=open?'Hide evidence':'View evidence →';}));
  document.querySelectorAll('[data-example-address]').forEach(btn=>btn.addEventListener('click',()=>{const input=document.querySelector(btn.getAttribute('data-target')||'#address');if(input){input.value=btn.getAttribute('data-example-address');input.focus();}}));
})();