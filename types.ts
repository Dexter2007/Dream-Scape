
export enum RoomStyle {
  Modern = 'Modern',
  Minimalist = 'Minimalist',
  Bohemian = 'Bohemian',
  Industrial = 'Industrial',
  Scandinavian = 'Scandinavian',
  MidCenturyModern = 'Mid-Century Modern',
  Coastal = 'Coastal',
  ArtDeco = 'Art Deco',
  Cyberpunk = 'Cyberpunk',
  Zen = 'Zen',
  Japandi = 'Japandi',
  Biophilic = 'Biophilic',
  Maximalist = 'Maximalist',
  Neoclassical = 'Neoclassical',
  Farmhouse = 'Farmhouse',
  Gothic = 'Gothic',
  Baroque = 'Baroque',
  Mediterranean = 'Mediterranean',
  Rustic = 'Rustic',
  Bauhaus = 'Bauhaus',
  Victorian = 'Victorian',
  FrenchCountry = 'French Country',
  HollywoodRegency = 'Hollywood Regency',
  Transitional = 'Transitional',
  ShabbyChic = 'Shabby Chic',
  Southwestern = 'Southwestern',
  Eclectic = 'Eclectic',
  Tropical = 'Tropical',
  Steampunk = 'Steampunk',
  Memphis = 'Memphis',
  Brutalism = 'Brutalism',
  ArtNouveau = 'Art Nouveau'
}

export type AppView = 'redesign' | 'designer' | 'shop' | 'quiz';

export interface ColorPaletteItem {
  name: string;
  hex: string;
}

export interface DesignAdvice {
  critique: string;
  suggestions: string[];
  colorPalette: ColorPaletteItem[];
  furnitureRecommendations: string[];
}

export interface GenerationResult {
  originalImage: string; // Base64
  generatedImage: string | null; // Base64
  advice: DesignAdvice | null;
}

export interface LoadingState {
  isGenerating: boolean;
  statusMessage: string;
}

// Shop The Look Types
export interface ProductItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

export interface LookCollection {
  id: string;
  title: string;
  style: RoomStyle;
  description: string;
  image: string;
  products: ProductItem[];
}

// Room Designer Types
export interface DesignerItem {
  id: number;
  type: string;
  icon: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  locked?: boolean;
  groupId?: string;
  color?: string;
}

export interface SavedDesign {
  id: number;
  name: string;
  date: string;
  background: string;
  items: DesignerItem[];
}
