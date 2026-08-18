import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import AddPage from "@/components/AddPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Polyline,
  Circle,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Controller } from "react-hook-form";
import {
  MapPin,
  Search,
  Loader2,
  Check,
  ChevronsUpDown,
  Plus,
  Undo2,
  Trash2,
  RefreshCw,
  X,
  Copy,
  ClipboardPaste,
} from "lucide-react";
import { cn } from "@/lib/utils";

// إصلاح مشكلة أيقونة الماركر الافتراضية في Leaflet مع الـ bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ===== دوال حسابية مساعدة للـ polygon =====
const toRad = (v) => (v * Math.PI) / 180;

const haversineKm = (a, b) => {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const getCentroid = (pts) => {
  if (!pts?.length) return null;
  const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
  return { lat, lng };
};

const suggestedRadiusKm = (pts) => {
  const c = getCentroid(pts);
  if (!c || !pts.length) return 0;
  return Math.max(...pts.map((p) => haversineKm(c, p)));
};

// دالة تفكيك واستخراج الإحداثيات سواء كانت stringified JSON أو Object/Array
const parseCoordinates = (rawCoords) => {
  if (!rawCoords) return null;
  if (typeof rawCoords === "string") {
    try {
      return JSON.parse(rawCoords);
    } catch {
      return null;
    }
  }
  return rawCoords;
};

// ===== Sub-components خاصة بالخريطة (لازم تكون جوه MapContainer) =====
const ClickHandler = ({ onAddPoint, enabled }) => {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onAddPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], zoom || map.getZoom());
    }
  }, [center]);
  return null;
};

const InvalidateOnResize = () => {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const initialFix = setTimeout(() => map.invalidateSize(), 150);
    const secondFix = setTimeout(() => map.invalidateSize(), 400);

    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(container);

    return () => {
      clearTimeout(initialFix);
      clearTimeout(secondFix);
      ro.disconnect();
    };
  }, [map]);
  return null;
};

const DEFAULT_CENTER = { lat: 31.2001, lng: 29.9187 }; // Alexandria, EG

const ZoneAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [points, setPoints] = useState([]);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [drawEnabled, setDrawEnabled] = useState(true);

  const [mode, setMode] = useState("polygon");
  const [circlePin, setCirclePin] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [coordSearch, setCoordSearch] = useState("");
  const [coordSearchError, setCoordSearchError] = useState("");

  const { data: cities = [], isLoading: isLoadingCities } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/zones/cities/active");
      return res.data.data.data;
    },
  });

  const { data: fetchedData, isLoading: isFetching } = useQuery({
    queryKey: ["zone", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/superadmin/zones/${id}`);
      const raw = data.data.data;
      return {
        ...raw,
        cityId: raw.cityId
          ? String(raw.cityId)
          : raw.city?.id
            ? String(raw.city.id)
            : "",
        deliveryFee:
          raw.deliveryFee !== undefined && raw.deliveryFee !== null
            ? String(raw.deliveryFee)
            : "",
        minOrderAmount:
          raw.minOrderAmount !== undefined && raw.minOrderAmount !== null
            ? String(raw.minOrderAmount)
            : "",
        coverageAreaRadiusKm:
          raw.coverageAreaRadiusKm !== undefined &&
          raw.coverageAreaRadiusKm !== null
            ? String(raw.coverageAreaRadiusKm)
            : "",
        coordinates: parseCoordinates(raw.coordinates) ?? [],
      };
    },
    enabled: !!id && !state?.zoneData,
  });

  const initialData = state?.zoneData || fetchedData;

  // تحميل بيانات الموقع عند التعديل
  useEffect(() => {
    const coords = parseCoordinates(initialData?.coordinates);
    if (!coords) return;

    if (Array.isArray(coords)) {
      if (coords.length === 1) {
        // Single pin inside an array e.g. [{"lat": 30.06, "lng": 31.34}]
        const pin = { lat: Number(coords[0].lat), lng: Number(coords[0].lng) };
        setMode("circle");
        setCirclePin(pin);
        setMapCenter(pin);
      } else if (coords.length > 1) {
        // Multiple points (polygon)
        setMode("polygon");
        setPoints(coords);
        const c = getCentroid(coords);
        if (c) setMapCenter(c);
      }
    } else if (
      typeof coords === "object" &&
      coords.lat !== undefined &&
      coords.lng !== undefined
    ) {
      // Single pin object e.g. {"lat": 30.06, "lng": 31.34}
      const pin = { lat: Number(coords.lat), lng: Number(coords.lng) };
      setMode("circle");
      setCirclePin(pin);
      setMapCenter(pin);
    }
  }, [initialData]);

  const handleMapSearch = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`,
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error fetching location:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddPoint = useCallback((pt) => {
    setPoints((prev) => [...prev, pt]);
  }, []);

  const parseCoordPairString = (text) => {
    if (!text) return null;
    const parts = text
      .split(/[,\s]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length < 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
  };

  const handlePasteCoordField = (e) => {
    const text = e.clipboardData?.getData("text");
    const pair = parseCoordPairString(text);
    if (pair) {
      e.preventDefault();
      setCoordSearch(`${pair.lat}, ${pair.lng}`);
      setCoordSearchError("");
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const pair = parseCoordPairString(text);
      if (pair) {
        setCoordSearch(`${pair.lat}, ${pair.lng}`);
        setCoordSearchError("");
      } else {
        setCoordSearchError(
          'Clipboard doesn\'t contain a valid "lat, lng" pair',
        );
      }
    } catch {
      setCoordSearchError("Couldn't read clipboard — paste manually instead");
    }
  };

  const handleCopyCoords = async (pt) => {
    try {
      await navigator.clipboard.writeText(`${pt.lat}, ${pt.lng}`);
    } catch {
      // Ignore fallback
    }
  };

  const parseCoordSearch = () => {
    const parts = coordSearch
      .split(/[,\s]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length < 2) {
      setCoordSearchError('Enter coordinates as "latitude, longitude"');
      return null;
    }
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setCoordSearchError("Enter a valid latitude and longitude");
      return null;
    }
    if (lat < -90 || lat > 90) {
      setCoordSearchError("Latitude must be between -90 and 90");
      return null;
    }
    if (lng < -180 || lng > 180) {
      setCoordSearchError("Longitude must be between -180 and 180");
      return null;
    }
    setCoordSearchError("");
    return { lat, lng };
  };

  const handleCoordGoTo = () => {
    const pt = parseCoordSearch();
    if (!pt) return;
    setMapCenter(pt);
  };

  const handleMapClick = useCallback(
    (pt) => {
      if (mode === "circle") {
        setCirclePin(pt);
      } else {
        handleAddPoint(pt);
      }
    },
    [mode, handleAddPoint],
  );

  const handleCoordAddPin = () => {
    const pt = parseCoordSearch();
    if (!pt) return;
    handleMapClick(pt);
    setMapCenter(pt);
  };

  const handleSwitchMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setPoints([]);
    setCirclePin(null);
  };

  const handleRemovePoint = (idx) => {
    setPoints((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUndoLastPoint = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  const handleClearAllPoints = () => {
    setPoints([]);
  };

  const handlePointDragEnd = (idx, e) => {
    const { lat, lng } = e.target.getLatLng();
    setPoints((prev) => prev.map((p, i) => (i === idx ? { lat, lng } : p)));
  };

  if (id && (isFetching || isLoadingCities)) return <LoadingSpinner />;

  return (
    <AddPage
      title="Zone"
      apiUrl="/api/superadmin/zones"
      queryKey="zones"
      fields={[]}
      initialData={initialData}
      onSuccessAction={() => navigate(-1)}
    >
      {(methods) => {
        const {
          register,
          control,
          setValue,
          watch,
          formState: { errors, submitCount },
        } = methods;

        const [activeTab, setActiveTab] = useState("basic");
        const [mapInstance, setMapInstance] = useState(null);

        useEffect(() => {
          if (activeTab === "location" && mapInstance) {
            const t = setTimeout(() => mapInstance.invalidateSize(), 150);
            return () => clearTimeout(t);
          }
        }, [activeTab, mapInstance]);

        const watchedRadius = watch("coverageAreaRadiusKm");

        // تزامن حالة الإحداثيات مع Form State
        useEffect(() => {
          if (mode === "circle") {
            // إرسال كائن Pin أحادي فقط { lat, lng } بدون أي إحداثيات polygon تغطية
            setValue(
              "coordinates",
              circlePin
                ? { lat: circlePin.lat, lng: circlePin.lng }
                : undefined,
              { shouldDirty: true, shouldValidate: true },
            );
          } else {
            setValue("coordinates", points, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }
        }, [points, mode, circlePin]);

        const handleAutoCalcRadius = () => {
          if (points.length < 1) return;
          const r = suggestedRadiusKm(points);
          setValue("coverageAreaRadiusKm", r.toFixed(2), {
            shouldDirty: true,
            shouldValidate: true,
          });
        };

        const fieldsByTab = {
          basic: [
            "name",
            "nameAr",
            "nameFr",
            "displayName",
            "displayNameAr",
            "displayNameFr",
            "cityId",
            "deliveryFee",
            "minOrderAmount",
          ],
          location: ["coverageAreaRadiusKm"],
        };

        const tabHasError = (tabKey) =>
          fieldsByTab[tabKey]?.some((fieldName) => errors[fieldName]);

        useEffect(() => {
          if (submitCount > 0) {
            const erroredTab = Object.keys(fieldsByTab).find((key) =>
              tabHasError(key),
            );
            if (erroredTab) setActiveTab(erroredTab);
            else if (mode === "polygon" && points.length < 3)
              setActiveTab("location");
          }
        }, [submitCount, errors]);

        return (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full mt-4"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="basic" className="relative">
                General Info
                {tabHasError("basic") && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </TabsTrigger>
              <TabsTrigger value="location" className="relative">
                Zone Location & Map
                {(tabHasError("location") ||
                  (submitCount > 0 &&
                    mode === "polygon" &&
                    points.length < 3)) && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </TabsTrigger>
            </TabsList>

            {/* 1. المعلومات الأساسية */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Zone Name (EN) *</Label>
                  <Input
                    {...register("name", { required: true })}
                    placeholder="Zone Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zone Name (AR) *</Label>
                  <Input
                    {...register("nameAr", { required: true })}
                    placeholder="الاسم بالعربي"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zone Name (FR) *</Label>
                  <Input
                    {...register("nameFr", { required: true })}
                    placeholder="Nom en français"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Display Name (EN) *</Label>
                  <Input
                    {...register("displayName", { required: true })}
                    placeholder="Display Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Name (AR) *</Label>
                  <Input
                    {...register("displayNameAr", { required: true })}
                    placeholder="اسم العرض بالعربي"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Name (FR) *</Label>
                  <Input
                    {...register("displayNameFr", { required: true })}
                    placeholder="Nom d'affichage"
                  />
                </div>
              </div>

              <div className="space-y-2 flex flex-col">
                <Label>City *</Label>
                <Controller
                  name="cityId"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between font-normal text-left",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value
                            ? cities.find((c) => String(c.id) === field.value)
                                ?.name
                            : "Select City"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[var(--radix-popover-trigger-width)] p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput placeholder="Search city..." />
                          <CommandList>
                            <CommandEmpty>No city found.</CommandEmpty>
                            <CommandGroup>
                              {cities?.map((c) => (
                                <CommandItem
                                  key={c.id}
                                  value={c.name}
                                  onSelect={() => {
                                    field.onChange(String(c.id));
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      String(c.id) === field.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {c.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.cityId && (
                  <span className="text-xs text-red-500">
                    City selection is required
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>Delivery Fee *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("deliveryFee", {
                      required: false,
                      valueAsNumber: true,
                      min: 0,
                    })}
                    placeholder="15.00"
                  />
                  {errors.deliveryFee && (
                    <span className="text-xs text-red-500">
                      Delivery fee is required
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Minimum Order Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("minOrderAmount", {
                      required: false,
                      valueAsNumber: true,
                      min: 0,
                    })}
                    placeholder="50.00"
                  />
                  {errors.minOrderAmount && (
                    <span className="text-xs text-red-500">
                      Minimum order amount is required
                    </span>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* 2. الموقع والخريطة */}
            <TabsContent value="location" className="space-y-4">
              <div className="flex items-center gap-2 pt-2">
                <MapPin className="text-primary w-5 h-5" />
                <h3 className="text-sm font-semibold">
                  Draw Coverage Area on Map
                </h3>
              </div>

              <p className="text-xs text-gray-500 mb-2">
                Click on the map to drop pins one by one — they'll connect
                automatically into the zone's coverage polygon. Drag any pin to
                adjust it, or use the controls below to undo, clear, or jump to
                a location first via search.
              </p>

              {/* SEARCH */}
              <div className="relative z-50 w-full max-w-md">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search location (e.g. Cairo, Alexandria...)"
                    value={searchQuery}
                    onChange={handleMapSearch}
                    className="pl-10"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <ul className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-[9999]">
                    {searchResults.map((result, index) => {
                      const lat = parseFloat(result.lat);
                      const lng = parseFloat(result.lon);
                      return (
                        <li
                          key={index}
                          className="flex items-center justify-between gap-2 px-4 py-2 hover:bg-gray-100 text-sm border-b last:border-none text-gray-700"
                        >
                          <button
                            type="button"
                            className="truncate text-left flex-1 cursor-pointer"
                            onClick={() => {
                              setMapCenter({ lat, lng });
                              setSearchQuery(result.display_name);
                              setSearchResults([]);
                            }}
                            title="Move map here"
                          >
                            {result.display_name}
                          </button>
                          <button
                            type="button"
                            className="shrink-0 p-1 rounded hover:bg-primary/10 text-primary"
                            onClick={() => {
                              handleMapClick({ lat, lng });
                              setMapCenter({ lat, lng });
                              setSearchQuery(result.display_name);
                              setSearchResults([]);
                            }}
                            title={
                              mode === "circle"
                                ? "Set as center pin"
                                : "Add as coverage pin"
                            }
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* SEARCH BY LAT/LNG */}
              <div className="w-full max-w-md space-y-1">
                <span className="text-xs font-medium text-gray-600">
                  Or search by coordinates:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Latitude, Longitude"
                    value={coordSearch}
                    onChange={(e) => setCoordSearch(e.target.value)}
                    onPaste={handlePasteCoordField}
                    className="w-56"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePasteFromClipboard}
                    title='Paste a "lat, lng" pair from clipboard'
                  >
                    <ClipboardPaste className="w-4 h-4 mr-1" />
                    Paste
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCoordGoTo}
                  >
                    <Search className="w-4 h-4 mr-1" />
                    Go
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCoordAddPin}
                    title={
                      mode === "circle"
                        ? "Set as center pin"
                        : "Add as coverage pin"
                    }
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {mode === "circle" ? "Set Pin" : "Add Pin"}
                  </Button>
                </div>
                {coordSearchError && (
                  <span className="text-xs text-red-500">
                    {coordSearchError}
                  </span>
                )}
              </div>

              {/* MODE TOGGLE */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-600 mr-1">
                  Coverage shape:
                </span>
                <Button
                  type="button"
                  variant={mode === "polygon" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSwitchMode("polygon")}
                >
                  Draw Shape (multiple pins)
                </Button>
                <Button
                  type="button"
                  variant={mode === "circle" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSwitchMode("circle")}
                >
                  Single Pin + Radius (circle)
                </Button>
              </div>

              {/* CONTROLS — polygon mode */}
              {mode === "polygon" && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant={drawEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDrawEnabled((v) => !v)}
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    {drawEnabled ? "Drawing: On" : "Drawing: Off"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUndoLastPoint}
                    disabled={points.length === 0}
                  >
                    <Undo2 className="w-4 h-4 mr-1" />
                    Undo Last Pin
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearAllPoints}
                    disabled={points.length === 0}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoCalcRadius}
                    disabled={points.length === 0}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Auto-calculate Radius
                  </Button>
                  <span className="text-xs text-gray-500 ml-1">
                    {points.length} pin{points.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* CONTROLS — circle mode */}
              {mode === "circle" && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCirclePin(null)}
                    disabled={!circlePin}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear Pin
                  </Button>
                  <span className="text-xs text-gray-500 ml-1">
                    {circlePin
                      ? "Click the map to move the pin — set the radius below"
                      : "Click anywhere on the map to place the center pin"}
                  </span>
                </div>
              )}

              {/* MAP */}
              <div className="border rounded-xl p-1 relative h-[400px] overflow-hidden z-10">
                <MapContainer
                  center={[mapCenter.lat, mapCenter.lng]}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  ref={setMapInstance}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <RecenterMap center={mapCenter} />
                  <InvalidateOnResize />
                  <ClickHandler
                    onAddPoint={handleMapClick}
                    enabled={mode === "circle" ? true : drawEnabled}
                  />

                  {mode === "polygon" &&
                    points.map((p, idx) => (
                      <Marker
                        key={idx}
                        position={[p.lat, p.lng]}
                        draggable
                        eventHandlers={{
                          dragend: (e) => handlePointDragEnd(idx, e),
                        }}
                      >
                        <Popup>
                          <div className="text-xs space-y-1">
                            <div>Pin {idx + 1}</div>
                            <div className="font-mono">
                              {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                            </div>
                            <button
                              type="button"
                              className="text-primary flex items-center gap-1"
                              onClick={() => handleCopyCoords(p)}
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                            <button
                              type="button"
                              className="text-red-500 flex items-center gap-1"
                              onClick={() => handleRemovePoint(idx)}
                            >
                              <X className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                  {mode === "polygon" && points.length >= 3 && (
                    <Polygon
                      positions={points.map((p) => [p.lat, p.lng])}
                      pathOptions={{
                        color: "#6366f1",
                        fillColor: "#6366f1",
                        fillOpacity: 0.15,
                      }}
                    />
                  )}
                  {mode === "polygon" && points.length === 2 && (
                    <Polyline
                      positions={points.map((p) => [p.lat, p.lng])}
                      pathOptions={{ color: "#6366f1" }}
                    />
                  )}

                  {mode === "circle" && circlePin && (
                    <Marker
                      position={[circlePin.lat, circlePin.lng]}
                      draggable
                      eventHandlers={{
                        dragend: (e) => {
                          const { lat, lng } = e.target.getLatLng();
                          setCirclePin({ lat, lng });
                        },
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1">
                          <div className="font-mono">
                            {circlePin.lat.toFixed(5)},{" "}
                            {circlePin.lng.toFixed(5)}
                          </div>
                          <button
                            type="button"
                            className="text-primary flex items-center gap-1"
                            onClick={() => handleCopyCoords(circlePin)}
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  {mode === "circle" &&
                    circlePin &&
                    Number(watchedRadius) > 0 && (
                      <Circle
                        center={[circlePin.lat, circlePin.lng]}
                        radius={Number(watchedRadius) * 1000}
                        pathOptions={{
                          color: "#6366f1",
                          fillColor: "#6366f1",
                          fillOpacity: 0.15,
                        }}
                      />
                    )}
                </MapContainer>
              </div>

              {/* RADIUS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>Coverage Area Radius (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    {...register("coverageAreaRadiusKm", {
                      valueAsNumber: true,
                      min: 0,
                    })}
                    placeholder="5.5"
                  />
                </div>
              </div>

              <input type="hidden" {...register("coordinates")} />
            </TabsContent>
          </Tabs>
        );
      }}
    </AddPage>
  );
};

export default ZoneAdd;
