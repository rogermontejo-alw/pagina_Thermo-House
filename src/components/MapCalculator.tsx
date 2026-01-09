'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Script from 'next/script';
import { Search, Map as MapIcon, RotateCcw, Crosshair, PencilRuler, Keyboard, ArrowRight, MousePointer2 } from 'lucide-react';
import { MEXICAN_CITIES_BY_STATE } from '@/lib/mexico-data';

import { getAppConfig } from '@/app/actions/get-config';
import { getLocations } from '@/app/actions/admin-locations';

interface MapCalculatorProps {
    onAreaCalculated: (area: number) => void;
    onLocationUpdated?: (details: { address: string; city: string; state: string; maps_link: string; postal_code: string }) => void;
    onAddressFound?: (details: { address: string; city: string; state: string; maps_link: string; postal_code: string }) => void;
    onCityDetected?: (details: { address: string; city: string; state: string; maps_link: string; postal_code: string }) => void;
}

// Fallback in case DB fetch fails or is empty
const FALLBACK_REGIONS: Record<string, string[]> = MEXICAN_CITIES_BY_STATE;

declare global {
    interface Window {
        google: typeof google;
        gm_authFailure?: () => void;
    }
}

const isGoogleMapsLoaded = () => typeof window !== 'undefined' && !!window.google && !!window.google.maps;

