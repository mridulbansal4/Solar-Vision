// File: src/pages/Index.tsx
// (Full file - This file now contains the location lookup logic)

import { useState } from "react";
import SolarHero from "@/components/SolarHero";
import ForecastForm from "@/components/ForecastForm";
import ForecastResults from "@/components/ForecastResults";

// 1. DEFINE INTERFACES
// This interface matches the FORM's output
interface FormInputData {
  location: string;
  acres: number;
  consumption: number;
}

// This interface matches the RESULTS page's input
interface ForecastDataForResults {
  latitude: number;
  longitude: number;
  acres: number;
  consumption: number;
  location: string; // Also pass the original location string for display
}

// 2. CREATE THE LOCATION LOOKUP "DICTIONARY"
// *** Add all your Pune neighborhoods here ***
const locationLookup: Record<string, { lat: number, lon: number }> = {
  // Main Pune
  'pune': { lat: 18.5204, lon: 73.8567 },
  'kothrud': { lat: 18.5074, lon: 73.8095 },
  'hinjewadi': { lat: 18.5912, lon: 73.7389 },
  'viman nagar': { lat: 18.5679, lon: 73.9143 },
  'pimpri': { lat: 18.6277, lon: 73.8138 },
  'chinchwad': { lat: 18.6277, lon: 73.8138 },
  'pimpri-chinchwad': { lat: 18.6277, lon: 73.8138 },
  'hadapsar': { lat: 18.5089, lon: 73.9244 },
  'aundh': { lat: 18.5529, lon: 73.8091 },
  'wakad': { lat: 18.6015, lon: 73.7663 },
  'baner': { lat: 18.5590, lon: 73.7798 },
  'pune station': { lat: 18.5283, lon: 73.8754 },
  'swargate': { lat: 18.5029, lon: 73.8634 },
  'kharadi': { lat: 18.5528, lon: 73.9268 },
  'katraj': { lat: 18.4520, lon: 73.8604 },
  
  // Add more locations by finding their lat/lon on Google Maps
};

// 3. LOOKUP FUNCTION
const getCoordsFromLocationString = (location: string): { lat: number, lon: number } => {
  const normalizedLocation = location.trim().toLowerCase();
  
  // Check if the exact typed string is a key
  if (locationLookup[normalizedLocation]) {
    return locationLookup[normalizedLocation];
  }

  // Check if any key is *contained* in the user's input (e.g., user types "Kothrud, Pune")
  for (const key in locationLookup) {
    if (normalizedLocation.includes(key)) {
      return locationLookup[key];
    }
  }

  // If no match, return default Pune coordinates
  console.warn(`No specific coordinates found for "${location}". Using default Pune coordinates.`);
  return locationLookup['pune']; // Default fallback
};


const Index = () => {
  const [currentView, setCurrentView] = useState<"hero" | "form" | "results">("hero");
  // 4. UPDATE STATE: This will hold the full data for the results page
  const [forecastData, setForecastData] = useState<ForecastDataForResults | null>(null);

  const handleGetStarted = () => {
    setCurrentView("form");
  };

  // 5. UPDATE SUBMIT HANDLER: This is where the magic happens
  const handleFormSubmit = (data: FormInputData) => {
    
    // Find the coordinates from the location string
    const coords = getCoordsFromLocationString(data.location);

    // Create the full data object for the results page
    const dataForResults: ForecastDataForResults = {
      latitude: coords.lat,
      longitude: coords.lon,
      acres: data.acres,
      consumption: data.consumption,
      location: data.location // Pass the original string for display
    };
    
    setForecastData(dataForResults); // Set the full data object
    setCurrentView("results");
  };

  const handleBackToForm = () => {
    setCurrentView("form");
  };

  return (
    <div className="min-h-screen bg-background">
      {currentView === "hero" && <SolarHero onGetStarted={handleGetStarted} />}
      {currentView === "form" && <ForecastForm onSubmit={handleFormSubmit} />}
      {currentView === "results" && forecastData && (
        <ForecastResults data={forecastData} onBack={handleBackToForm} />
      )}
    </div>
  );
};

export default Index;