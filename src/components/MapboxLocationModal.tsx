import React, { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    mapboxgl: any;
  }
}

const MAPBOX_TOKEN =
  process.env.REACT_APP_MAPBOX_TOKEN ||
  'pk.eyJ1Ijoiam9obmVoeiIsImEiOiJjbXVnZWZjdzYwb3oxMnlwcWw1bmxxeGJtIn0.BeAePvLIiqb4j-v453AKig';

// Bounding box estricto para el Área Metropolitana de Medellín (Valle de Aburrá)
// Cobertura: Medellín, Bello, Envigado, Itagüí, Sabaneta, La Estrella, Caldas, Copacabana, Girardota, Barbosa.
export const MEDELLIN_METRO_BOUNDS = {
  minLng: -75.67,
  minLat: 6.06,
  maxLng: -75.32,
  maxLat: 6.45,
};

export const isWithinMedellinMetro = (lng: number, lat: number): boolean => {
  return (
    lng >= MEDELLIN_METRO_BOUNDS.minLng &&
    lng <= MEDELLIN_METRO_BOUNDS.maxLng &&
    lat >= MEDELLIN_METRO_BOUNDS.minLat &&
    lat <= MEDELLIN_METRO_BOUNDS.maxLat
  );
};

export interface SelectedLocationData {
  address: string;
  neighborhood?: string;
  city: string;
  department: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface MapboxLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: SelectedLocationData) => void;
  initialCoords?: { latitude: number; longitude: number };
}