export default function MapCalculator({ onAreaCalculated, onLocationUpdated, onAddressFound, onCityDetected }: MapCalculatorProps) {
    // Utility to trigger all location callbacks
    const notifyLocation = useCallback((loc: { address: string; city: string; state: string; maps_link: string; postal_code: string }) => {
        if (onLocationUpdated) onLocationUpdated(loc);
        if (onAddressFound) onAddressFound(loc);
        if (onCityDetected) onCityDetected(loc);
    }, [onLocationUpdated, onAddressFound, onCityDetected]);

    const mapRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // UI State
    const [mode, setMode] = useState<'map' | 'manual'>('map');

    // Map state
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
    const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [area, setArea] = useState<number>(0);
    const [dbMapsKey, setDbMapsKey] = useState<string | null>(null);
    const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
    const [activePolygon, setActivePolygon] = useState<google.maps.Polygon | null>(null);
    const [showInstructions, setShowInstructions] = useState(true);
    const [showAddressPrompt, setShowAddressPrompt] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [shouldLoadMaps, setShouldLoadMaps] = useState(false);

    // Observer to load maps only when needed
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setShouldLoadMaps(true);
                observer.disconnect();
            }
        }, { rootMargin: '400px' });

        if (mapRef.current) observer.observe(mapRef.current);
        return () => observer.disconnect();
    }, []);

    // Manual Location State
    const [manualLocation, setManualLocation] = useState({
        address: '',
        city: 'Mérida',
        state: 'Yucatán',
        customCity: '',
        customState: '',
        postal_code: ''
    });
    const [dynamicRegions, setDynamicRegions] = useState<Record<string, string[]>>({});

    // Load dynamic locations for manual input
    useEffect(() => {
        getLocations().then(res => {
            if (res.success && res.data && res.data.length > 0) {
                const grouped: Record<string, string[]> = {};
                res.data.forEach((loc: any) => {
                    if (!grouped[loc.estado]) grouped[loc.estado] = [];
                    if (!grouped[loc.estado].includes(loc.ciudad)) {
                        grouped[loc.estado].push(loc.ciudad);
                    }
                });
                setDynamicRegions(grouped);
            }
        });
    }, []);

    const activeRegions = (() => {
        const merged: Record<string, string[]> = { ...FALLBACK_REGIONS };
        if (Object.keys(dynamicRegions).length > 0) {
            Object.keys(dynamicRegions).forEach(state => {
                if (!merged[state]) {
                    merged[state] = dynamicRegions[state];
                } else {
                    // Combine and remove duplicates
                    const combined = [...new Set([...merged[state], ...dynamicRegions[state]])];
                    merged[state] = combined;
                }
            });
        }
        return merged;
    })();

    const GOOGLE_MAPS_API_KEY = dbMapsKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

    // Fetch key from DB
    useEffect(() => {
        getAppConfig('GOOGLE_MAPS_KEY').then(val => {
            if (val) setDbMapsKey(val);
        });
    }, []);

    // Handle Auth Failure
    useEffect(() => {
        window.gm_authFailure = () => {
            console.error("Google Maps Authentication Failed. Check API Key and restrictions.");
            alert("Error de autenticación de Google Maps. Verifique su API Key.");
        };
    }, []);

    // Initialize Map
    const initMap = useCallback(() => {
        console.log("Initializing Map...");
        if (!mapRef.current || !window.google) {
            console.warn("Map container or Google script not ready.");
            return;
        }

        try {
            const defaultLocation = { lat: 20.967, lng: -89.624 }; // Merida

            const map = new window.google.maps.Map(mapRef.current, {
                center: defaultLocation,
                zoom: 19,
                mapTypeId: 'satellite',
                tilt: 0,
                disableDefaultUI: true, // Nukes all default controls (Zoom, MapType, StreetView, etc.)
                gestureHandling: 'greedy', // Improves touch interaction
            });

            console.log("Map instance created.");
            setMapInstance(map);

            // Listener to dismiss guide on interaction (click/touch)
            map.addListener("mousedown", () => {
                setShowGuide(false);
            });

            const dm = new window.google.maps.drawing.DrawingManager({
                drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
                drawingControl: false,
                polygonOptions: {
                    fillColor: '#f97316',
                    fillOpacity: 0.4,
                    strokeWeight: 4,
                    strokeColor: '#ea580c',
                    clickable: true,
                    editable: true,
                    zIndex: 1,
                },
            });

            dm.setMap(map);
            setDrawingManager(dm);

            // AUTO-ENABLE DRAWING MODE
            dm.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);

            if (searchInputRef.current) {
                const searchBox = new window.google.maps.places.SearchBox(searchInputRef.current);
                map.addListener("bounds_changed", () => {
                    searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
                });

                searchBox.addListener("places_changed", () => {
                    const places = searchBox.getPlaces();
                    if (!places || places.length === 0) return;
                    const bounds = new window.google.maps.LatLngBounds();
                    places.forEach((place) => {
                        if (!place.geometry || !place.geometry.location) return;

                        const address = place.formatted_address || '';
                        const city = place.address_components?.find(c =>
                            c.types.includes('locality') || c.types.includes('administrative_area_level_2')
                        )?.long_name || '';
                        const state = place.address_components?.find(c =>
                            c.types.includes('administrative_area_level_1')
                        )?.long_name || '';
                        const postal_code = place.address_components?.find(c =>
                            c.types.includes('postal_code')
                        )?.long_name || '';

                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        const maps_link = `https://www.google.com/maps?q=${lat},${lng}`;

                        setManualLocation(prev => ({
                            ...prev,
                            address,
                            city,
                            state,
                            postal_code
                        }));

                        notifyLocation({ address, city, state, maps_link, postal_code });

                        if (place.geometry.viewport) {
                            bounds.union(place.geometry.viewport);
                        } else {
                            bounds.extend(place.geometry.location);
                        }
                    });

                    map.fitBounds(bounds);
                    // Re-enable drawing mode after search
                    if (dm) dm.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);

                    // AUTO-SCROLL TO MAP
                    setTimeout(() => {
                        map.setZoom(20);
                        const mapContainer = document.getElementById('map-viewport-container');
                        mapContainer?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Trigger Visual Guide
                        setShowGuide(true);
                    }, 300);
                });
            }

            setMapLoaded(true);
            console.log("Map initialization complete.");
        } catch (err) {
            console.error("Critical error during Map initialization:", err);
        }
    }, [notifyLocation]);

    useEffect(() => {
        if (mode === 'map' && isGoogleMapsLoaded() && !mapLoaded) {
            initMap();
        }
    }, [mode, initMap, mapLoaded]);

    const calculateTotalArea = useCallback(() => {
        if (!window.google || !window.google.maps.geometry) return;

        let totalArea = 0;
        if (activePolygon) {
            totalArea = window.google.maps.geometry.spherical.computeArea(activePolygon.getPath());
        } else {
            polygons.forEach(poly => {
                totalArea += window.google.maps.geometry.spherical.computeArea(poly.getPath());
            });
        }

        const roundedArea = Math.round(totalArea);
        setArea(roundedArea);
        onAreaCalculated(roundedArea);

        // Reverse Geocode (Address update)
        if (window.google.maps.Geocoder) {
            const path = activePolygon ? activePolygon.getPath() : (polygons[0]?.getPath());
            if (path) {
                const bounds = new window.google.maps.LatLngBounds();
                path.forEach(p => bounds.extend(p));
                const geocoder = new window.google.maps.Geocoder();
                const center = bounds.getCenter();

                geocoder.geocode({ location: center }, (results, status) => {
                    if (status === 'OK' && results?.[0]) {
                        const res = results[0];
                        const loc = {
                            address: res.formatted_address,
                            city: res.address_components?.find(c => c.types.includes('locality'))?.long_name || '',
                            state: res.address_components?.find(c => c.types.includes('administrative_area_level_1'))?.long_name || '',
                            postal_code: res.address_components?.find(c => c.types.includes('postal_code'))?.long_name || '',
                            maps_link: `https://www.google.com/maps?q=${center.lat()},${center.lng()}`
                        };
                        notifyLocation(loc);
                        setManualLocation({ address: loc.address, city: loc.city, state: loc.state, customCity: '', customState: '', postal_code: loc.postal_code });
                    }
                });
            }
        }
    }, [polygons, activePolygon, onAreaCalculated, notifyLocation]);

    useEffect(() => {
        if (!drawingManager) return;
        console.log("Setting up DrawingManager listeners...");

        const listener = window.google.maps.event.addListener(drawingManager, 'overlaycomplete', (event: any) => {
            console.log("Overlay complete event triggered");
            const newPolygon = event.overlay as google.maps.Polygon;

            // Clear existing polygons to keep it simple (one roof at a time)
            polygons.forEach(p => p.setMap(null));
            if (activePolygon) activePolygon.setMap(null);

            setPolygons([newPolygon]);
            setActivePolygon(newPolygon);

            const path = newPolygon.getPath();

            // Critical fix: Ensure listeners are attached to the NEW path
            const updateArea = () => {
                const totalArea = window.google.maps.geometry.spherical.computeArea(path);
                const rounded = Math.round(totalArea);
                setArea(rounded);
                onAreaCalculated(rounded);
                console.log("Area recalculated:", rounded);
            };

            ['set_at', 'insert_at', 'remove_at'].forEach(evt => {
                window.google.maps.event.addListener(path, evt, updateArea);
            });

            drawingManager.setDrawingMode(null);
            updateArea(); // Calculate immediately on completion

            if (showInstructions) setShowInstructions(false);
            if (showGuide) setShowGuide(false);
        });

        const modeListener = window.google.maps.event.addListener(drawingManager, 'drawingmode_changed', () => {
            console.log("Drawing mode changed to:", drawingManager.getDrawingMode());
        });

        return () => {
            window.google.maps.event.removeListener(listener);
            window.google.maps.event.removeListener(modeListener);
        };
    }, [drawingManager, calculateTotalArea, polygons, activePolygon, showInstructions]);

    const clearMap = () => {
        polygons.forEach(p => p.setMap(null));
        markers.forEach(m => m.setMap(null));
        if (activePolygon) activePolygon.setMap(null);
        setPolygons([]);
        setMarkers([]);
        setActivePolygon(null);
        setArea(0);
        onAreaCalculated(0);
        if (drawingManager) drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
        if (drawingManager) drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
        setShowInstructions(true);
        setShowGuide(false);
    };

    const locateUser = () => {
        if (navigator.geolocation && mapInstance) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                mapInstance.setCenter(center);
                mapInstance.setZoom(19);
                if (drawingManager) drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
            });
        }
    };

    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <div className="w-full h-[400px] flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl animate-pulse">
                <MapIcon className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-400 dark:text-slate-300 font-medium tracking-tight">Verificando configuración...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 p-6 bg-white dark:bg-slate-900 transition-colors duration-500">
            {GOOGLE_MAPS_API_KEY && shouldLoadMaps && (
                <Script
                    src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry,places`}
                    onLoad={initMap}
                    strategy="lazyOnload"
                />
            )}

            {/* Header / Mode Switcher */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-secondary dark:text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm shadow-sm">1</span>
                        Medir Superficie
                    </h3>
                    <p className="text-sm text-muted-foreground ml-10">Elija su método preferido:</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full relative h-12 w-full max-w-[320px] self-center md:self-auto overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700">
                    {/* Sliding Capsule */}
                    <motion.div
                        className="absolute bg-white dark:bg-slate-700 h-[calc(100%-8px)] rounded-full shadow-md z-0"
                        initial={false}
                        animate={{
                            x: mode === 'map' ? 0 : '100%',
                            left: mode === 'map' ? 4 : -4,
                            width: 'calc(50% - 4px)'
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30
                        }}
                    />
                    <button
                        onClick={() => setMode('map')}
                        className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-4 rounded-full text-xs font-bold transition-colors duration-300 ${mode === 'map' ? 'text-primary' : 'text-slate-500'}`}
                    >
                        <PencilRuler className="w-4 h-4" /> Mapa
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-4 rounded-full text-xs font-bold transition-colors duration-300 ${mode === 'manual' ? 'text-primary' : 'text-slate-500'}`}
                    >
                        <Keyboard className="w-4 h-4" /> Manual
                    </button>
                </div>
            </div>

            {/* Manual Input Mode */}
            <div className={`${mode === 'manual' ? 'block' : 'hidden'} bg-muted/30 dark:bg-slate-800/20 p-8 rounded-xl border border-border dark:border-slate-800 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300 max-w-2xl mx-auto w-full`}>
                <div className="text-center space-y-4">
                    <Keyboard className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-secondary dark:text-white">Ingrese los Detalles Manualmente</h4>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        Complete la información para generar su cotización exacta.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-300 uppercase mb-1.5 ml-1 flex items-center gap-1">
                            Área del Techo (m²) <span className="text-primary">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={area || ''}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setArea(val);
                                    onAreaCalculated(val);
                                }}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-2xl font-black text-secondary dark:text-white rounded-xl p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0"
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold pointer-events-none">m²</span>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-300 uppercase mb-1.5 ml-1 flex items-center gap-1">
                            Dirección Completa <span className="text-primary">*</span>
                        </label>
                        <input
                            type="text"
                            value={manualLocation.address}
                            onChange={(e) => {
                                const newLoc = { ...manualLocation, address: e.target.value };
                                setManualLocation(newLoc);
                                notifyLocation({ ...newLoc, maps_link: '', city: newLoc.city === 'Otro' ? newLoc.customCity : newLoc.city, state: newLoc.state === 'Otro' ? newLoc.customState : newLoc.state });
                            }}
                            className={`w-full bg-white dark:bg-slate-800 border ${!manualLocation.address && area > 0 ? 'border-red-300 bg-red-50/30' : 'border-slate-200 dark:border-slate-700'} text-sm font-medium text-secondary dark:text-white rounded-xl p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                            placeholder="Calle, Número, Colonia..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-300 uppercase mb-1.5 ml-1 flex items-center gap-1">
                            Código Postal <span className="text-primary">*</span>
                        </label>
                        <input
                            type="text"
                            value={manualLocation.postal_code}
                            onChange={(e) => {
                                const newLoc = { ...manualLocation, postal_code: e.target.value.replace(/\D/g, '').slice(0, 5) };
                                setManualLocation(newLoc);
                                notifyLocation({ ...newLoc, maps_link: '', city: newLoc.city === 'Otro' ? newLoc.customCity : newLoc.city, state: newLoc.state === 'Otro' ? newLoc.customState : newLoc.state });
                            }}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-secondary dark:text-white rounded-xl p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="CP (5 dígitos)"
                            maxLength={5}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-300 uppercase mb-1.5 ml-1 flex items-center gap-1">
                            Estado <span className="text-primary">*</span>
                        </label>
                        <select
                            value={manualLocation.state}
                            onChange={(e) => {
                                const state = e.target.value;
                                const firstCity = activeRegions[state]?.[0] || '';
                                const newLoc = { ...manualLocation, state, city: (state === 'Otro' ? 'Otro' : firstCity), customState: '', customCity: '' };
                                setManualLocation(newLoc);
                                notifyLocation({
                                    ...newLoc,
                                    state: state === 'Otro' ? '' : state,
                                    city: state === 'Otro' ? '' : newLoc.city,
                                    maps_link: ''
                                });
                            }}
                            className={`w-full bg-white dark:bg-slate-800 border ${!manualLocation.state && area > 0 ? 'border-red-300 bg-red-50/30' : 'border-slate-200 dark:border-slate-700'} text-sm font-medium text-secondary dark:text-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer`}
                        >
                            <option value="">Seleccione Estado</option>
                            {Object.keys(activeRegions).sort().map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                            <option value="Otro">Otro (Especificar)</option>
                        </select>
                        {manualLocation.state === 'Otro' && (
                            <input
                                type="text"
                                placeholder="Nombre del Estado..."
                                value={manualLocation.customState}
                                onChange={(e) => {
                                    const customState = e.target.value;
                                    const newLoc = { ...manualLocation, customState };
                                    setManualLocation(newLoc);
                                    notifyLocation({ ...newLoc, state: customState, city: manualLocation.customCity || manualLocation.city, maps_link: '' });
                                }}
                                className="mt-2 w-full bg-white border border-primary/30 text-sm font-bold text-primary rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none animate-in fade-in slide-in-from-top-1"
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-300 uppercase mb-1.5 ml-1 flex items-center gap-1">
                            Ciudad <span className="text-primary">*</span>
                        </label>
                        <select
                            value={manualLocation.city}
                            onChange={(e) => {
                                const cityVal = e.target.value;
                                const newLoc = { ...manualLocation, city: cityVal, customCity: '' };
                                setManualLocation(newLoc);
                                notifyLocation({
                                    ...newLoc,
                                    city: cityVal === 'Otro' ? '' : cityVal,
                                    state: manualLocation.state === 'Otro' ? manualLocation.customState : manualLocation.state,
                                    maps_link: ''
                                });
                            }}
                            className={`w-full bg-white dark:bg-slate-800 border ${!manualLocation.city && area > 0 ? 'border-red-300 bg-red-50/30' : 'border-slate-200 dark:border-slate-700'} text-sm font-medium text-secondary dark:text-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer`}
                        >
                            <option value="">Seleccione Ciudad</option>
                            {(activeRegions[manualLocation.state] || []).map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                            <option value="Otro">Otro (Especificar)</option>
                        </select>
                        {manualLocation.city === 'Otro' && (
                            <input
                                type="text"
                                placeholder="Nombre de la Ciudad..."
                                value={manualLocation.customCity}
                                onChange={(e) => {
                                    const customCity = e.target.value;
                                    const newLoc = { ...manualLocation, customCity };
                                    setManualLocation(newLoc);
                                    notifyLocation({ ...newLoc, city: customCity, state: manualLocation.state === 'Otro' ? manualLocation.customState : manualLocation.state, maps_link: '' });
                                }}
                                className="mt-2 w-full bg-white border border-primary/30 text-sm font-bold text-primary rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none animate-in fade-in slide-in-from-top-1"
                            />
                        )}
                    </div>
                </div>

                {/* Continue Button for Manual Mode */}
                {area > 0 && manualLocation.address && manualLocation.state && manualLocation.city && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="pt-4 flex justify-center"
                    >
                        <button
                            onClick={() => {
                                document.getElementById('roof-type-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className="bg-secondary dark:bg-primary text-white font-black px-12 py-4 rounded-2xl shadow-xl hover:scale-105 transition-all uppercase tracking-widest flex items-center gap-2 group"
                        >
                            Ver Opciones de Techo
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Map Mode */}
            <div className={`${mode === 'map' ? 'block' : 'hidden'} space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto w-full`}>
                {/* Search Bar & Prompt Container */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className={`h-5 w-5 ${(!manualLocation.address && showAddressPrompt) ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                        </div>
                        <input
                            ref={searchInputRef}
                            id="map-search-input"
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder={mapLoaded ? "Busque su dirección para centrar el mapa..." : "Cargando mapa..."}
                            className={`w-full bg-muted dark:bg-slate-800 border-2 text-secondary dark:text-white text-sm md:text-base font-bold rounded-xl block pl-12 p-3.5 focus:ring-4 focus:ring-primary/20 focus:border-primary placeholder-muted-foreground transition-all shadow-sm ${(!manualLocation.address && showAddressPrompt && searchText.length < 3) ? 'border-primary/50 ring-2 ring-primary/10' : 'border-border dark:border-slate-700'}`}
                            disabled={!mapLoaded}
                        />
                    </div>

                    {/* Side Prompt - Hidden when active searching (3+ chars) or address found */}
                    <AnimatePresence>
                        {(!manualLocation.address && showAddressPrompt && searchText.length < 3 && mapLoaded) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center justify-center gap-3 bg-primary text-white px-6 py-3.5 rounded-xl shadow-lg border border-white/10 shrink-0"
                            >
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.1em] leading-none">
                                    ESCRIBE TU DIRECCIÓN AQUÍ
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Map Container */}
                <div id="map-viewport-container" className="relative w-full h-[450px] sm:h-[550px] rounded-2xl overflow-hidden shadow-2xl border border-border dark:border-slate-800 bg-slate-100 dark:bg-slate-900">

                    {/* CENTER CROSSHAIR (Helpful for initial click) */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none transition-opacity duration-300 ${(area > 0 || !showInstructions) ? 'opacity-20' : 'opacity-100'}`}>
                        <div className="relative w-8 h-8 flex items-center justify-center">
                            <div className="absolute w-px h-8 bg-primary/40" />
                            <div className="absolute w-8 h-px bg-primary/40" />
                            <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                        </div>
                    </div>

                    {/* INSTRUCTIONS OVERLAY */}
                    <AnimatePresence>
                        {showInstructions && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-40 bg-secondary/60 backdrop-blur-[2px] flex items-center justify-center p-6 text-center cursor-pointer"
                                onClick={() => setShowInstructions(false)}
                            >
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl max-w-sm border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MapIcon className="w-8 h-8 text-primary" />
                                    </div>
                                    <h4 className="text-xl font-bold text-secondary dark:text-white mb-2">¡Ubica tu Techo!</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                                        Para una cotización precisa, <span className="text-primary font-bold">primero escribe tu dirección</span> en el buscador de arriba. <br /><br />Luego, haz clic en las esquinas de tu techo para medir los m².
                                    </p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowInstructions(false);
                                            setShowAddressPrompt(true);
                                            // Scroll to search input if not fully visible
                                            setTimeout(() => {
                                                const searchInput = document.getElementById('map-search-input');
                                                searchInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                setTimeout(() => searchInputRef.current?.focus(), 600);
                                            }, 100);
                                        }}
                                        className="bg-secondary dark:bg-primary text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-sm w-full shadow-lg hover:scale-105 transition-all"
                                    >
                                        EMPEZAR AHORA
                                    </button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {/* VISUAL GUIDE (Toast + Hand) */}
                    <AnimatePresence>
                        {showGuide && (
                            <>
                                {/* Toast Notification */}
                                <motion.div
                                    initial={{ opacity: 0, y: -20, x: '-50%' }}
                                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                                    exit={{ opacity: 0, y: -20, x: '-50%' }}
                                    className="absolute top-4 left-1/2 z-30 pointer-events-none w-full flex justify-center px-4"
                                >
                                    <div className="bg-slate-900/90 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-lg border border-white/10 flex items-center gap-3 max-w-full">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shrink-0" />
                                        <p className="text-xs md:text-sm font-bold tracking-wide text-center leading-tight">
                                            📍 Toca las esquinas para dibujar tu techo
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Hand Animation Overlay & Lines */}
                                <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden flex items-center justify-center">
                                    {/* Simulated Lines (SVG) */}
                                    <svg className="absolute w-[200px] h-[200px] overflow-visible opacity-80" viewBox="-100 -100 200 200">
                                        <motion.path
                                            d="M -60 -40 L -60 40 L 60 40 L 60 -40 Z" // Counter-clockwise rectangle
                                            fill="rgba(249, 115, 22, 0.2)" // primary/20 fill
                                            stroke="#f97316" // primary orange
                                            strokeWidth="3"
                                            strokeDasharray="10 5" // Dashed line to look like a "draft"
                                            // Sequence: Draw (0->90%) -> Fade Out (90%->100%)
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{
                                                pathLength: [0, 0.2, 0.5, 0.7, 1, 1], // Draw linearly then hold
                                                opacity: [1, 1, 1, 1, 1, 0] // Visible then fade out
                                            }}
                                            // Times scaled to 0->0.9 for drawing (Constant Speed)
                                            // T1=0, T2=0.18, T3=0.45, T4=0.63, T5=0.90 (Complete), T6=1.0 (Fade)
                                            transition={{
                                                duration: 5,
                                                times: [0, 0.18, 0.45, 0.63, 0.9, 1],
                                                repeat: Infinity,
                                                repeatDelay: 1,
                                                ease: "linear"
                                            }}
                                        />
                                        {/* Corner Dots */}
                                        {[
                                            { cx: -60, cy: -40, delay: 0 },
                                            { cx: -60, cy: 40, delay: 0.9 }, // 5s * 0.18
                                            { cx: 60, cy: 40, delay: 2.25 }, // 5s * 0.45
                                            { cx: 60, cy: -40, delay: 3.15 }  // 5s * 0.63
                                        ].map((dot, i) => (
                                            <motion.circle
                                                key={i}
                                                cx={dot.cx}
                                                cy={dot.cy}
                                                r="4"
                                                fill="white"
                                                stroke="#f97316"
                                                strokeWidth="2"
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                                                transition={{ delay: dot.delay, duration: 0.3 }} // Simple stagger
                                            // Note: Perfect sync is hard in loop, keeping simple dots visible during cycle
                                            // For loop reset we'd need complex keyframes, let's keep it simple: static markers appearing once
                                            />
                                        ))}
                                    </svg>

                                    {/* Hand Cursor */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -36, y: -16 }}
                                        animate={{
                                            opacity: [0, 1, 1, 1, 1, 0], // Stay visible then fade
                                            // 6 Coordinates to match 6 Time points (Last one holds position)
                                            x: [-36, -36, 84, 84, -36, -36],
                                            y: [-16, 64, 64, -16, -16, -16],
                                        }}
                                        transition={{
                                            duration: 5, // Exact sync with Line (5s)
                                            times: [0, 0.18, 0.45, 0.63, 0.9, 1],
                                            repeat: Infinity,
                                            repeatDelay: 1,
                                            ease: "linear"
                                        }}
                                        className="absolute -ml-6 -mt-6 z-30"
                                    >
                                        {/* Clean Cursor - No effects */}
                                        <div className="relative">
                                            <MousePointer2 className="w-12 h-12 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] fill-black/20" strokeWidth={1.5} />
                                        </div>
                                    </motion.div>
                                </div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Dark Overlay for Instruction Focus */}
                    <AnimatePresence>
                        {showGuide && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={(e) => {
                                    e.stopPropagation(); // Stop click from reaching map
                                    setShowGuide(false);
                                }}
                                className="absolute inset-0 z-10 bg-black/40 cursor-pointer transition-opacity"
                            />
                        )}
                    </AnimatePresence>

                    {/* CSS Override for Map Cursor */}
                    <style jsx global>{`
                        /* Force default cursor on map canvas to override crosshair */
                        .gm-style canvas, .gm-style, .gm-style div, .gm-style span, .gm-style iframe {
                            cursor: default !important;
                        }
                        /* Restore pointer for controls/buttons */
                        .gm-style button, .gm-style button img, .gm-style button span {
                            cursor: pointer !important;
                        }
                    `}</style>

                    <div ref={mapRef} className="w-full h-full" />

                    <div className={`absolute inset-0 flex flex-col items-center justify-center bg-slate-100 z-10 transition-opacity duration-300 ${!mapLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <MapIcon className="w-8 h-8 text-muted-foreground animate-pulse" />
                    </div>

                    {/* Map Controls */}
                    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
                        {/* Only Reset Button - Redesigned */}
                        <button
                            onClick={clearMap}
                            className="w-14 h-14 bg-red-600 text-white rounded-full shadow-xl hover:bg-red-700 hover:scale-105 transition-all flex items-center justify-center border-2 border-white/20"
                            title="Reiniciar Mapa"
                            aria-label="Limpiar dibujos del mapa"
                        >
                            <RotateCcw className="w-7 h-7" />
                        </button>
                    </div>
                </div>

                {/* Result Bar */}
                <div className="flex items-center justify-between p-4 bg-muted/50 dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700">
                    <div>
                        <p className="text-xs text-muted-foreground dark:text-slate-400 font-semibold uppercase tracking-wider">Área Dibujada</p>
                        <p className="text-2xl font-bold text-secondary dark:text-white">{area} m²</p>
                    </div>
                    {area > 0 && <span className="text-green-600 font-medium text-sm flex items-center gap-1">✓ Área capturada</span>}
                </div>
            </div>
        </div >
    );
}
