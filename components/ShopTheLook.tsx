import React from 'react';
import { LookCollection, RoomStyle } from '../types';

const COLLECTIONS: LookCollection[] = [
  {
    id: '1',
    title: 'Modern Sanctuary',
    style: RoomStyle.Modern,
    description: 'A clean, calm space featuring sleek lines and neutral tones.',
    image: 'https://picsum.photos/id/1/800/600',
    products: [
      { id: 'p1', name: 'Velvet Sofa', price: 1299, image: 'https://picsum.photos/id/20/200/200' },
      { id: 'p2', name: 'Abstract Art Print', price: 149, image: 'https://picsum.photos/id/21/200/200' },
      { id: 'p3', name: 'Marble Coffee Table', price: 499, image: 'https://picsum.photos/id/22/200/200' },
    ]
  },
  {
    id: '2',
    title: 'Boho Dream',
    style: RoomStyle.Bohemian,
    description: 'Textures, plants, and earthy colors for a relaxed vibe.',
    image: 'https://picsum.photos/id/3/800/600',
    products: [
      { id: 'p4', name: 'Rattan Chair', price: 299, image: 'https://picsum.photos/id/23/200/200' },
      { id: 'p5', name: 'Woven Rug', price: 199, image: 'https://picsum.photos/id/24/200/200' },
      { id: 'p6', name: 'Macrame Plant Hanger', price: 35, image: 'https://picsum.photos/id/25/200/200' },
    ]
  },
  {
    id: '3',
    title: 'Industrial Loft',
    style: RoomStyle.Industrial,
    description: 'Raw materials meeting modern comfort.',
    image: 'https://picsum.photos/id/5/800/600',
    products: [
      { id: 'p7', name: 'Leather Armchair', price: 899, image: 'https://picsum.photos/id/26/200/200' },
      { id: 'p8', name: 'Metal Floor Lamp', price: 129, image: 'https://picsum.photos/id/27/200/200' },
      { id: 'p9', name: 'Reclaimed Wood Desk', price: 599, image: 'https://picsum.photos/id/28/200/200' },
    ]
  },
];

export const ShopTheLook: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900">Shop the Look</h2>
        <p className="text-slate-600 mt-2">Curated collections hand-picked by our AI designers.</p>
      </div>

      <div className="grid gap-12">
        {COLLECTIONS.map((collection) => (
          <div key={collection.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="grid md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-3 relative h-64 md:h-auto group">
                <img 
                  src={collection.image} 
                  alt={collection.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <div>
                    <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                      {collection.style}
                    </span>
                    <h3 className="text-2xl font-bold text-white mt-2">{collection.title}</h3>
                    <p className="text-slate-200 mt-1">{collection.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-2 p-6 bg-slate-50 flex flex-col justify-center">
                <h4 className="font-bold text-slate-900 mb-4">Featured Items</h4>
                <div className="space-y-4">
                  {collection.products.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <h5 className="font-semibold text-slate-900 text-sm">{product.name}</h5>
                        <p className="text-indigo-600 font-bold text-sm">${product.price}</p>
                      </div>
                      <button className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-indigo-600 transition-colors">
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};