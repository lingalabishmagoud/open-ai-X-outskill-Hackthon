// Mock Data and LocalStorage API for Hackathon Expansion

export interface City {
  id: string;
  name: string;
}

export interface Apartment {
  id: string;
  cityId: string;
  name: string;
  imageUrl: string;
  mapsUrl?: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  targetCityId: string | 'ALL';
  targetApartmentId: string | 'ALL';
  active: boolean;
}

export interface Intake {
  id: string;
  barcode: string;
  productName: string;
  quantity: number;
  status: 'pending' | 'approved';
  timestamp: number;
}

const INITIAL_CITIES: City[] = [
  { id: 'c1', name: 'Bangalore' },
  { id: 'c2', name: 'Mumbai' }
];

const INITIAL_APARTMENTS: Apartment[] = [
  { id: 'a1', cityId: 'c1', name: 'Prestige Habitat', imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500' },
  { id: 'a2', cityId: 'c1', name: 'Sobha City', imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500' },
  { id: 'a3', cityId: 'c2', name: 'Lodha Altamount', imageUrl: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=500' }
];

const INITIAL_BANNERS: Banner[] = [
  { id: 'b1', imageUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=800', title: 'Fresh Organic Produce', targetCityId: 'ALL', targetApartmentId: 'ALL', active: true },
  { id: 'b2', imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800', title: 'Weekend Festival Offer', targetCityId: 'c1', targetApartmentId: 'a1', active: true }
];

// Helper to interact with LocalStorage safely
export const mockDB = {
  getCities: (): City[] => {
    if (typeof window === 'undefined') return INITIAL_CITIES;
    const data = localStorage.getItem('hk_cities');
    return data ? JSON.parse(data) : INITIAL_CITIES;
  },
  setCities: (cities: City[]) => {
    if (typeof window !== 'undefined') localStorage.setItem('hk_cities', JSON.stringify(cities));
  },
  
  getApartments: (): Apartment[] => {
    if (typeof window === 'undefined') return INITIAL_APARTMENTS;
    const data = localStorage.getItem('hk_apartments');
    return data ? JSON.parse(data) : INITIAL_APARTMENTS;
  },
  setApartments: (apts: Apartment[]) => {
    if (typeof window !== 'undefined') localStorage.setItem('hk_apartments', JSON.stringify(apts));
  },

  getBanners: (): Banner[] => {
    if (typeof window === 'undefined') return INITIAL_BANNERS;
    const data = localStorage.getItem('hk_banners');
    return data ? JSON.parse(data) : INITIAL_BANNERS;
  },
  setBanners: (banners: Banner[]) => {
    if (typeof window !== 'undefined') localStorage.setItem('hk_banners', JSON.stringify(banners));
  },

  getIntakes: (): Intake[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('hk_intakes');
    return data ? JSON.parse(data) : [];
  },
  setIntakes: (intakes: Intake[]) => {
    if (typeof window !== 'undefined') localStorage.setItem('hk_intakes', JSON.stringify(intakes));
  },

  // User Community Profile
  getUserCommunity: () => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem('hk_user_community');
    return data ? JSON.parse(data) : null;
  },
  setUserCommunity: (data: { cityId: string; apartmentId: string; block: string; flat: string; apartmentName: string }) => {
    if (typeof window !== 'undefined') localStorage.setItem('hk_user_community', JSON.stringify(data));
  }
};
