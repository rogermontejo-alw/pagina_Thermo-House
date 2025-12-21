'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Script from 'next/script';
import { Search, Map as MapIcon, RotateCcw, Crosshair, PencilRuler, Keyboard } from 'lucide-react';

import { getAppConfig } from '@/app/actions/get-config';

interface MapCalculatorProps {
    onAreaCalculated: (area: number) => void;
    onLocationUpdated?: (details: { address: string; city: string; state: string; maps_link: string }) => void;
    onAddressFound?: (details: { address: string; city: string; state: string; maps_link: string }) => void;
    onCityDetected?: (details: { address: string; city: string; state: string; maps_link: string }) => void;
}

const MEXICO_REGIONS: Record<string, string[]> = {
    'Yucatán': ['Mérida', 'Progreso', 'Umán', 'Kanasín'],
    'Chihuahua': ['Chihuahua', 'Ciudad Juárez', 'Delicias', 'Cuauhtémoc'],
    'Morelos': ['Cuernavaca', 'Jiutepec', 'Cuautla', 'Temixco']
};

declare global {
    interface Window {
        google: typeof google;
        gm_authFailure?: () => void;
    }
}

const isGoogleMapsLoaded = () => typeof window !== 'undefined' && !!window.google && !!window.google.maps;

export default function MapCalculator({ onAreaCalculated, onLocationUpdated, onAddressFound, onCityDetected }: MapCalculatorProps) {
    // Utility to trigger all location callbacks
    const notifyLocation = useCallback((loc: { address: string; city: string; state: string; maps_link: string }) => {
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

    // Manual Location State
    const [manualLocation, setManualLocation] = useState({
        address: '',
        city: '',
        state: ''
    });

    const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || dbMapsKey || '';

    // Fetch key from DB if missing in env
    useEffect(() => {
        if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY) {
            getAppConfig('GOOGLE_MAPS_KEY').then(val => {
                if (val) setDbMapsKey(val);
            });
        }
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
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true,
            });

            console.log("Map instance created.");
            setMapInstance(map);

            const dm = new window.google.maps.drawing.DrawingManager({
                drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
                drawingControl: true,
                drawingControlOptions: {
                    position: window.google.maps.ControlPosition.TOP_CENTER,
                    drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
                },
                polygonOptions: {
                    fillColor: '#f97316',
                    fillOpacity: 0.4,
                    strokeWeight: 2,
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

                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        const maps_link = `https://www.google.com/maps?q=${lat},${lng}`;

                        notifyLocation({ address, city, state, maps_link });

                        if (place.geometry.viewport) {
                            bounds.union(place.geometry.viewport);
                        } else {
                            bounds.extend(place.geometry.location);
                        }
                    });

                    map.fitBounds(bounds);
                    // Re-enable drawing mode after search
                    if (dm) dm.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);

                    setTimeout(() => {
                        map.setZoom(20);
                    }, 200);
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
                            maps_link: `https://www.google.com/maps?q=${center.lat()},${center.lng()}`
                        };
                        notifyLocation(loc);
                        setManualLocation({ address: loc.address, city: loc.city, state: loc.state });
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
        setShowInstructions(true);
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
                <p className="text-slate-400 font-medium tracking-tight">Verificando configuración...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 p-6 bg-white">
            <Script
                src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry,places`}
                onLoad={initMap}
                strategy="afterInteractive"
            />

            {/* Header / Mode Switcher */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm shadow-sm">1</span>
                        Medir Superficie
                    </h3>
                    <p className="text-sm text-muted-foreground ml-10">Elija su método preferido:</p>
                </div>

                <div className="flex bg-muted p-1 rounded-lg self-center md:self-auto">
                    <button
                        onClick={() => setMode('map')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === 'map' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-secondary'}`}
                    >
                        <PencilRuler className="w-4 h-4" /> Mapa Satelital
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === 'manual' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-secondary'}`}
                    >
                        <Keyboard className="w-4 h-4" /> Entrada Manual
                    </button>
                </div>
            </div>

            {/* Manual Input Mode */}
            <div className={`${mode === 'manual' ? 'block' : 'hidden'} bg-muted/30 p-8 rounded-xl border border-border space-y-6 animate-in fade-in slide-in-from-top-4 duration-300 max-w-2xl mx-auto w-full`}>
                <div className="text-center space-y-4">
                    <Keyboard className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-secondary">Ingrese los Detalles Manualmente</h4>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        Complete la información para generar su cotización exacta.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 flex items-center gap-1">
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
                                className="w-full bg-white border border-slate-200 text-2xl font-black text-secondary rounded-xl p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0"
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none">m²</span>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 flex items-center gap-1">
                            Dirección Completa <span className="text-primary">*</span>
                        </label>
                        <input
                            type="text"
                            value={manualLocation.address}
                            onChange={(e) => {
                                const newLoc = { ...manualLocation, address: e.target.value };
                                setManualLocation(newLoc);
                                notifyLocation({ ...newLoc, maps_link: '' });
                            }}
                            className={`w-full bg-white border ${!manualLocation.address && area > 0 ? 'border-red-300 bg-red-50/30' : 'border-slate-200'} text-sm font-medium text-secondary rounded-xl p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                            placeholder="Calle, Número, Colonia..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 flex items-center gap-1">
                            Estado <span className="text-primary">*</span>
                        </label>
                        <select
                            value={manualLocation.state}
                            onChange={(e) => {
                                const state = e.target.value;
                                const firstCity = MEXICO_REGIONS[state]?.[0] || '';
                                const newLoc = { ...manualLocation, state, city: firstCity };
                                setManualLocation(newLoc);
                                notifyLocation({ ...newLoc, maps_link: '' });
                            }}
                            className={`w-full bg-white border ${!manualLocation.state && area > 0 ? 'border-red-300 bg-red-50/30' : 'border-slate-200'} text-sm font-medium text-secondary rounded-xl p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer`}
                        >
                            <option value="">Seleccione Estado</option>
                            {Object.keys(MEXICO_REGIONS).map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 flex items-center gap-1">
                            Ciudad <span className="text-primary">*</span>
                        </label>
                        <select
                            value={manualLocation.city}
                            onChange={(e) => {
                                const newLoc = { ...manualLocation, city: e.target.value };
                                setManualLocation(newLoc);
                                notifyLocation({ ...newLoc, maps_link: '' });
                            }}
                            className={`w-full bg-white border ${!manualLocation.city && area > 0 ? 'border-red-300 bg-red-50/30' : 'border-slate-200'} text-sm font-medium text-secondary rounded-xl p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer`}
                        >
                            <option value="">Seleccione Ciudad</option>
                            {(MEXICO_REGIONS[manualLocation.state] || []).map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Map Mode */}
            <div className={`${mode === 'map' ? 'block' : 'hidden'} space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 max-w-5xl mx-auto w-full`}>
                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={mapLoaded ? "Busque su dirección para centrar el mapa..." : "Cargando mapa..."}
                        className="w-full bg-muted border border-border text-secondary text-sm rounded-lg block pl-10 p-3 focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-muted-foreground transition-all"
                        disabled={!mapLoaded}
                    />
                </div>

                {/* Map Container */}
                <div className="relative w-full h-[450px] sm:h-[550px] rounded-2xl overflow-hidden shadow-2xl border border-border bg-slate-100">

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
                                <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm border border-slate-100 animate-in zoom-in-95 duration-300">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <PencilRuler className="w-8 h-8 text-primary" />
                                    </div>
                                    <h4 className="text-xl font-bold text-secondary mb-2">¡Mide tu techo!</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                        Ubica tu casa y <span className="text-primary font-bold">haz clic en cada esquina</span> de tu techo. <br />Para calcular m², haz clic en la primera esquina al terminar.
                                    </p>
                                    <button className="bg-secondary text-white px-6 py-2.5 rounded-xl font-bold text-sm w-full">
                                        EMPEZAR AHORA
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div ref={mapRef} className="w-full h-full" />

                    <div className={`absolute inset-0 flex flex-col items-center justify-center bg-slate-100 z-10 transition-opacity duration-300 ${!mapLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <MapIcon className="w-8 h-8 text-muted-foreground animate-pulse" />
                    </div>

                    {/* Map Controls */}
                    <div className="absolute bottom-6 right-14 flex flex-col gap-2 z-20">
                        <button
                            onClick={locateUser}
                            className="p-3 bg-white text-secondary rounded-lg shadow-lg hover:bg-slate-50 transition-colors border border-border"
                            title="Mi Ubicación"
                        >
                            <Crosshair className="w-5 h-5" />
                        </button>
                        <button
                            onClick={clearMap}
                            className="p-3 bg-white text-red-500 rounded-lg shadow-lg hover:bg-red-50 transition-colors border border-border"
                            title="Limpiar Mapa"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Result Bar */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Área Dibujada</p>
                        <p className="text-2xl font-bold text-secondary">{area} m²</p>
                    </div>
                    {area > 0 && <span className="text-green-600 font-medium text-sm flex items-center gap-1">✓ Área capturada</span>}
                </div>
            </div>
        </div>
    );
}
