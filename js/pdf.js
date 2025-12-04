// js/pdf.js
// Basit yazdırılabilir HTML üretir. Kullanıcı "PDF" olarak kaydedebilir.
export function openPrintable(order){
  const w = window.open("", "_blank", "noopener,noreferrer,width=1000,height=800");
  if(!w){ alert("Açılır pencere engellendi."); return; }
  const style = `
    body{ font:14px/1.5 system-ui,Segoe UI,Roboto,Helvetica,Arial; padding:20px; }
    h1{ margin:0 0 12px; }
    .muted{ color:#666; }
    .row{ display:grid; grid-template-columns: 120px 1fr; gap:10px; align-items:center;
          border:1px solid #ddd; border-radius:10px; padding:10px; margin:10px 0; }
    img{ width:120px; height:80px; object-fit:cover; background:#111; border-radius:8px; }
    .meta b{ display:block; }
    .foot{ margin-top:20px; color:#666; font-size:12px; }
  `;
  const esc = s => String(s||"").replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
  const rows = order.items.map((it,i)=>`
    <div class="row">
      ${it.thumb ? `<img src="${it.thumb}" />` : `<div style="width:120px;height:80px;background:#eee;border-radius:8px"></div>`}
      <div class="meta">
        <b>#${i+1} – ${esc(it.label)}</b>
        <div class="muted">Malzeme: ${esc(it.material)} | Adet: ${it.qty}</div>
        <div class="muted">Dosya: ${esc(it.url)}</div>
        ${it.params ? `<pre class="muted" style="white-space:pre-wrap">${esc(JSON.stringify(it.params))}</pre>` : ""}
        ${it.note ? `<div>Not: ${esc(it.note)}</div>` : ""}
      </div>
    </div>
  `).join("");
  w.document.write(`<!doctype html>
  <html><head><meta charset="utf-8"><title>Sipariş Özeti</title><style>${style}</style></head>
  <body>
    <h1>Sipariş Özeti</h1>
    <div class="muted">Proje: ${esc(order.project)} | Mahal: ${esc(order.zone)}</div>
    ${rows || "<p>Henüz ürün yok.</p>"}
    <div class="foot">Oluşturma: ${new Date().toLocaleString()}</div>
    <script>window.print();</script>
  </body></html>`);
  w.document.close();
}
