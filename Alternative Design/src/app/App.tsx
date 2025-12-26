import { useState } from 'react';
import { Grid3x3, Palette, Eye, Settings, Layers, Wrench, ChevronDown } from 'lucide-react';

export default function App() {
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

  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    sahne: true,
    boyutlar: true,
    sac: true,
    gorunum: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const DimensionControl = ({ 
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
    <div className="flex items-center gap-2">
      <span className="text-xs text-indigo-300 w-12">{label}</span>
      <button
        onClick={() => setValue(Math.max(min, value - step))}
        className="w-7 h-7 rounded bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium active:scale-95 transition-all"
      >
        −
      </button>
      <div className="flex-1 flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded px-2 h-7 border border-white/20">
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="flex-1 bg-transparent text-white text-xs outline-none w-full"
        />
        <span className="text-indigo-300 text-xs">{unit}</span>
      </div>
      <button
        onClick={() => setValue(Math.min(max, value + step))}
        className="w-7 h-7 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium active:scale-95 transition-all"
      >
        +
      </button>
    </div>
  );

  const Checkbox = ({ 
    checked, 
    onChange, 
    label 
  }: { 
    checked: boolean; 
    onChange: (v: boolean) => void; 
    label: string; 
  }) => (
    <label className="flex items-center gap-2 cursor-pointer group py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-3.5 h-3.5 rounded bg-white/10 border border-white/30 checked:bg-indigo-500 checked:border-indigo-500 cursor-pointer accent-indigo-500"
      />
      <span className="text-xs text-slate-200 group-hover:text-white transition-colors">{label}</span>
    </label>
  );

  const CollapsibleSection = ({ 
    id,
    icon: Icon, 
    title, 
    children,
    color = "indigo"
  }: { 
    id: string;
    icon: any; 
    title: string; 
    children: React.ReactNode;
    color?: string;
  }) => {
    const isOpen = openSections[id];
    
    return (
      <div className="border-b border-white/10 last:border-b-0">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-2.5 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 text-${color}-400`} />
            <span className="text-sm text-white font-medium">{title}</span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>
        {isOpen && (
          <div className="px-2.5 pb-2.5 space-y-2">
            {children}
          </div>
        )}
      </div>
    );
  };

  const SimpleButton = ({ 
    icon: Icon, 
    label, 
    color = "slate" 
  }: { 
    icon: any; 
    label: string; 
    color?: string; 
  }) => (
    <button className="w-full flex items-center gap-2 p-2.5 hover:bg-white/5 border-b border-white/10 last:border-b-0 transition-colors">
      <Icon className={`w-4 h-4 text-${color}-400`} />
      <span className="text-sm text-slate-200">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2">
      <div className="max-w-md mx-auto">
        {/* Main Panel */}
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          
          {/* Collapsible Sections */}
          <CollapsibleSection id="sahne" icon={Settings} title="Sahne Ayarları" color="cyan">
            <Checkbox
              checked={gridGoster}
              onChange={setGridGoster}
              label="Grid Göster"
            />
            <Checkbox
              checked={eksenlerGoster}
              onChange={setEksenlerGoster}
              label="Eksenler Göster"
            />
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300">Arkaplan</label>
                <span className="text-xs text-cyan-400 font-medium">{arkaplanRenk}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={arkaplanRenk}
                onChange={(e) => setArkaplanRenk(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/50"
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection id="boyutlar" icon={Wrench} title="Boyutlar" color="purple">
            <DimensionControl
              label="Ø"
              value={diameter}
              setValue={setDiameter}
              unit="cm"
              step={5}
              min={0}
              max={200}
            />
            <DimensionControl
              label="L"
              value={length}
              setValue={setLength}
              unit="cm"
              step={5}
              min={0}
              max={200}
            />
          </CollapsibleSection>

          <CollapsibleSection id="sac" icon={Layers} title="Sac Kalınlığı" color="emerald">
            <DimensionControl
              label="t"
              value={thickness}
              setValue={setThickness}
              unit="mm"
              step={0.1}
              min={0}
              max={10}
            />
          </CollapsibleSection>

          <SimpleButton icon={Grid3x3} label="Sac Kalınlığı Skalası" color="emerald" />

          <CollapsibleSection id="gorunum" icon={Eye} title="Görünüm" color="orange">
            <Checkbox
              checked={kenarCizgileri}
              onChange={setKenarCizgileri}
              label="Kenar Çizgileri"
            />
            <Checkbox
              checked={olculendirme}
              onChange={setOlculendirme}
              label="Ölçülendirme"
            />
            <Checkbox
              checked={flanslarGoster}
              onChange={setFlanslarGoster}
              label="Flanslar Göster"
            />
            <Checkbox
              checked={gorusuKoru}
              onChange={setGorusuKoru}
              label="Görüşü Koru"
            />
          </CollapsibleSection>

          <SimpleButton icon={Settings} label="Fianş Ayarları" color="pink" />
          <SimpleButton icon={Layers} label="Malzeme Özellikleri" color="blue" />
          <SimpleButton icon={Palette} label="Renkler" color="purple" />
          
        </div>
      </div>
    </div>
  );
}
