// File: src/components/ForecastForm.tsx
// (Full file - This version uses the simple text input for location)

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Zap, Ruler } from "lucide-react";

// 1. UPDATE INTERFACE: This now only contains what the form collects
interface FormInputData {
  location: string;
  acres: number;
  consumption: number;
}

interface ForecastFormProps {
  onSubmit: (data: FormInputData) => void;
}

const ForecastForm = ({ onSubmit }: ForecastFormProps) => {
  // 2. UPDATE STATE: location is now a string
  const [formData, setFormData] = useState<FormInputData>({
    location: "Pune", // Default location string
    acres: 0,
    consumption: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 3. UPDATE VALIDATION: Check for valid inputs
    if (formData.acres > 0 && formData.consumption > 0 && formData.location.trim() !== "") {
      onSubmit(formData); // Pass the raw form data up
    } else {
      alert("Please fill in all fields.");
    }
  };

  // 4. UPDATE HANDLER: Handle string for location, parse numbers for others
  const handleInputChange = (field: keyof FormInputData, value: string) => {
    if (field === 'location') {
      setFormData(prev => ({ ...prev, location: value }));
    } else {
      const numberValue = field === 'acres' ? parseFloat(value) : parseInt(value, 10);
      setFormData(prev => ({
        ...prev,
        [field]: isNaN(numberValue) ? 0 : numberValue
      }));
    }
  };

  return (
    <section className="py-20 px-6 bg-gradient-to-br from-accent to-background">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Get Your Solar Forecast
          </h2>
          <p className="text-xl text-muted-foreground">
            Enter your location in Pune and land details for accurate predictions
          </p>
        </div>

        <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary">Forecast Parameters</CardTitle>
            <CardDescription className="text-lg">
              Provide your details for customized solar energy analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* 5. LOCATION INPUT: This is the simple text input */}
              <div className="space-y-3">
                <Label htmlFor="location" className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Location (Neighborhood in Pune)
                </Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g., Kothrud, Hinjewadi, Pune Station"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="text-lg h-12 border-2 focus:border-primary"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Enter a neighborhood in Pune.
                </p>
              </div>

              {/* Acres Input (No change) */}
              <div className="space-y-3">
                <Label htmlFor="acres" className="text-base font-semibold flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-primary" />
                  Land Area (Acres)
                </Label>
                <Input
                  id="acres"
                  type="number"
                  placeholder="e.g., 5"
                  min="0.1"
                  step="0.1"
                  value={formData.acres || ""}
                  onChange={(e) => handleInputChange("acres", e.target.value)}
                  className="text-lg h-12 border-2 focus:border-primary"
                  required
                />
              </div>

              {/* Consumption Input (No change) */}
              <div className="space-y-3">
                <Label htmlFor="consumption" className="text-base font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Monthly Electricity Consumption (kWh)
                </Label>
                <Input
                  id="consumption"
                  type="number"
                  placeholder="e.g., 500"
                  min="1"
                  value={formData.consumption || ""}
                  onChange={(e) => handleInputChange("consumption", parseInt(e.target.value) || 0)}
                  className="text-lg h-12 border-2 focus:border-primary"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full text-lg h-14 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold shadow-energy transition-all duration-300 hover:shadow-xl"
                // 6. UPDATE Validation for Button
                disabled={!(formData.acres > 0 && formData.consumption > 0 && formData.location.trim() !== "")}
              >
                Generate Solar Forecast
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ForecastForm;