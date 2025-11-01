import { Button } from "@/components/ui/button";
import heroImage from "@/assets/solar-hero.jpg";

interface SolarHeroProps {
  onGetStarted: () => void;
}

const SolarHero = ({ onGetStarted }: SolarHeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/80" />
      
      {/* Content */}
      <div className="relative z-10 text-center text-primary-foreground max-w-4xl mx-auto px-6">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Solar Energy
          <span className="block bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
            Forecasting
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
          Predict renewable energy output for your land in India using advanced machine learning and historical data
        </p>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center space-x-2 text-lg">
            <span className="w-2 h-2 bg-secondary rounded-full"></span>
            <span>Accurate solar forecasting for Indian locations</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-lg">
            <span className="w-2 h-2 bg-secondary rounded-full"></span>
            <span>Customized predictions based on your land area</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-lg">
            <span className="w-2 h-2 bg-secondary rounded-full"></span>
            <span>Energy consumption optimization insights</span>
          </div>
        </div>
        
        <Button 
          onClick={onGetStarted}
          size="lg"
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold px-8 py-4 text-lg shadow-energy transition-all duration-300 hover:shadow-xl hover:scale-105"
        >
          Start Forecasting
        </Button>
      </div>
    </section>
  );
};

export default SolarHero;