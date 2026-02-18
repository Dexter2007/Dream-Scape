
import { RoomStyle } from './types';

export const ROOM_STYLES: { value: RoomStyle; label: string; description: string; image: string }[] = [
  { 
    value: RoomStyle.Modern, 
    label: 'Modern', 
    description: 'Clean lines, neutral colors, and simplicity.',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.Japandi, 
    label: 'Japandi', 
    description: 'A hybrid of Japanese and Scandinavian aesthetics.',
    image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.Bohemian, 
    label: 'Bohemian', 
    description: 'Eclectic, colorful, and full of life and texture.',
    image: 'https://images.unsplash.com/photo-1522444195799-478538b28823?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.Minimalist, 
    label: 'Minimalist', 
    description: 'Less is more. Functional furniture and lack of clutter.',
    image: 'https://images.unsplash.com/photo-1531835551805-16d864c8d311?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.Coastal, 
    label: 'Coastal', 
    description: 'Breezy, beachy vibes with light blues and whites.',
    image: 'https://images.unsplash.com/photo-1520697830682-bbb6e85e2b0b?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.Industrial, 
    label: 'Industrial', 
    description: 'Raw materials, exposed pipes, and urban feel.',
    image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.Biophilic, 
    label: 'Biophilic', 
    description: 'Bringing the outdoors in with plants and natural light.',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.MidCenturyModern, 
    label: 'Mid-Century', 
    description: 'Retro vibes from the 50s and 60s.',
    image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.Neoclassical, 
    label: 'Neoclassical', 
    description: 'Elegant, timeless, combining luxury with symmetry.',
    image: 'https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.Maximalist, 
    label: 'Maximalist', 
    description: 'Bold colors, patterns, and curated excess.',
    image: 'https://images.unsplash.com/photo-1551516594-56cb78394645?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.Farmhouse, 
    label: 'Farmhouse', 
    description: 'Rustic charm, warm woods, and cozy vibes.',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.ArtDeco, 
    label: 'Art Deco', 
    description: 'Glamorous, geometric, and ornamental.',
    image: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.Scandinavian, 
    label: 'Scandinavian', 
    description: 'Cozy, functional, and warm with plenty of light.',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.Cyberpunk, 
    label: 'Cyberpunk', 
    description: 'Neon lights, high-tech, and futuristic.',
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.Gothic, 
    label: 'Gothic', 
    description: 'Dark, dramatic, rich textures and moodiness.',
    image: 'https://images.unsplash.com/photo-1534595038511-9f219fe0c979?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.Baroque, 
    label: 'Baroque', 
    description: 'Ornate, opulent, gold accents and drama.',
    image: 'https://images.unsplash.com/photo-1577083288073-40892c0860a4?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.Zen, 
    label: 'Zen', 
    description: 'Peaceful, balanced, and natural.',
    image: 'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?auto=format&fit=crop&w=800&q=80' 
  },
  {
    value: RoomStyle.Mediterranean,
    label: 'Mediterranean',
    description: 'Sun-baked colors, warm textures, and coastal european charm.',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
  },
  {
    value: RoomStyle.Rustic,
    label: 'Rustic',
    description: 'Natural, aged, organic, and rough-hewn elements.',
    image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80'
  },
  {
    value: RoomStyle.Bauhaus,
    label: 'Bauhaus',
    description: 'Functional, abstract, geometric, and artistic.',
    image: 'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?auto=format&fit=crop&w=800&q=80'
  },
  {
    value: RoomStyle.Victorian,
    label: 'Victorian',
    description: 'Complex, orderly, ornamented, and classic.',
    image: 'https://images.unsplash.com/photo-1558603668-6570496b66f8?auto=format&fit=crop&w=800&q=80'
  },
  {
    value: RoomStyle.FrenchCountry,
    label: 'French Country',
    description: 'Soft colors, toile patterns, and refined rustic accents.',
    image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=800&q=80'
  },
  {
    value: RoomStyle.HollywoodRegency,
    label: 'Hollywood Regency',
    description: 'Glitz, glamour, lacquer, and luxe details.',
    image: 'https://images.unsplash.com/photo-1551298370-9d3d53740c72?auto=format&fit=crop&w=800&q=80'
  },
  {
    value: RoomStyle.Transitional,
    label: 'Transitional',
    description: 'A balanced blend of traditional and modern styles.',
    image: 'https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&w=800&q=80'
  },
  {
    value: RoomStyle.ShabbyChic,
    label: 'Shabby Chic',
    description: 'Soft, feminine, distressed, and antique.',
    image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=800&q=80'
  },
  {
    value: RoomStyle.Southwestern,
    label: 'Southwestern',
    description: 'Desert tones, leather, terracotta, and woven textiles.',
    image: 'https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?auto=format&fit=crop&w=800&q=80'
  },
  {
    value: RoomStyle.Eclectic,
    label: 'Eclectic',
    description: 'A careful gathering of interesting elements from different eras.',
    image: 'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?auto=format&fit=crop&w=800&q=80'
  },
  {
    value: RoomStyle.Tropical,
    label: 'Tropical',
    description: 'Lush greenery, natural woods, and vibrant warmth.',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
  },
  {
    value: RoomStyle.Steampunk,
    label: 'Steampunk',
    description: 'Victorian-era industrialism with gears, brass, and dark leather.',
    image: 'https://images.unsplash.com/photo-1554295405-abb8fd54f153?auto=format&fit=crop&w=1200&q=80'
  },
  {
    value: RoomStyle.Memphis,
    label: 'Memphis',
    description: 'Bold pop art, geometric shapes, and bright primary colors.',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80'
  },
  { 
    value: RoomStyle.Brutalism, 
    label: 'Brutalism', 
    description: 'Raw concrete, blocky shapes, and monochromatic gray.',
    image: 'https://images.unsplash.com/photo-1518112390430-f4ab02e9c2c8?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    value: RoomStyle.ArtNouveau, 
    label: 'Art Nouveau', 
    description: 'Flowing lines, organic shapes, and floral motifs.',
    image: 'https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&w=800&q=80' 
  }
];
