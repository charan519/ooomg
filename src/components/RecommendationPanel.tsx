import React, { useEffect, useState } from 'react';
import { X, Star, Clock, Users, ThumbsUp, Navigation2 } from 'lucide-react';
import { formatDistance } from 'date-fns';

interface Recommendation {
  id: number;
  name: string;
  description: string;
  image: string;
  rating: number;
  crowdLevel: string;
  bestTime: string;
  category: string;
  distance?: number;
  location: {
    lat: number;
    lon: number;
  };
}

interface RecommendationPanelProps {
  onClose: () => void;
  recommendations: Recommendation[];
  userLocation?: [number, number];
  transportMode: string;
  language: string;
}

const translations = {
  en: {
    nearbyAttractions: 'Nearby Attractions',
    crowdLevel: 'Crowd Level',
    bestTime: 'Best Time',
    category: 'Category',
    distance: 'Distance',
  },
  es: {
    nearbyAttractions: 'Atracciones Cercanas',
    crowdLevel: 'Nivel de Gente',
    bestTime: 'Mejor Hora',
    category: 'Categoría',
    distance: 'Distancia',
  },
  fr: {
    nearbyAttractions: 'Attractions à Proximité',
    crowdLevel: 'Niveau de Foule',
    bestTime: 'Meilleur Moment',
    category: 'Catégorie',
    distance: 'Distance',
  },
  de: {
    nearbyAttractions: 'Attraktionen in der Nähe',
    crowdLevel: 'Besucherzahl',
    bestTime: 'Beste Zeit',
    category: 'Kategorie',
    distance: 'Entfernung',
  }
};

export function RecommendationPanel({ onClose, recommendations, userLocation, transportMode, language = 'en' }: RecommendationPanelProps) {
  const [placeImages, setPlaceImages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const t = translations[language as keyof typeof translations];

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Apply transport mode multiplier for estimated travel time/distance
    const multipliers = {
      'driving-car': 1,
      'cycling': 1.2,
      'foot-walking': 1.5
    };
    return distance * (multipliers[transportMode as keyof typeof multipliers] || 1);
  };

  const formatDistanceStr = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  useEffect(() => {
    recommendations.forEach(async (place) => {
      setIsLoading(prev => ({ ...prev, [place.id]: true }));
      try {
        const query = encodeURIComponent(`${place.name} ${place.category} landmark`);
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${query}&client_id=YOUR_UNSPLASH_API_KEY&per_page=1`
        );
        
        if (!response.ok) throw new Error('Failed to fetch image');
        
        const data = await response.json();
        if (data.results?.[0]) {
          setPlaceImages(prev => ({
            ...prev,
            [place.id]: data.results[0].urls.regular
          }));
        }
      } catch (error) {
        console.error('Error fetching image:', error);
        setPlaceImages(prev => ({
          ...prev,
          [place.id]: place.image
        }));
      } finally {
        setIsLoading(prev => ({ ...prev, [place.id]: false }));
      }
    });
  }, [recommendations]);

  return (
    <div className="absolute top-32 right-8 z-[1000] w-96 max-h-[calc(100vh-160px)] bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{t.nearbyAttractions}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-all duration-300"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-280px)] pr-2">
          {recommendations.map((place) => {
            const distance = userLocation 
              ? calculateDistance(
                  userLocation[0], 
                  userLocation[1], 
                  place.location.lat, 
                  place.location.lon
                )
              : null;

            return (
              <div
                key={place.id}
                className="bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
              >
                <div className="relative mb-3">
                  <img
                    src={placeImages[place.id] || place.image}
                    alt={place.name}
                    className={`w-full h-48 object-cover rounded-xl ${
                      isLoading[place.id] ? 'animate-pulse bg-white/10' : ''
                    }`}
                  />
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md rounded-full px-3 py-1 flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-white text-sm">{place.rating}</span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {place.name}
                </h3>
                <p className="text-white/70 text-sm mb-3">{place.description}</p>

                <div className="flex items-center space-x-4 text-sm text-white/60">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{place.crowdLevel}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{place.bestTime}</span>
                  </div>
                  {distance && (
                    <div className="flex items-center space-x-1">
                      <Navigation2 className="w-4 h-4" />
                      <span>{formatDistanceStr(distance)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}