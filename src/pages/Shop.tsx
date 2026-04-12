import { useStore } from '../store/useStore';
import { useState } from 'react';

const SHOP_ITEMS = [
  {
    id: '1',
    name: 'Aesthetic Motion Pack',
    description: 'A glowing futuristic motion graphics template pack for Premiere Pro.',
    cost: 500,
    color: 'primary',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    type: 'Digital'
  },
  {
    id: '2',
    name: 'Premium Notion Brain',
    description: 'An elegant high-contrast template to organize your life and tasks.',
    cost: 250,
    color: 'secondary',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    type: 'Digital'
  },
  {
    id: '3',
    name: 'Stealth Hoodie',
    description: 'A heavy-weight luxury dark hoodie with subtle minimalist branding.',
    cost: 1500,
    color: 'outline-variant',
    image: 'https://images.unsplash.com/photo-1556821840-0a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    type: 'Physical'
  },
  {
    id: 's1',
    name: 'Classic Vector Tee',
    description: 'Premium heavyweight cotton t-shirt featuring the vintage Antigravity logo.',
    cost: 650,
    color: 'tertiary',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    type: 'Physical'
  },
  {
    id: 'k1',
    name: "Hacker's Mechanical Keyboard",
    description: 'Ultra-responsive 65% mechanical board with hot-swappable switches and per-key RGB.',
    cost: 3500,
    color: 'primary',
    image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    type: 'Physical'
  },
  {
    id: 'm1',
    name: 'Precision Flux Mouse',
    description: 'Super-lightweight wireless mouse with a 26K DPI sensor for ultra-precise navigation.',
    cost: 2200,
    color: 'secondary',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    type: 'Physical'
  },
  {
    id: '4',
    name: 'Artisan Coffee Box',
    description: 'Fresh artisanal coffee beans delivered to keep your focus sharp.',
    cost: 800,
    color: 'tertiary',
    image: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    type: 'Experiences'
  },
  {
    id: 's2',
    name: 'Circuit Breaker Polo',
    description: 'Breathtable tech-optimized polo with subtle circuitry-inspired textures.',
    cost: 1200,
    color: 'outline-variant',
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    type: 'Physical'
  },
  {
    id: '5',
    name: 'Keychron setup Raffle',
    description: '1 ticket into the monthly drawing for a premium RGB mechanical keyboard.',
    cost: 50,
    color: 'primary',
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    type: 'Raffles'
  },
  {
    id: '6',
    name: '1-on-1 Mentorship',
    description: 'A 30-minute private VIP session with an executive career coach.',
    cost: 2000,
    color: 'secondary',
    image: 'https://images.unsplash.com/photo-1579389083046-d3ce1bb5a11c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    type: 'Experiences'
  },
];

const FILTERS = ['All', 'Digital', 'Physical', 'Experiences', 'Raffles'] as const;

export default function Shop() {
  const stats = useStore(state => state.stats);
  const redeemItem = useStore(state => state.redeemItem);
  const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]>('All');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const filteredItems = activeFilter === 'All'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter(item => item.type === activeFilter);

  const handleRedeem = (item: typeof SHOP_ITEMS[0]) => {
    const success = redeemItem(item.cost);
    if (success) {
      setMessage({ text: `Successfully unlocked ${item.name}! Check your email.`, type: 'success' });
      setExpandedItem(null);
    } else {
      setMessage({ text: `Insufficient Tokens. Keep crushing tasks!`, type: 'error' });
    }
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <>
      <header className="mb-12 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="label-sm text-[10px] uppercase tracking-[0.2em] text-tertiary font-bold">Reward Center</span>
          <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-on-surface tracking-tighter mt-2">Exclusive Drops</h2>
          <div className="absolute -top-12 -right-12 w-96 h-96 bg-tertiary/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        </div>
        <div className="bg-[#192540]/60 backdrop-blur-md rounded-full px-5 py-3 flex items-center gap-3 shadow-lg border border-outline-variant/30 self-start md:self-auto">
          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
          <span className="text-base font-bold font-headline tracking-tighter text-[#dee5ff]">{stats.totalTokens} <span className="font-label text-xs uppercase tracking-widest text-[#a3aac4] font-medium ml-1">Tokens Available</span></span>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar">
        {FILTERS.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              activeFilter === filter
                ? 'bg-tertiary text-surface-container-lowest shadow-lg shadow-tertiary/20'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-bright'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Toast Message */}
      {message && (
        <div className={`mb-8 p-4 rounded-lg font-bold flex items-center gap-3 shadow-xl backdrop-blur-md animate-slide-down ${
          message.type === 'success' ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'bg-[rgba(255,110,132,0.15)] text-[#ff6e84] border border-[rgba(255,110,132,0.3)]'
        }`}>
          <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
          {message.text}
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map(item => {
          const canAfford = stats.totalTokens >= item.cost;
          const deficit = item.cost - stats.totalTokens;
          const isExpanded = expandedItem === item.id;

          return (
            <div
              key={item.id}
              className={`premium-card-hover bg-surface-container-low rounded-2xl flex flex-col overflow-hidden border border-outline-variant/10 relative group h-full transition-all ${
                isExpanded ? 'ring-2 ring-primary' : ''
              }`}
            >
              {/* Product Image Cover */}
              <div className="h-48 w-full relative overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent"></div>

                {/* Type Badge */}
                <div className="absolute top-4 left-4 bg-surface-container-highest/80 backdrop-blur-md border border-outline-variant/30 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {item.type}
                </div>
              </div>

              {/* Info Body */}
              <div className="p-6 flex flex-col flex-grow z-10 -mt-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-headline font-bold text-xl text-on-surface leading-tight">{item.name}</h3>
                </div>

                <p className="text-sm text-on-surface-variant font-medium mb-6 leading-relaxed flex-grow">{item.description}</p>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-sm ${canAfford ? 'text-secondary' : 'text-outline-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
                    <span className={`font-bold font-headline text-lg ${canAfford ? 'text-on-surface' : 'text-outline-variant'}`}>{item.cost}</span>
                  </div>

                  {isExpanded ? (
                    <div className="flex gap-2 animate-scale-in">
                      <button
                        onClick={() => setExpandedItem(null)}
                        className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-full font-bold text-xs hover:bg-surface-container-highest transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleRedeem(item)}
                        className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${
                          canAfford
                            ? 'bg-secondary text-surface-container-lowest hover:bg-secondary/80 shadow-lg shadow-secondary/20'
                            : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? 'Confirm' : 'Locked'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setExpandedItem(item.id)}
                      className={`px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        canAfford
                          ? 'bg-primary text-on-primary hover:bg-primary-dim shadow-lg shadow-primary/20 active:scale-95'
                          : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Redeem' : `Need ${deficit} more`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-20 animate-scale-in">
          <span className="material-symbols-outlined text-5xl text-outline-variant/30 mb-4 block">shopping_bag</span>
          <h3 className="text-xl font-headline font-bold text-on-surface mb-2">No items in this category</h3>
          <p className="text-on-surface-variant text-sm">Check back later or explore other categories.</p>
        </div>
      )}
    </>
  );
}