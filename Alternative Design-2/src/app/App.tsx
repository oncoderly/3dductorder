import { useState } from 'react';
import { Grid3x3, Palette, Eye, Settings, Layers, Wrench, Box, Monitor } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('sahne');
  
  const [gridGoster, setGridGoster] = useState(false);
  const [eksenlerGoster, setEksenlerGoster] = useState(false);
  const [arkaplanRenk, setArkaplanRenk] = useState(50);
  
  const [diameter, setDiameter] = useState(25);
  const [length, setLength] = useState(10);
  const [thickness, setThickness] = useState(0.6);
  
  const [kenarCizgileri, setKenarCizgileri] = useState(true);
  const [olculendirme, setOlculendirme] = useState(true);
  const [flanslarGoster, setFlanslarGoster] = useState(true);
  const [gorusuKoru, setGorusuKoru] = useState(true);

  const QuickControl = ({ 
    label, 
    value, 
    setValue, 
    unit, 
    step = 5, 
    min = 0, 
    max = 100 
  }: { 
    label: string; 
    value: number; 
    setValue: (v: number) => void; 
    unit: string; 
    step?: number; 
    min?: number; 
    max?: number; 
  }) => (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-2 border border-emerald-500/30">
      <div className="text-xs text-emerald-400 mb-1.5 font-medium">{label}</div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setValue(Math.max(min, value - step))}
          className="flex-1 h-8 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold border border-red-500/50 active:scale-95 transition-all"
        >
          −
        </button>
        <div className="flex items-center gap-1 bg-black/30 rounded px-2 h-8 min-w-[70px] justify-center border border-slate-700">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-12 bg-transparent text-white text-sm outline-none text-center"
          />
          <span className="text-emerald-400 text-xs font-medium">{unit}</span>
        </div>
        <button
          onClick={() => setValue(Math.min(max, value + step))}
          className="flex-1 h-8 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold border border-emerald-500/50 active:scale-95 transition-all"
        >
          +
        </button>
      </div>
    </div>
  );

  const Toggle = ({ 
    checked, 
    onChange, 
    label 
  }: { 
    checked: boolean; 
    onChange: (v: boolean) => void; 
    label: string; 
  }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
        checked 
          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
          : 'bg-slate-800/50 border-slate-700 text-slate-400'
      }`}
    >
      <span className="text-xs font-medium">{label}</span>
      <div className={`w-9 h-5 rounded-full relative transition-all ${
        checked ? 'bg-emerald-500' : 'bg-slate-600'
      }`}>
        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-all ${
          checked ? 'left-5' : 'left-0.75'
        }`} />
      </div>
    </button>
  );

  const TabButton = ({ 
    id, 
    icon: Icon, 
    label 
  }: { 
    id: string; 
    icon: any; 
    label: string; 
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex flex-col items-center gap-1 p-2 transition-all relative ${
        activeTab === id 
          ? 'text-emerald-400' 
          : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{label}</span>
      {activeTab === id && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500" />
      )}
    </button>
  );

  const ActionButton = ({ 
    icon: Icon, 
    label 
  }: { 
    icon: any; 
    label: string; 
  }) => (
    <button className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border border-slate-700 text-left transition-all active:scale-98">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <span className="text-xs text-slate-200 font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 p-2">
      <div className="max-w-md mx-auto">
        
        {/* Main Container */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-700/50 bg-slate-900/50">
            <TabButton id="sahne" icon={Monitor} label="Sahne" />
            <TabButton id="boyut" icon={Wrench} label="Boyut" />
            <TabButton id="gorunum" icon={Eye} label="Görünüm" />
            <TabButton id="diger" icon={Box} label="Diğer" />
          </div>

          {/* Tab Content */}
          <div className="p-3 min-h-[400px]">
            
            {/* Sahne Tab */}
            {activeTab === 'sahne' && (
              <div className="space-y-2.5">
                <div className="text-xs text-emerald-400 font-bold mb-2 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-cyan-500 rounded-full" />
                  SAHNE AYARLARI
                </div>
                <Toggle
                  checked={gridGoster}
                  onChange={setGridGoster}
                  label="Grid Göster"
                />
                <Toggle
                  checked={eksenlerGoster}
                  onChange={setEksenlerGoster}
                  label="Eksenler Göster"
                />
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-2.5 border border-emerald-500/30 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-emerald-400 font-medium">Arkaplan Rengi</span>
                    <span className="text-xs text-white font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/50">{arkaplanRenk}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={arkaplanRenk}
                    onChange={(e) => setArkaplanRenk(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-emerald-400 [&::-webkit-slider-thumb]:to-cyan-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/50 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                  />
                </div>
              </div>
            )}

            {/* Boyut Tab */}
            {activeTab === 'boyut' && (
              <div className="space-y-2.5">
                <div className="text-xs text-emerald-400 font-bold mb-2 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-cyan-500 rounded-full" />
                  BOYUTLANDIRMA
                </div>
                <QuickControl
                  label="Çap (Ø)"
                  value={diameter}
                  setValue={setDiameter}
                  unit="cm"
                  step={5}
                  min={0}
                  max={200}
                />
                <QuickControl
                  label="Uzunluk (L)"
                  value={length}
                  setValue={setLength}
                  unit="cm"
                  step={5}
                  min={0}
                  max={200}
                />
                <QuickControl
                  label="Sac Kalınlığı (t)"
                  value={thickness}
                  setValue={setThickness}
                  unit="mm"
                  step={0.1}
                  min={0}
                  max={10}
                />
                <button className="w-full mt-3 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 active:scale-98 transition-all">
                  <Grid3x3 className="w-4 h-4" />
                  Sac Kalınlığı Skalası
                </button>
              </div>
            )}

            {/* Görünüm Tab */}
            {activeTab === 'gorunum' && (
              <div className="space-y-2.5">
                <div className="text-xs text-emerald-400 font-bold mb-2 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-cyan-500 rounded-full" />
                  GÖRÜNÜM SEÇENEKLERİ
                </div>
                <Toggle
                  checked={kenarCizgileri}
                  onChange={setKenarCizgileri}
                  label="Kenar Çizgileri"
                />
                <Toggle
                  checked={olculendirme}
                  onChange={setOlculendirme}
                  label="Ölçülendirme"
                />
                <Toggle
                  checked={flanslarGoster}
                  onChange={setFlanslarGoster}
                  label="Flanslar Göster"
                />
                <Toggle
                  checked={gorusuKoru}
                  onChange={setGorusuKoru}
                  label="Görüşü Koru"
                />
              </div>
            )}

            {/* Diğer Tab */}
            {activeTab === 'diger' && (
              <div className="space-y-2">
                <div className="text-xs text-emerald-400 font-bold mb-2 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-400 to-cyan-500 rounded-full" />
                  EK AYARLAR
                </div>
                <ActionButton icon={Settings} label="Fianş Ayarları" />
                <ActionButton icon={Layers} label="Malzeme Özellikleri" />
                <ActionButton icon={Palette} label="Renkler" />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
