// js/store.js
const LS_KEY = "order.store.v1";

function read(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)||"{}") }catch(e){ return {} } }
function write(s){ localStorage.setItem(LS_KEY, JSON.stringify(s)); }

export const store = {
  data: { project:"", zone:"", items:[] },
  load(){
    const s = read();
    this.data = { project: s.project||"", zone: s.zone||"", items: s.items||[] };
    return this.data;
  },
  save(){ write(this.data); },
  addItem(item){
    this.data.items.push(item);
    this.save();
  },
  removeItem(id){
    this.data.items = this.data.items.filter(x => x.id !== id);
    this.save();
  },
  clear(){
    this.data.items = [];
    this.save();
  }
}
