// js/app.js
import { PARTS } from "./parts.js";
import { store } from "./store.js";
import { openPrintable } from "./pdf.js";

const sel   = document.getElementById('partSelect');
const frm   = document.getElementById('fScene');
const qty   = document.getElementById('qty');
const qPlus = document.getElementById('qtyPlus');
const qMinus= document.getElementById('qtyMinus');
const mat   = document.getElementById('material');
const note  = document.getElementById('note');
const add   = document.getElementById('addBtn');
const list  = document.getElementById('orderList');
const proj  = document.getElementById('project');
const zone  = document.getElementById('zone');
const badge = document.getElementById('summaryBadge');
const printBtn = document.getElementById('printBtn');
const shareBtn = document.getElementById('shareBtn');
const clearBtn = document.getElementById('clearBtn');

// Populate select
function initSelect(){
  sel.innerHTML = PARTS.map(p => `<option value="${p.url}" data-key="${p.key}">${p.label}</option>`).join("");
}
// Load into iframe
function loadSelected(){
  const url = sel.value;
  frm.src = url;
}
sel.addEventListener('change', loadSelected);

// QTY controls
qPlus.addEventListener('click', () => { qty.value = String((parseInt(qty.value||"1",10)||1)+1) });
qMinus.addEventListener('click', () => {
  const v = Math.max(1, (parseInt(qty.value||"1",10)||1)-1);
  qty.value = String(v);
});

// Order store
store.load();
proj.value = store.data.project;
zone.value = store.data.zone;
proj.addEventListener('input', () => { store.data.project = proj.value; store.save(); });
zone.addEventListener('input', () => { store.data.zone = zone.value; store.save(); });

function render(){
  list.innerHTML = "";
  if(!store.data.items.length){
    list.innerHTML = `<div class="card">Henüz ürün eklenmedi.</div>`;
  }else{
    for(const it of store.data.items){
      const el = document.createElement('div');
      el.className = "item";
      el.innerHTML = `
        ${it.thumb ? `<img class="thumb" src="${it.thumb}"/>` : `<div class="thumb"></div>`}
        <div class="meta">
          <div class="title">${it.label}</div>
          <div class="sub">Malzeme: ${it.material} • Adet: ${it.qty}</div>
          ${it.params ? `<div class="sub">Parametreler: <code>${escapeHtml(JSON.stringify(it.params))}</code></div>` : ""}
          ${it.note ? `<div>Not: ${escapeHtml(it.note)}</div>` : ""}
        </div>
        <div class="ops">
          <button class="btn -danger" data-del="${it.id}">Sil</button>
        </div>
      `;
      list.appendChild(el);
    }
  }
  const count = store.data.items.length;
  const qtySum = store.data.items.reduce((a,b)=>a+(b.qty||0), 0);
  badge.textContent = `${count} parça, ${qtySum} adet`;

  // Bind delete buttons
  list.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      store.removeItem(btn.getAttribute('data-del'));
      render();
    });
  });
}
function escapeHtml(s){ return String(s).replace(/[&<>]/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); }

// Add to order: ask child for state via postMessage (optional)
function getChildState(timeout=800){
  return new Promise((resolve) => {
    let done = false;
    const to = setTimeout(()=>{ if(!done){ done=true; resolve(null); } }, timeout);
    function onMsg(ev){
      const d = ev.data||{};
      if(d.type === 'state'){ 
        window.removeEventListener('message', onMsg);
        if(!done){ done=true; clearTimeout(to); resolve(d); }
      }
    }
    window.addEventListener('message', onMsg);
    // request
    try{ frm.contentWindow.postMessage({type:'getState'}, '*'); }catch(e){ /* ignore */ }
  });
}

add.addEventListener('click', async () => {
  const selIdx = sel.selectedIndex;
  const meta = PARTS[selIdx];
  if(!meta){ return; }

  // Get state from child (if child-bridge.js is present it will answer)
  const state = await getChildState();
  const id = "it_" + Math.random().toString(36).slice(2,9);
  const item = {
    id,
    key: meta.key,
    label: meta.label,
    url: sel.value,
    material: mat.value,
    qty: Math.max(1, parseInt(qty.value||"1",10)||1),
    params: state?.params || null,
    thumb: state?.thumb || null,
    note: note.value.trim()
  };
  store.addItem(item);
  note.value = "";
  render();
});

printBtn.addEventListener('click', () => openPrintable({ project:proj.value, zone:zone.value, items:store.data.items }));

shareBtn.addEventListener('click', async () => {
  const text = buildShareText();
  if(navigator.share){
    try{ await navigator.share({ title: "Sipariş Özeti", text }); }
    catch(e){ /* user cancelled */ }
  }else{
    try{
      await navigator.clipboard.writeText(text);
      alert("Özet panoya kopyalandı!");
    }catch(e){
      alert("Paylaşım desteklenmiyor. Metni elle kopyalayın:\n\n" + text);
    }
  }
});
function buildShareText(){
  const lines = [];
  lines.push(`Proje: ${proj.value||"-"} | Mahal: ${zone.value||"-"}`);
  store.data.items.forEach((it, i) => {
    lines.push(`${i+1}) ${it.label} | Malzeme: ${it.material} | Adet: ${it.qty}` + (it.params ? ` | P=${JSON.stringify(it.params)}` : ""));
  });
  return lines.join("\n");
}

clearBtn.addEventListener('click', () => {
  if(confirm("Tüm siparişi silmek istiyor musunuz?")){
    store.clear();
    render();
  }
});

// Init
initSelect();
loadSelected();
render();

// iframe'den gelen mesajları dinle
window.addEventListener('message', (e)=>{
  if(e.data?.type === 'child-ready'){ 
    console.log("Child ready:", e.data.title);
  }
  // Boyut ve alan bilgileri güncellendiğinde
  if(e.data?.type === 'dimensions-update'){
    updateDimensionsDisplay(e.data);
  }
});

// Boyut ve alan bilgilerini güncelle
function updateDimensionsDisplay(data){
  // Boyutlar
  const dimDisplay = document.getElementById('dimensionsDisplay');
  if(dimDisplay && data.dimensions){
    dimDisplay.innerHTML = `
      <span>W: <strong>${data.dimensions.w} cm</strong></span>
      <span>H: <strong>${data.dimensions.h} cm</strong></span>
      <span>L: <strong>${data.dimensions.l} cm</strong></span>
    `;
  }
  
  // Alan bilgileri
  const areaInfo = document.getElementById('areaInfo');
  if(areaInfo && data.area){
    areaInfo.innerHTML = `
      <div class="area-item">
        <span class="area-label">Dış Alan:</span>
        <span class="area-value">${data.area.outer} m²</span>
      </div>
      <div class="area-item">
        <span class="area-label">İç Alan:</span>
        <span class="area-value">${data.area.inner || 'N/A'} m²</span>
      </div>
      <div class="area-item">
        <span class="area-label">Atık Oranı:</span>
        <span class="area-value">${data.area.waste || '+0.0%'}</span>
      </div>
    `;
  }
}