export const MapboxLocationModal: React.FC<MapboxLocationModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [loadingGeocode, setLoadingGeocode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);

  const defaultLat = initialCoords?.latitude || 6.2768;
  const defaultLng = initialCoords?.longitude || -75.5843;

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: defaultLat,
    lng: defaultLng,
  });

  const [locationDetails, setLocationDetails] = useState<SelectedLocationData>({
    address: '',
    neighborhood: '',
    city: 'Medellín',
    department: 'Antioquia',
    country: 'Colombia',
    latitude: defaultLat,
    longitude: defaultLng,
  });

  /**
   * Reverse Geocoding via Mapbox Places API
   */
  const reverseGeocode = useCallback(async (lng: number, lat: number) => {
    if (!MAPBOX_TOKEN) return;

    setLoadingGeocode(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address,poi,neighborhood,locality,place&language=es`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const addressFeature = data.features.find((f: any) => f.place_type.includes('address'));
        const poiFeature = data.features.find((f: any) => f.place_type.includes('poi'));
        const placeFeature = data.features.find((f: any) => f.place_type.includes('place'));

        const primary = addressFeature || poiFeature || data.features[0];

        // Format address string: "Calle 10 #43E-12" or primary text + address number
        let streetAddress = '';
        if (addressFeature) {
          if (addressFeature.address && addressFeature.text) {
            streetAddress = `${addressFeature.text} #${addressFeature.address}`;
          } else {
            streetAddress = addressFeature.place_name.split(',')[0].trim();
          }
        } else if (poiFeature) {
          streetAddress = poiFeature.text || poiFeature.place_name.split(',')[0].trim();
        } else {
          streetAddress = primary.place_name.split(',')[0].trim();
        }

        // Extract neighborhood, city, department from context hierarchy
        let neighborhood = '';
        let city = 'Medellín';
        let department = 'Antioquia';
        let country = 'Colombia';

        const context = primary.context || [];
        for (const ctx of context) {
          if (ctx.id.startsWith('neighborhood') || ctx.id.startsWith('locality')) {
            neighborhood = ctx.text_es || ctx.text;
          } else if (ctx.id.startsWith('place')) {
            city = ctx.text_es || ctx.text;
          } else if (ctx.id.startsWith('region')) {
            department = ctx.text_es || ctx.text;
          } else if (ctx.id.startsWith('country')) {
            country = ctx.text_es || ctx.text;
          }
        }

        if (!city && placeFeature) {
          city = placeFeature.text_es || placeFeature.text;
        }

        setLocationDetails({
          address: streetAddress,
          neighborhood,
          city,
          department,
          country,
          latitude: lat,
          longitude: lng,
        });
      }
    } catch (err) {
      console.error('Mapbox reverse geocoding error:', err);
    } finally {
      setLoadingGeocode(false);
    }
  }, []);

  /**
   * Initialize Mapbox instance ONCE when modal opens
   */
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let timerId: any = null;

    const setupMap = () => {
      if (!mapContainerRef.current || mapInstanceRef.current || !window.mapboxgl) return;

      try {
        window.mapboxgl.accessToken = MAPBOX_TOKEN;

        const startLng = initialCoords?.longitude ?? -75.5843;
        const startLat = initialCoords?.latitude ?? 6.2768;

        const map = new window.mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [startLng, startLat],
          zoom: 14.5,
          maxBounds: [
            [MEDELLIN_METRO_BOUNDS.minLng, MEDELLIN_METRO_BOUNDS.minLat],
            [MEDELLIN_METRO_BOUNDS.maxLng, MEDELLIN_METRO_BOUNDS.maxLat],
          ],
        });

        // Add standard navigation controls
        map.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

        // Create draggable marker
        const marker = new window.mapboxgl.Marker({
          color: '#2563eb',
          draggable: true,
        })
          .setLngLat([startLng, startLat])
          .addTo(map);

        // Marker dragend handler
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          const inside = isWithinMedellinMetro(lngLat.lng, lngLat.lat);
          setIsOutOfBounds(!inside);
          setCurrentCoords({ lat: lngLat.lat, lng: lngLat.lng });
          if (inside) {
            reverseGeocode(lngLat.lng, lngLat.lat);
          } else {
            toast.warning('Ubicación fuera del Valle de Aburrá', {
              description: 'Por favor selecciona un punto dentro del Área Metropolitana de Medellín.',
            });
          }
        });

        // Map click handler: moves marker to clicked coordinates
        map.on('click', (e: any) => {
          const inside = isWithinMedellinMetro(e.lngLat.lng, e.lngLat.lat);
          setIsOutOfBounds(!inside);
          marker.setLngLat(e.lngLat);
          setCurrentCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
          if (inside) {
            reverseGeocode(e.lngLat.lng, e.lngLat.lat);
          } else {
            toast.warning('Ubicación fuera del Valle de Aburrá', {
              description: 'Por favor selecciona un punto dentro del Área Metropolitana de Medellín.',
            });
          }
        });

        // Call resize when map finishes loading
        map.on('load', () => {
          if (isMounted) {
            map.resize();
          }
        });

        // Multiple delayed resize triggers to account for modal CSS entrance animation
        setTimeout(() => map.resize(), 150);
        setTimeout(() => map.resize(), 400);

        mapInstanceRef.current = map;
        markerRef.current = marker;

        // Perform initial reverse geocoding if inside bounds
        const inside = isWithinMedellinMetro(startLng, startLat);
        setIsOutOfBounds(!inside);
        if (inside) {
          reverseGeocode(startLng, startLat);
        }
      } catch (err) {
        console.error('Failed to create Mapbox map:', err);
      }
    };

    if (window.mapboxgl) {
      setupMap();
    } else {
      timerId = setInterval(() => {
        if (window.mapboxgl) {
          clearInterval(timerId);
          setupMap();
        }
      }, 100);
    }

    return () => {
      isMounted = false;
      if (timerId) clearInterval(timerId);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
    // Only re-run when modal opens or closes!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /**
   * Search places with Mapbox Geocoding Places API restricted to Medellín Metro Area (debounced)
   */
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const bboxStr = `${MEDELLIN_METRO_BOUNDS.minLng},${MEDELLIN_METRO_BOUNDS.minLat},${MEDELLIN_METRO_BOUNDS.maxLng},${MEDELLIN_METRO_BOUNDS.maxLat}`;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${MAPBOX_TOKEN}&country=CO&bbox=${bboxStr}&proximity=${currentCoords.lng},${currentCoords.lat}&language=es&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        setSearchResults(data.features || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, currentCoords.lng, currentCoords.lat]);

  /**
   * Fly to selected place from search results
   */
  const handleSelectSearchResult = (feature: any) => {
    const [lng, lat] = feature.center;
    const inside = isWithinMedellinMetro(lng, lat);
    setIsOutOfBounds(!inside);
    setSearchQuery('');
    setSearchResults([]);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo({ center: [lng, lat], zoom: 16 });
      markerRef.current.setLngLat([lng, lat]);
      setCurrentCoords({ lat, lng });
      if (inside) {
        reverseGeocode(lng, lat);
      } else {
        toast.warning('Ubicación fuera del Valle de Aburrá');
      }
    }
  };

  /**
   * GPS: Use browser Geolocation (validated within Metro area)
   */
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.warning('Geolocalización no soportada en este navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!isWithinMedellinMetro(lng, lat)) {
          toast.warning('Tu ubicación GPS actual está fuera del Área Metropolitana de Medellín.');
          return;
        }

        setIsOutOfBounds(false);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo({ center: [lng, lat], zoom: 16 });
          markerRef.current.setLngLat([lng, lat]);
          setCurrentCoords({ lat, lng });
          reverseGeocode(lng, lat);
          toast.success('Ubicación GPS detectada');
        }
      },
      (err) => {
        toast.error('No se pudo acceder a tu ubicación GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /**
   * Confirm selection and pass back to checkout form
   */
  const handleConfirm = () => {
    if (isOutOfBounds || !isWithinMedellinMetro(currentCoords.lng, currentCoords.lat)) {
      toast.error('Ubicación fuera de cobertura', {
        description: 'Solo realizamos entregas en el Área Metropolitana de Medellín.',
      });
      return;
    }

    if (!locationDetails.address) {
      toast.warning('Por favor selecciona una ubicación válida en el mapa');
      return;
    }

    onSelectLocation(locationDetails);
    toast.success('Dirección fijada desde el mapa', {
      description: `${locationDetails.address}, ${locationDetails.city}`,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl w-full h-[100dvh] sm:h-auto max-w-3xl overflow-hidden flex flex-col sm:max-h-[94vh] animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                Selecciona tu ubicación en el mapa
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500">
                Arrastra el marcador azul o haz clic en el mapa (Área Metropolitana de Medellín)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search Bar & Quick GPS action */}
        <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 relative shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar barrio, dirección o lugar en Medellín o Valle de Aburrá..."
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm pl-9 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              {isSearching && (
                <div className="absolute right-3 top-3">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Suggestions Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {searchResults.map((feature: any) => (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => handleSelectSearchResult(feature)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/70 transition-colors text-xs text-gray-700 flex items-start gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span className="flex-1 truncate">{feature.place_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              title="Detectar mi ubicación actual con GPS"
              className="px-3 sm:px-4 py-2 bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Mi ubicación</span>
            </button>
          </div>
        </div>

        {/* Mapbox Canvas Container */}
        <div className="w-full flex-1 relative bg-gray-100 min-h-[260px] sm:min-h-[420px]">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Draggable hint badge */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs border border-gray-200 px-2.5 py-1 rounded-lg shadow-sm pointer-events-none text-[11px] font-medium text-gray-700 flex items-center gap-1.5 z-10">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Haz clic o arrastra el marcador dentro del Valle de Aburrá</span>
          </div>

          {loadingGeocode && (
            <div className="absolute top-3 right-14 bg-white/90 backdrop-blur-xs border border-gray-200 px-3 py-1 rounded-lg shadow-sm text-xs font-semibold text-blue-700 flex items-center gap-1.5 z-10">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Identificando dirección...</span>
            </div>
          )}
        </div>

        {/* Bottom Details & Confirmation Actions */}
        <div className="p-3.5 sm:p-5 pb-6 sm:pb-5 bg-white border-t border-gray-100 shrink-0 space-y-2.5 sm:space-y-3">
          {isOutOfBounds ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3 sm:p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs uppercase">
                Aviso
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <span className="font-bold text-amber-950 block text-xs sm:text-sm">
                  Ubicación fuera del Área Metropolitana de Medellín
                </span>
                <p className="text-amber-800 mt-0.5">
                  Solo realizamos entregas en el Valle de Aburrá (Medellín, Bello, Envigado, Itagüí, Sabaneta, La Estrella, Caldas, Copacabana, Girardota, Barbosa).
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3 sm:p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs uppercase tracking-wide">
                Dir
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <span className="font-bold text-gray-900 block text-xs sm:text-sm truncate">
                  {locationDetails.address || 'Ubicación sobre el mapa'}
                </span>
                <p className="text-gray-500 mt-0.5 truncate">
                  {[
                    locationDetails.neighborhood,
                    locationDetails.city,
                    locationDetails.department,
                    locationDetails.country,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                  Lat: {currentCoords.lat.toFixed(5)}, Lng: {currentCoords.lng.toFixed(5)}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loadingGeocode || isOutOfBounds}
              className="btn-primary py-2.5 px-5 text-xs sm:text-sm font-bold shadow-md w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar ubicación seleccionada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
