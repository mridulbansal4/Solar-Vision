// File: src/components/ForecastResults.tsx
// (Full file - This version receives all data from Index.tsx)

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Sun, Zap, TrendingUp, ArrowLeft, Leaf, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// 1. UPDATE INTERFACE: Must match what Index.tsx passes
interface ForecastData {
  latitude: number;
  longitude: number;
  acres: number;
  consumption: number;
  location: string; // The original location string from the form
}

interface ForecastResultsProps {
  data: ForecastData;
  onBack: () => void;
}

// 2. REMOVE: No geocoding function needed here
// const getCoordsFromLocation = ... (REMOVED)

const ForecastResults = ({ data, onBack }: ForecastResultsProps) => {
  const [prediction, setPrediction] = useState<{ predicted_kwh_month: number | null }>({ predicted_kwh_month: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true);
      setError(null);
      setPrediction({ predicted_kwh_month: null });

      if (!data.acres || data.acres <= 0) {
        setError("Invalid input: Acres must be a positive number.");
        setLoading(false);
        return;
      }

      try {
        // 3. SIMPLIFY: Use data directly from props
        const requestData = {
          latitude: data.latitude,
          longitude: data.longitude,
          acres: data.acres,
        };

        // *** IMPORTANT: Replace with your actual backend API endpoint URL ***
        const apiUrl = 'http://127.0.0.1:5000/predict'; // <<<< CHECK AND UPDATE THIS URL

        console.log("Sending request to API:", apiUrl, "with data:", requestData);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
           let errorBody = 'Could not read error details.';
           try { errorBody = await response.text(); } catch (_) { /* Ignore */ }
           console.error("API Error Response:", response.status, errorBody);
           throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log("API Response:", result);

        if (result && typeof result.predicted_kwh_month === 'number' && !isNaN(result.predicted_kwh_month)) {
           setPrediction({ predicted_kwh_month: result.predicted_kwh_month });
        } else {
           console.error("Invalid prediction format received:", result);
           throw new Error('Invalid prediction format received from API.');
        }

      } catch (fetchErr) {
        console.error("Error fetching prediction:", fetchErr);
        setError(fetchErr instanceof Error ? `API Communication Error: ${fetchErr.message}` : 'An unknown error occurred connecting to the forecast service.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();

  }, [data]); // Effect still depends on the data prop

  // ... (Calculations for actualOutput, surplus, etc. remain the same) ...
  const actualOutput = prediction.predicted_kwh_month ?? 0;
  const surplus = actualOutput - data.consumption;
  const gridPowerReplaced = Math.min(actualOutput, data.consumption);
  const savingsFromReplacement = gridPowerReplaced * 5; // Example rate
  const savingsFromSurplus = surplus > 0 ? surplus * 3 : 0; // Example rate
  const savingsPerMonth = savingsFromReplacement + savingsFromSurplus;
  const co2Offset = actualOutput * 0.7; // Approximation

  // ... (monthlyData generation remains the same) ...
  const monthlyData = useMemo(() => {
    const factors = [0.9, 1.0, 1.15, 1.2, 1.1, 0.8, 0.7, 0.75, 0.85, 1.0, 0.95, 0.9];
    return factors.map((factor, index) => ({
      month: new Date(0, index).toLocaleString('default', { month: 'short' }),
      generation: Math.max(0, Math.round(actualOutput * factor)),
      consumption: data.consumption,
      surplus: Math.round((actualOutput * factor) - data.consumption)
    }));
  }, [actualOutput, data.consumption]);


  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-background to-accent min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header and Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center mb-8 gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="mr-auto sm:mr-4 hover:bg-primary hover:text-primary-foreground self-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            New Forecast
          </Button>
          <div className="text-left sm:text-left flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              Solar Forecast Results
            </h2>
            
            {/* 4. UPDATE DISPLAY: Use the original location string */}
            <p className="text-md md:text-lg text-muted-foreground mt-1 break-words">
              For {data.location} • {data.acres} acres • {data.consumption} kWh/month
            </p>
          </div>
        </div>

        {/* ... (Rest of the file: Loading, Error, and Results JSX remains exactly the same) ... */}
        {/* Loading State */}
        {loading && (
          <div className="space-y-8 animate-pulse">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
               <Skeleton className="h-32 rounded-lg" /> <Skeleton className="h-32 rounded-lg" />
               <Skeleton className="h-32 rounded-lg" /> <Skeleton className="h-32 rounded-lg" />
             </div>
             <div className="grid lg:grid-cols-2 gap-8"><Skeleton className="h-80 rounded-lg" /><Skeleton className="h-80 rounded-lg" /></div>
             <Skeleton className="h-40 mt-8 rounded-lg" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="bg-destructive/10 border-destructive text-destructive-foreground p-6 text-center">
            <CardHeader><CardTitle className="flex items-center justify-center gap-2 text-destructive"><AlertTriangle className="w-6 h-6" /> Error Generating Forecast</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-4 text-destructive-foreground/90">Could not retrieve the solar forecast.</p>
              <p className="text-sm text-destructive-foreground/70">Details: {error}</p>
              <Button onClick={onBack} variant="destructive" className="mt-6">Go Back</Button>
            </CardContent>
          </Card>
        )}

        {/* Results Display */}
        {!loading && !error && prediction.predicted_kwh_month !== null && (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
               <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-energy overflow-hidden"><CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-medium opacity-90">Est. Solar Output</CardTitle><Sun className="w-5 h-5 opacity-90" /></CardHeader><CardContent><div className="text-2xl sm:text-3xl font-bold">{Math.round(actualOutput).toLocaleString()}</div><p className="text-xs opacity-90 text-primary-foreground/80">kWh / month</p></CardContent></Card>
               <Card className={`bg-gradient-to-br ${surplus >= 0 ? 'from-green-600 to-green-800 text-white' : 'from-red-600 to-red-800 text-white'} border-0 shadow-energy overflow-hidden`}><CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-medium opacity-90">{surplus >= 0 ? 'Energy Surplus' : 'Energy Deficit'}</CardTitle><Zap className="w-5 h-5 opacity-90" /></CardHeader><CardContent><div className="text-2xl sm:text-3xl font-bold">{Math.round(surplus).toLocaleString()}</div><p className="text-xs opacity-90 text-current/80">kWh / month</p></CardContent></Card>
               <Card className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-yellow-950 border-0 shadow-energy overflow-hidden"><CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-medium opacity-90">Est. Monthly Savings</CardTitle><TrendingUp className="w-5 h-5 opacity-90" /></CardHeader><CardContent><div className="text-2xl sm:text-3xl font-bold">₹{Math.round(savingsPerMonth).toLocaleString()}</div><p className="text-xs opacity-90 text-current/80">per month (approx.)</p></CardContent></Card>
               <Card className="bg-gradient-to-br from-blue-gray-600 to-blue-gray-800 text-blue-gray-100 border-0 shadow-energy overflow-hidden"><CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-sm font-medium opacity-90">CO₂ Offset</CardTitle><Leaf className="w-5 h-5 opacity-90" /></CardHeader><CardContent><div className="text-2xl sm:text-3xl font-bold">{Math.round(co2Offset).toLocaleString()}</div><p className="text-xs opacity-90 text-current/80">kg CO₂eq / month</p></CardContent></Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm overflow-hidden"><CardHeader><CardTitle className="text-lg sm:text-xl text-primary">Monthly Energy Analysis</CardTitle><CardDescription>Est. Solar Generation vs. Your Consumption</CardDescription></CardHeader><CardContent className="pl-2 pr-4 pb-4"><ResponsiveContainer width="100%" height={300}><BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" /><XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: 'hsl(var(--accent)/0.5)' }} contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", fontSize: '12px', padding: '8px' }} /><Bar dataKey="generation" fill="hsl(var(--primary))" name="Solar Gen (kWh)" radius={[4, 4, 0, 0]} /><Bar dataKey="consumption" fill="hsl(var(--secondary))" name="Consumption (kWh)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card className="shadow-card border-0 bg-card/80 backdrop-blur-sm overflow-hidden"><CardHeader><CardTitle className="text-lg sm:text-xl text-primary">Monthly Energy Surplus/Deficit</CardTitle><CardDescription>Estimated Net Energy (Generation - Consumption)</CardDescription></CardHeader><CardContent className="pl-2 pr-4 pb-4"><ResponsiveContainer width="100%" height={300}><LineChart data={monthlyData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" /><XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} /><Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", fontSize: '12px', padding: '8px' }} /><Line type="monotone" dataKey="surplus" stroke="hsl(var(--secondary))" strokeWidth={2} name="Net Energy (kWh)" dot={false} /><line x1="0%" y1="50%" x2="100%" y2="50%" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeOpacity={0.5} /></LineChart></ResponsiveContainer></CardContent></Card>
            </div>

            {/* Recommendations */}
            {/* 5. UPDATE DISPLAY: Use data.location again */}
            <Card className="mt-8 shadow-card border-0 bg-gradient-to-r from-accent to-accent/50"><CardHeader><CardTitle className="text-xl sm:text-2xl text-accent-foreground">Insights & Recommendations</CardTitle><CardDescription className="text-md sm:text-lg">Based on the forecast for {data.location}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-start space-x-3"><div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0"></div><p className="text-accent-foreground text-sm sm:text-base"><strong>Potential:</strong> Your {data.acres} acres could host a system generating approx. <strong>{Math.round(actualOutput).toLocaleString()} kWh/month</strong> in this area, covering about <strong>{data.consumption > 0 ? Math.max(0, Math.min(100, Math.round((actualOutput / data.consumption) * 100))) : 0}%</strong> of your needs.</p></div><div className="flex items-start space-x-3"><div className={`w-2 h-2 ${surplus >= 0 ? 'bg-secondary' : 'bg-destructive'} rounded-full mt-1.5 shrink-0`}></div><p className="text-accent-foreground text-sm sm:text-base"><strong>Outlook:</strong> You're estimated to have a monthly {surplus >= 0 ? <><strong>surplus</strong> of ~<strong>{Math.round(surplus).toLocaleString()} kWh</strong>. Consider net metering options.</> : <><strong>deficit</strong> of ~<strong>{Math.round(Math.abs(surplus)).toLocaleString()} kWh</strong>. Battery storage or grid reliance will be needed.</>}</p></div><div className="flex items-start space-x-3"><div className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5 shrink-0"></div><p className="text-accent-foreground text-sm sm:text-base"><strong>Financials:</strong> Estimated monthly savings could be around <strong>₹{Math.round(savingsPerMonth).toLocaleString()}</strong>. Obtain detailed quotes for accurate ROI.</p></div><div className="flex items-start space-x-3"><div className="w-2 h-2 bg-muted-foreground rounded-full mt-1.5 shrink-0"></div><p className="text-accent-foreground text-sm sm:text-base"><strong>Environment:</strong> Offsetting ~<strong>{Math.round(co2Offset).toLocaleString()} kg of CO₂eq</strong> monthly makes a positive environmental impact.</p></div><p className="text-xs text-accent-foreground/70 pt-2">*Estimates based on provided data & typical conditions. Actuals vary. Consult solar professionals.</p></CardContent></Card>
          </>
        )}
      </div>
    </section>
  );
};

export default ForecastResults;