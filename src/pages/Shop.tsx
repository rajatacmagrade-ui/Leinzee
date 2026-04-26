import { useStore } from '../store/useStore';
import { useState, useEffect } from 'react';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  specs: string[];
  cost: number;
  color: string;
  image: string;
  type: 'Peripherals' | 'Audio' | 'Cables' | 'Accessories';
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: '1',
    name: 'Flux Precision Mouse',
    description: 'Ultra-lightweight 26K DPI wireless gaming mouse with optical switches.',
    longDescription: 'The Flux Precision is designed for elite gamers. Featuring a sub-60g honeycomb shell, PixArt 3395 sensor, and lag-free 2.4GHz wireless connectivity. Experience unparalleled speed and accuracy in every flick.',
    specs: ['26,000 DPI Sensor', '58g Lightweight Design', '100 Million Click Optical Switches', '70h Battery Life'],
    cost: 1200,
    color: 'primary',
    image: 'https://images.unsplash.com/photo-1527814732934-94a1a5d1a599?w=800&q=80&fit=crop',
    type: 'Peripherals'
  },
  {
    id: '2',
    name: 'SonicBuds Pro',
    description: 'Active Noise Cancelling wireless earbuds with spatial audio support.',
    longDescription: 'SonicBuds Pro deliver studio-quality sound in a compact form. With hybrid ANC, transparency mode, and 10mm dynamic drivers, your music and calls have never sounded clearer. IPX5 water resistance ensures they survive any workout.',
    specs: ['Hybrid Active Noise Cancelling', '32h Total Battery with Case', 'Bluetooth 5.3 Low Latency', 'Wireless Charging Support'],
    cost: 850,
    color: 'secondary',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80&fit=crop',
    type: 'Audio'
  },
  {
    id: '3',
    name: 'Aura Studio V2',
    description: 'Premium over-ear headphones with 40mm drivers and 50h battery.',
    longDescription: 'The Aura Studio V2 combines luxury with high-fidelity audio. Memory foam cushions and a lightweight aluminum frame provide all-day comfort. Features multi-point connection to switch between your laptop and phone seamlessly.',
    specs: ['40mm Titanium Drivers', 'Hi-Res Audio Certified', '50-Hour Playtime', 'Multi-point Bluetooth Pairing'],
    cost: 2500,
    color: 'tertiary',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&fit=crop',
    type: 'Audio'
  },
  {
    id: '4',
    name: 'TitanFlex USB-C',
    description: '2-meter braided 100W PD charging cable with reinforced connectors.',
    longDescription: 'Never worry about frayed cables again. The TitanFlex features a double-braided nylon exterior and aramid fiber core. Supports 100W Power Delivery for fast charging laptops, tablets, and phones.',
    specs: ['100W Power Delivery Support', '2 Meter Length', '10,000+ Bend Lifespan', 'E-Marker Chip for Safety'],
    cost: 300,
    color: 'outline-variant',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop',
    type: 'Cables'
  },
  {
    id: '5',
    name: 'MechBoard X-Mini',
    description: 'Hot-swappable 65% mechanical keyboard with PBT keycaps.',
    longDescription: 'The MechBoard X-Mini is the ultimate compact workstation tool. Linear yellow switches provide a buttery smooth typing experience, while the customizable RGB and metal plate add a premium feel to any desk setup.',
    specs: ['Gateron Yellow Linear Switches', 'Double-shot PBT Keycaps', 'Hot-Swappable PCB', 'USB-C Detachable Cable'],
    cost: 3200,
    color: 'primary',
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800&q=80&fit=crop',
    type: 'Peripherals'
  },
  {
    id: '6',
    name: 'VoltStream Hub',
    description: '7-in-1 USB-C docking station with 4K HDMI and Power Delivery.',
    longDescription: 'Expand your productivity with the VoltStream Hub. Features 4K HDMI output, three USB 3.0 ports, SD/MicroSD card readers, and a 100W PD pass-through charging port. Sleek aluminum finish matches modern laptops.',
    specs: ['4K @ 30Hz HDMI Output', '3x USB-A 3.0 Ports', 'SD/TF Card Slots', 'Aluminum Heat-Dissipation Design'],
    cost: 1500,
    color: 'secondary',
    image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800&q=80&fit=crop',
    type: 'Accessories'
  },
];

const FILTERS = ['All', 'Peripherals', 'Audio', 'Cables', 'Accessories'] as const;

