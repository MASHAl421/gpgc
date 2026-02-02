import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Atom, 
  Zap, 
  Sun, 
  ArrowLeft, 
  ExternalLink, 
  Play,
  Lightbulb,
  Magnet,
  CircuitBoard,
  Waves
} from 'lucide-react';

interface Simulation {
  id: string;
  name: string;
  description: string;
  url: string;
  embedUrl: string;
  topics: string[];
}

interface SimulationCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  simulations: Simulation[];
}

// PhET Simulations mapped to Applied Physics course content
const physicsSimulationCategories: SimulationCategory[] = [
  {
    id: 'electrostatics',
    name: 'Electrostatics',
    description: 'Electric charge, fields, Gauss\'s Law, and electric potential simulations',
    icon: Zap,
    color: 'from-amber-500 to-orange-500',
    simulations: [
      {
        id: 'coulombs-law',
        name: 'Coulomb\'s Law',
        description: 'Explore the force between charged objects and understand Coulomb\'s Law',
        url: 'https://phet.colorado.edu/en/simulations/coulombs-law',
        embedUrl: 'https://phet.colorado.edu/sims/html/coulombs-law/latest/coulombs-law_en.html',
        topics: ['Electric Charge', 'Electric Force']
      },
      {
        id: 'charges-and-fields',
        name: 'Charges and Fields',
        description: 'Visualize electric fields and equipotential lines for point charges',
        url: 'https://phet.colorado.edu/en/simulations/charges-and-fields',
        embedUrl: 'https://phet.colorado.edu/sims/html/charges-and-fields/latest/charges-and-fields_en.html',
        topics: ['Electric Field', 'Equipotential Surfaces', 'Field Lines']
      },
      {
        id: 'balloons-and-static-electricity',
        name: 'Balloons and Static Electricity',
        description: 'Explore static electricity, conductors and insulators',
        url: 'https://phet.colorado.edu/en/simulations/balloons-and-static-electricity',
        embedUrl: 'https://phet.colorado.edu/sims/html/balloons-and-static-electricity/latest/balloons-and-static-electricity_en.html',
        topics: ['Electric Charge', 'Conductors', 'Insulators']
      },
      {
        id: 'john-travoltage',
        name: 'John Travoltage',
        description: 'Build up static charge and see sparks fly!',
        url: 'https://phet.colorado.edu/en/simulations/john-travoltage',
        embedUrl: 'https://phet.colorado.edu/sims/html/john-travoltage/latest/john-travoltage_en.html',
        topics: ['Static Electricity', 'Charge Transfer']
      },
      {
        id: 'capacitor-lab-basics',
        name: 'Capacitor Lab: Basics',
        description: 'Explore capacitors and understand electric potential energy storage',
        url: 'https://phet.colorado.edu/en/simulations/capacitor-lab-basics',
        embedUrl: 'https://phet.colorado.edu/sims/html/capacitor-lab-basics/latest/capacitor-lab-basics_en.html',
        topics: ['Electric Potential', 'Capacitance', 'Electric Field']
      }
    ]
  },
  {
    id: 'current-electricity',
    name: 'Current & Electricity',
    description: 'Ohm\'s Law, circuits, resistance, and electromagnetic induction',
    icon: CircuitBoard,
    color: 'from-blue-500 to-cyan-500',
    simulations: [
      {
        id: 'ohms-law',
        name: 'Ohm\'s Law',
        description: 'Explore the relationship between voltage, current, and resistance',
        url: 'https://phet.colorado.edu/en/simulations/ohms-law',
        embedUrl: 'https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_en.html',
        topics: ['Ohm\'s Law', 'Current', 'Resistance', 'Voltage']
      },
      {
        id: 'resistance-in-a-wire',
        name: 'Resistance in a Wire',
        description: 'Learn how wire length and area affect resistance',
        url: 'https://phet.colorado.edu/en/simulations/resistance-in-a-wire',
        embedUrl: 'https://phet.colorado.edu/sims/html/resistance-in-a-wire/latest/resistance-in-a-wire_en.html',
        topics: ['Resistance', 'Resistivity', 'Conductivity']
      },
      {
        id: 'circuit-construction-kit-dc',
        name: 'Circuit Construction Kit: DC',
        description: 'Build and test DC circuits with batteries, resistors, and bulbs',
        url: 'https://phet.colorado.edu/en/simulations/circuit-construction-kit-dc',
        embedUrl: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html',
        topics: ['Electric Current', 'Power in Circuits', 'Current Density']
      },
      {
        id: 'circuit-construction-kit-ac',
        name: 'Circuit Construction Kit: AC',
        description: 'Explore AC circuits with inductors and capacitors',
        url: 'https://phet.colorado.edu/en/simulations/circuit-construction-kit-ac',
        embedUrl: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-ac/latest/circuit-construction-kit-ac_en.html',
        topics: ['Induced EMF', 'Displacement Current', 'Electromagnetism']
      }
    ]
  },
  {
    id: 'magnetism',
    name: 'Magnetism & Induction',
    description: 'Magnetic fields, Ampere\'s Law, Faraday\'s Law, and electromagnetic induction',
    icon: Magnet,
    color: 'from-purple-500 to-pink-500',
    simulations: [
      {
        id: 'faradays-law',
        name: 'Faraday\'s Law',
        description: 'Explore electromagnetic induction and Lenz\'s Law',
        url: 'https://phet.colorado.edu/en/simulations/faradays-law',
        embedUrl: 'https://phet.colorado.edu/sims/html/faradays-law/latest/faradays-law_en.html',
        topics: ['Faraday\'s Law', 'Lenz\'s Law', 'Induced EMF']
      },
      {
        id: 'faradays-electromagnetic-lab',
        name: 'Faraday\'s Electromagnetic Lab',
        description: 'Complete lab for electromagnetic experiments',
        url: 'https://phet.colorado.edu/en/simulations/faradays-electromagnetic-lab',
        embedUrl: 'https://phet.colorado.edu/sims/html/faradays-electromagnetic-lab/latest/faradays-electromagnetic-lab_en.html',
        topics: ['Electromagnetic Induction', 'Motional EMF']
      },
      {
        id: 'magnets-and-electromagnets',
        name: 'Magnets and Electromagnets',
        description: 'Explore magnetic field lines and solenoids',
        url: 'https://phet.colorado.edu/en/simulations/magnets-and-electromagnets',
        embedUrl: 'https://phet.colorado.edu/sims/html/magnets-and-electromagnets/latest/magnets-and-electromagnets_en.html',
        topics: ['Magnetic Field', 'Solenoid', 'Ampere\'s Law']
      },
      {
        id: 'magnet-and-compass',
        name: 'Magnet and Compass',
        description: 'Visualize magnetic field patterns with a compass',
        url: 'https://phet.colorado.edu/en/simulations/magnet-and-compass',
        embedUrl: 'https://phet.colorado.edu/sims/html/magnet-and-compass/latest/magnet-and-compass_en.html',
        topics: ['Magnetic Field Lines', 'Biot-Savart Law']
      },
      {
        id: 'generator',
        name: 'Generator',
        description: 'Understand how generators convert mechanical to electrical energy',
        url: 'https://phet.colorado.edu/en/simulations/generator',
        embedUrl: 'https://phet.colorado.edu/sims/html/generator/latest/generator_en.html',
        topics: ['Faraday\'s Law', 'Induced Magnetic Field']
      }
    ]
  },
  {
    id: 'optics',
    name: 'Optics',
    description: 'Light refraction, interference, diffraction, and polarization',
    icon: Sun,
    color: 'from-yellow-500 to-red-500',
    simulations: [
      {
        id: 'bending-light',
        name: 'Bending Light',
        description: 'Explore refraction, total internal reflection, and Snell\'s Law',
        url: 'https://phet.colorado.edu/en/simulations/bending-light',
        embedUrl: 'https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_en.html',
        topics: ['Refraction', 'Total Internal Reflection']
      },
      {
        id: 'wave-interference',
        name: 'Wave Interference',
        description: 'Explore double-slit interference and wave superposition',
        url: 'https://phet.colorado.edu/en/simulations/wave-interference',
        embedUrl: 'https://phet.colorado.edu/sims/html/wave-interference/latest/wave-interference_en.html',
        topics: ['Two Source Interference', 'Double Slit', 'Thin Film Interference']
      },
      {
        id: 'geometric-optics',
        name: 'Geometric Optics',
        description: 'Learn about lenses and image formation',
        url: 'https://phet.colorado.edu/en/simulations/geometric-optics',
        embedUrl: 'https://phet.colorado.edu/sims/html/geometric-optics/latest/geometric-optics_en.html',
        topics: ['Refraction of Light', 'Lens', 'Image Formation']
      },
      {
        id: 'color-vision',
        name: 'Color Vision',
        description: 'Explore how we perceive colors and light mixing',
        url: 'https://phet.colorado.edu/en/simulations/color-vision',
        embedUrl: 'https://phet.colorado.edu/sims/html/color-vision/latest/color-vision_en.html',
        topics: ['Light Waves', 'Electromagnetic Waves']
      },
      {
        id: 'molecules-and-light',
        name: 'Molecules and Light',
        description: 'Explore how molecules interact with different types of light',
        url: 'https://phet.colorado.edu/en/simulations/molecules-and-light',
        embedUrl: 'https://phet.colorado.edu/sims/html/molecules-and-light/latest/molecules-and-light_en.html',
        topics: ['Polarization', 'Electromagnetic Spectrum']
      },
      {
        id: 'wave-on-a-string',
        name: 'Wave on a String',
        description: 'Explore wave properties, frequency, and wavelength',
        url: 'https://phet.colorado.edu/en/simulations/wave-on-a-string',
        embedUrl: 'https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_en.html',
        topics: ['Wave Theory', 'Diffraction']
      }
    ]
  }
];

