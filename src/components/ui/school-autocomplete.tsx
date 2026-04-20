import { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2, MapPin } from "lucide-react";

export interface PlaceSelection {
  name: string;
  city: string;
  state: string;
}

interface SchoolAutocompleteProps {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  onPlaceSelected: (place: PlaceSelection) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

interface Suggestion {
  placeId: string;
  primaryText: string;
  secondaryText: string;
}

let cachedKey: string | null = null;
let loaderPromise: Promise<typeof google> | null = null;
let authFailed = false;

if (typeof window !== "undefined") {
  (window as any).gm_authFailure = () => {
    authFailed = true;
    console.error("[SchoolAutocomplete] Google Maps auth failure - check API key & referrer restrictions");
  };
}

async function loadGoogleMaps(): Promise<typeof google> {
  if (loaderPromise) return loaderPromise;
  if (!cachedKey) {
    try {
      const { data } = await supabase.functions.invoke("get-maps-key");
      cachedKey = data?.apiKey || "";
    } catch {
      cachedKey = "";
    }
  }
  if (!cachedKey) throw new Error("No Maps API key");
  const loader = new Loader({ apiKey: cachedKey, version: "weekly", libraries: ["places"] });
  loaderPromise = loader.importLibrary("places").then(() => google);
  return loaderPromise;
}

export function SchoolAutocomplete({
  id,
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Delhi Public School",
  required,
  disabled,
}: SchoolAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [highlight, setHighlight] = useState(0);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const ensureServices = useCallback(async () => {
    if (serviceRef.current && placesServiceRef.current) return true;
    try {
      await loadGoogleMaps();
      if (authFailed) {
        setApiAvailable(false);
        return false;
      }
      serviceRef.current = new google.maps.places.AutocompleteService();
      // PlacesService requires an HTMLDivElement or a Map - use a hidden div
      const div = document.createElement("div");
      placesServiceRef.current = new google.maps.places.PlacesService(div);
      return true;
    } catch (err) {
      console.error("[SchoolAutocomplete] Failed to load Google Maps:", err);
      setApiAvailable(false);
      return false;
    }
  }, []);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input || input.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const ok = await ensureServices();
      if (!ok || !serviceRef.current) {
        setLoading(false);
        return;
      }
      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      }

      serviceRef.current.getPlacePredictions(
        {
          input: `private school ${input}`,
          types: ["school"],
          componentRestrictions: { country: "in" },
          sessionToken: sessionTokenRef.current,
        },
        (predictions, status) => {
          setLoading(false);
          if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
            setSuggestions([]);
            setOpen(false);
            return;
          }
          const mapped: Suggestion[] = predictions.slice(0, 5).map((p) => ({
            placeId: p.place_id,
            primaryText: p.structured_formatting?.main_text ?? p.description,
            secondaryText: p.structured_formatting?.secondary_text ?? "",
          }));
          setSuggestions(mapped);
          setHighlight(0);
          setOpen(mapped.length > 0);
          setApiAvailable(true);
        }
      );
    } catch {
      setApiAvailable(false);
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
    }
  }, [ensureServices]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    onChange(next);
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchSuggestions(next), 250);
  };

  const handleSelect = (s: Suggestion) => {
    setOpen(false);
    setSuggestions([]);
    skipNextFetchRef.current = true;

    if (!placesServiceRef.current) {
      onChange(s.primaryText);
      onPlaceSelected({ name: s.primaryText, city: "", state: "" });
      return;
    }

    placesServiceRef.current.getDetails(
      {
        placeId: s.placeId,
        fields: ["name", "address_components"],
        sessionToken: sessionTokenRef.current ?? undefined,
      },
      (place, status) => {
        sessionTokenRef.current = null;
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
          onChange(s.primaryText);
          onPlaceSelected({ name: s.primaryText, city: "", state: "" });
          return;
        }
        const components = place.address_components ?? [];
        const findComp = (...types: string[]) =>
          components.find((c) => types.some((t) => c.types.includes(t)))?.long_name ?? "";
        const city =
          findComp("locality") ||
          findComp("administrative_area_level_2") ||
          findComp("administrative_area_level_3");
        const state = findComp("administrative_area_level_1");
        const name = place.name ?? s.primaryText;
        onChange(name);
        onPlaceSelected({ name, city, state });
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(suggestions[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          type="text"
          autoComplete="off"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
        />
        {loading && apiAvailable && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {!apiAvailable && (
        <p className="mt-1 text-xs text-muted-foreground">
          School search unavailable — type your school name manually.
        </p>
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-popover text-popover-foreground border border-input rounded-xl shadow-md overflow-hidden animate-in fade-in-0 zoom-in-95">
          <ul role="listbox" className="max-h-72 overflow-y-auto py-1">
            {suggestions.map((s, idx) => (
              <li
                key={s.placeId}
                role="option"
                aria-selected={highlight === idx}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s);
                }}
                onMouseEnter={() => setHighlight(idx)}
                className={cn(
                  "flex items-start gap-2.5 px-3 py-2.5 cursor-pointer min-h-10 transition-colors",
                  highlight === idx ? "bg-accent" : "hover:bg-accent/60"
                )}
              >
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{s.primaryText}</span>
                  {s.secondaryText && (
                    <span className="text-xs text-muted-foreground truncate">{s.secondaryText}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