export default function Shop() {
  const stats = useStore(state => state.stats);
  const redeemItem = useStore(state => state.redeemItem);
  const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]>('All');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedItem]);

  const filteredItems = activeFilter === 'All'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter(item => item.type === activeFilter);

  const handleRedeem = (item: ShopItem) => {
    const success = redeemItem(item.cost);
    if (success) {
      setMessage({ text: `Successfully unlocked ${item.name}! Claim code sent.`, type: 'success' });
      setSelectedItem(null);
    } else {
      setMessage({ text: `Insufficient Tokens. Keep crushing tasks!`, type: 'error' });
    }
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="animate-fade-in pb-20">
      <header className="mb-12 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-primary font-label text-[10px] uppercase tracking-[0.3em] font-black mb-3 block opacity-80">
            Hardware Pipeline
          </span>
          <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-on-surface tracking-tighter mt-2 leading-none">
            Redeem <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic">Rewards</span>
          </h2>
          <p className="text-on-surface-variant text-sm mt-4 max-w-md">
            Your tokens are the currency of progress. Exchange them for premium gadgets and accessories to power up your workspace.
          </p>
        </div>
        <div className="bg-[#192540]/80 backdrop-blur-xl rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl border border-white/5 self-start md:self-auto group hover:border-primary/30 transition-all">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest leading-none mb-1">Available Credits</p>
            <span className="text-2xl font-black font-headline tracking-tighter text-white">{stats.totalTokens}</span>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar">
        {FILTERS.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeFilter === filter
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'bg-white/5 text-on-surface-variant hover:bg-white/10'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Toast Message */}
      {message && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl border backdrop-blur-md shadow-2xl animate-slide-down flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-secondary/20 text-secondary border-secondary/30' 
            : 'bg-error/20 text-error border-error/30'
        }`}>
          <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map(item => {
          const canAfford = stats.totalTokens >= item.cost;
          return (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="glass-card group cursor-pointer rounded-[2rem] overflow-hidden border border-white/5 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2"
            >
              <div className="aspect-video relative overflow-hidden bg-white/5">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060e20] via-transparent to-transparent opacity-60"></div>
                <div className="absolute top-4 left-4">
                  <span className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white/70">
                    {item.type}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-headline font-black text-white mb-2 group-hover:text-primary transition-colors">{item.name}</h3>
                <p className="text-on-surface-variant text-sm line-clamp-2 leading-relaxed mb-6 opacity-70 group-hover:opacity-100 transition-opacity">
                  {item.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-lg ${canAfford ? 'text-secondary' : 'text-outline'}`} style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                    <span className={`text-lg font-black font-headline ${canAfford ? 'text-white' : 'text-outline'}`}>{item.cost}</span>
                  </div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Details <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-fade-in" onClick={() => setSelectedItem(null)}></div>
          
          <div className="relative w-full max-w-4xl bg-[#060e20] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] animate-scale-in flex flex-col md:flex-row">
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="w-full md:w-1/2 aspect-square md:h-auto relative bg-white/5">
              <img 
                src={selectedItem.image} 
                alt={selectedItem.name} 
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060e20] via-transparent to-transparent opacity-60"></div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="material-symbols-outlined text-primary/10 text-[80px]" style={{ fontVariationSettings: "'FILL' 1" }}>devices</span>
              </div>
            </div>

            <div className="flex-1 p-8 md:p-12 flex flex-col">
              <span className="text-primary font-label text-[10px] uppercase tracking-[0.3em] font-black mb-2 opacity-80">
                Product Specifications
              </span>
              <h2 className="text-3xl md:text-4xl font-headline font-black text-white mb-4 leading-tight">{selectedItem.name}</h2>
              <p className="text-on-surface-variant text-base leading-relaxed mb-8 opacity-80">
                {selectedItem.longDescription}
              </p>

              <div className="space-y-4 mb-10">
                {selectedItem.specs.map(spec => (
                  <div key={spec} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary text-[14px]">check</span>
                    </div>
                    <span className="text-sm font-semibold text-on-surface-variant">{spec}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between gap-6">
                <div>
                  <p className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest leading-none mb-1">Exchange Rate</p>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                    <span className="text-2xl font-black font-headline text-white">{selectedItem.cost}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-white/5 text-on-surface-variant hover:bg-white/10 transition-all border border-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRedeem(selectedItem)}
                    disabled={stats.totalTokens < selectedItem.cost}
                    className={`flex-[2] py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl ${
                      stats.totalTokens >= selectedItem.cost
                        ? 'bg-gradient-to-r from-primary to-secondary text-on-primary hover:-translate-y-1 hover:shadow-primary/20'
                        : 'bg-white/5 text-on-surface-variant cursor-not-allowed grayscale'
                    }`}
                  >
                    {stats.totalTokens >= selectedItem.cost ? 'Confirm Exchange' : `Need ${selectedItem.cost - stats.totalTokens} More Tokens`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="text-center py-20 animate-scale-in">
          <span className="material-symbols-outlined text-5xl text-outline-variant/30 mb-4 block">inventory_2</span>
          <h3 className="text-xl font-headline font-bold text-on-surface mb-2">No items in this category</h3>
          <p className="text-on-surface-variant text-sm">Check back later or explore other categories.</p>
        </div>
      )}
    </div>
  );
}