interface PhysicsSimulationsProps {
  subjectName: string;
}

const PhysicsSimulations = ({ subjectName }: PhysicsSimulationsProps) => {
  const [selectedCategory, setSelectedCategory] = useState<SimulationCategory | null>(null);
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);

  const handleCategoryClick = (category: SimulationCategory) => {
    setSelectedCategory(category);
  };

  const handleSimulationClick = (simulation: Simulation) => {
    setSelectedSimulation(simulation);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  // Category Grid View
  if (!selectedCategory) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="py-3 sm:pb-4 px-3 sm:px-6 border-b border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0">
              <Atom className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base md:text-lg text-foreground truncate">
                PhET Simulations
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{subjectName}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">
            Interactive physics simulations from PhET Colorado to visualize concepts from your course
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {physicsSimulationCategories.map((category) => {
              const CategoryIcon = category.icon;
              return (
                <Card
                  key={category.id}
                  className="cursor-pointer hover:shadow-lg transition-all border-border group hover:border-primary active:scale-[0.98] overflow-hidden"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className={`h-2 bg-gradient-to-r ${category.color}`} />
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center shrink-0`}>
                        <CategoryIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {category.description}
                        </p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {category.simulations.length} simulations
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Simulations List View
  const CategoryIcon = selectedCategory.icon;
  
  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="py-3 sm:pb-4 px-3 sm:px-6 border-b border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToCategories}
              className="h-8 w-8 sm:h-10 sm:w-10 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br ${selectedCategory.color} flex items-center justify-center shrink-0`}>
              <CategoryIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base md:text-lg text-foreground truncate">
                {selectedCategory.name}
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {selectedCategory.simulations.length} Interactive Simulations
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {selectedCategory.simulations.map((simulation) => (
              <Card
                key={simulation.id}
                className="cursor-pointer hover:shadow-lg transition-all border-border group hover:border-primary active:scale-[0.98]"
                onClick={() => handleSimulationClick(simulation)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${selectedCategory.color} flex items-center justify-center`}>
                      <Play className="h-5 w-5 text-white" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      PhET
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                    {simulation.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {simulation.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {simulation.topics.slice(0, 2).map((topic, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[10px] px-1.5">
                        {topic}
                      </Badge>
                    ))}
                    {simulation.topics.length > 2 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        +{simulation.topics.length - 2}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Simulation Viewer Dialog */}
      <Dialog open={!!selectedSimulation} onOpenChange={() => setSelectedSimulation(null)}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <div className={`h-6 w-6 rounded-md bg-gradient-to-br ${selectedCategory.color} flex items-center justify-center`}>
                <Lightbulb className="h-3 w-3 text-white" />
              </div>
              <span className="truncate">{selectedSimulation?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {selectedSimulation?.description}
              </p>
              <Button variant="outline" size="sm" asChild className="text-xs shrink-0">
                <a href={selectedSimulation?.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  Open in PhET
                </a>
              </Button>
            </div>
            <div className="flex-1 min-h-0 rounded-lg border border-border overflow-hidden bg-background">
              {selectedSimulation && (
                <iframe
                  src={selectedSimulation.embedUrl}
                  className="w-full h-full"
                  title={selectedSimulation.name}
                  allowFullScreen
                />
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground mr-2">Related Topics:</span>
              {selectedSimulation?.topics.map((topic, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhysicsSimulations;
