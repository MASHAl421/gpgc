export interface Topic {
  id: string;
  name: string;
  quizCount: number;
  completed: boolean;
}

export interface Unit {
  id: string;
  name: string;
  topics: Topic[];
}

export interface Subject {
  id: string;
  name: string;
  grade: string;
  units: Unit[];
}

export const subjects: Subject[] = [
  {
    id: 'applied-physics-bs',
    name: 'Applied Physics',
    grade: 'BS Level',
    units: [
      {
        id: 'ap-unit-1',
        name: 'Unit 1: Electrostatics',
        topics: [
          { id: 'ap-t1-1', name: 'Electric Charge', quizCount: 40, completed: false },
          { id: 'ap-t1-2', name: 'Conductors and Insulators', quizCount: 35, completed: false },
          { id: 'ap-t1-3', name: 'Charge in Isolated Conductors', quizCount: 30, completed: false },
          { id: 'ap-t1-4', name: 'Electric Fields due to Point Charge', quizCount: 40, completed: false },
          { id: 'ap-t1-5', name: 'Electric Flux', quizCount: 35, completed: false },
          { id: 'ap-t1-6', name: 'Gauss Law and Applications', quizCount: 50, completed: false },
          { id: 'ap-t1-7', name: 'Electric Potential', quizCount: 45, completed: false },
          { id: 'ap-t1-8', name: 'Equipotential Surfaces', quizCount: 30, completed: false },
          { id: 'ap-t1-9', name: 'Field and Potential Gradient', quizCount: 35, completed: false },
        ],
      },
      {
        id: 'ap-unit-2',
        name: 'Unit 2: Current and Electricity',
        topics: [
          { id: 'ap-t2-1', name: 'Electric Current and Current Density', quizCount: 40, completed: false },
          { id: 'ap-t2-2', name: 'Resistance and Resistivity', quizCount: 35, completed: false },
          { id: 'ap-t2-3', name: 'Ohm Law', quizCount: 40, completed: false },
          { id: 'ap-t2-4', name: 'Power in Electric Circuits', quizCount: 35, completed: false },
          { id: 'ap-t2-5', name: 'Magnetic Force on Charge and Current', quizCount: 45, completed: false },
          { id: 'ap-t2-6', name: 'Magnetic Field Lines and Biot-Savart Law', quizCount: 50, completed: false },
          { id: 'ap-t2-7', name: 'Ampere Law - Solenoid and Toroid', quizCount: 45, completed: false },
          { id: 'ap-t2-8', name: 'Faraday Law and Electromagnetic Induction', quizCount: 50, completed: false },
          { id: 'ap-t2-9', name: 'Lenz Law and Motional EMF', quizCount: 40, completed: false },
          { id: 'ap-t2-10', name: 'Displacement Current and Maxwell Equations', quizCount: 45, completed: false },
        ],
      },
      {
        id: 'ap-unit-3',
        name: 'Unit 3: Optics',
        topics: [
          { id: 'ap-t3-1', name: 'Refraction of Light Waves', quizCount: 40, completed: false },
          { id: 'ap-t3-2', name: 'Total Internal Reflection', quizCount: 35, completed: false },
          { id: 'ap-t3-3', name: 'Interference of Light', quizCount: 45, completed: false },
          { id: 'ap-t3-4', name: 'Young Double-Slit Experiment', quizCount: 50, completed: false },
          { id: 'ap-t3-5', name: 'Thin Film Interference', quizCount: 40, completed: false },
          { id: 'ap-t3-6', name: 'Diffraction and Wave Theory', quizCount: 35, completed: false },
          { id: 'ap-t3-7', name: 'Single-Slit Diffraction', quizCount: 45, completed: false },
          { id: 'ap-t3-8', name: 'Polarization of Light', quizCount: 40, completed: false },
          { id: 'ap-t3-9', name: 'Polarizing Sheets and Malus Law', quizCount: 35, completed: false },
        ],
      },
    ],
  },
  {
    id: 'physics-bs',
    name: 'Physics',
    grade: 'BS Level',
    units: [
      {
        id: 'unit-1',
        name: 'Unit 1: Electrostatics',
        topics: [
          { id: 'topic-1', name: 'Properties of Charge', quizCount: 25, completed: false },
          { id: 'topic-2', name: "Coulomb's Law", quizCount: 30, completed: false },
          { id: 'topic-3', name: 'Electric Field and its Intensity', quizCount: 35, completed: false },
          { id: 'topic-4', name: 'Applications of Electrostatics', quizCount: 20, completed: false },
          { id: 'topic-5', name: 'Electric Flux', quizCount: 25, completed: false },
          { id: 'topic-6', name: "Gauss's Law", quizCount: 30, completed: false },
          { id: 'topic-7', name: 'Electric Potential', quizCount: 35, completed: false },
          { id: 'topic-8', name: 'Field and Potential Gradient', quizCount: 20, completed: false },
          { id: 'topic-9', name: 'The Electron Volt', quizCount: 15, completed: false },
          { id: 'topic-10', name: 'Capacitor', quizCount: 40, completed: false },
          { id: 'topic-11', name: 'Electric Polarization', quizCount: 25, completed: false },
          { id: 'topic-12', name: 'Energy Stored in Capacitor', quizCount: 20, completed: false },
        ],
      },
      {
        id: 'unit-2',
        name: 'Unit 2: Current Electricity',
        topics: [
          { id: 'topic-13', name: 'Electric Current', quizCount: 30, completed: false },
          { id: 'topic-14', name: "Ohm's Law", quizCount: 35, completed: false },
          { id: 'topic-15', name: 'Resistivity and Conductivity', quizCount: 25, completed: false },
          { id: 'topic-16', name: 'EMF and Terminal Voltage', quizCount: 20, completed: false },
          { id: 'topic-17', name: "Kirchhoff's Rules", quizCount: 40, completed: false },
        ],
      },
      {
        id: 'unit-3',
        name: 'Unit 3: Magnetism',
        topics: [
          { id: 'topic-18', name: 'Magnetic Field', quizCount: 30, completed: false },
          { id: 'topic-19', name: 'Magnetic Force on Current', quizCount: 35, completed: false },
          { id: 'topic-20', name: "Ampere's Law", quizCount: 25, completed: false },
          { id: 'topic-21', name: 'Electromagnetic Induction', quizCount: 40, completed: false },
        ],
      },
    ],
  },
  {
    id: 'chemistry-bs',
    name: 'Chemistry',
    grade: 'BS Level',
    units: [
      {
        id: 'unit-1',
        name: 'Unit 1: Atomic Structure',
        topics: [
          { id: 'chem-topic-1', name: 'Atomic Models', quizCount: 30, completed: false },
          { id: 'chem-topic-2', name: 'Quantum Numbers', quizCount: 35, completed: false },
          { id: 'chem-topic-3', name: 'Electronic Configuration', quizCount: 40, completed: false },
          { id: 'chem-topic-4', name: 'Periodic Properties', quizCount: 30, completed: false },
        ],
      },
      {
        id: 'unit-2',
        name: 'Unit 2: Chemical Bonding',
        topics: [
          { id: 'chem-topic-5', name: 'Ionic Bonding', quizCount: 25, completed: false },
          { id: 'chem-topic-6', name: 'Covalent Bonding', quizCount: 35, completed: false },
          { id: 'chem-topic-7', name: 'Metallic Bonding', quizCount: 20, completed: false },
          { id: 'chem-topic-8', name: 'Intermolecular Forces', quizCount: 30, completed: false },
        ],
      },
    ],
  },
  {
    id: 'biology-bs',
    name: 'Biology',
    grade: 'BS Level',
    units: [
      {
        id: 'unit-1',
        name: 'Unit 1: Cell Biology',
        topics: [
          { id: 'bio-topic-1', name: 'Cell Structure', quizCount: 40, completed: false },
          { id: 'bio-topic-2', name: 'Cell Membrane', quizCount: 35, completed: false },
          { id: 'bio-topic-3', name: 'Cell Division', quizCount: 45, completed: false },
          { id: 'bio-topic-4', name: 'Cell Organelles', quizCount: 50, completed: false },
        ],
      },
      {
        id: 'unit-2',
        name: 'Unit 2: Genetics',
        topics: [
          { id: 'bio-topic-5', name: 'Mendelian Genetics', quizCount: 35, completed: false },
          { id: 'bio-topic-6', name: 'DNA Structure', quizCount: 40, completed: false },
          { id: 'bio-topic-7', name: 'Gene Expression', quizCount: 30, completed: false },
        ],
      },
    ],
  },
  {
    id: 'mathematics-bs',
    name: 'Mathematics',
    grade: 'BS Level',
    units: [
      {
        id: 'unit-1',
        name: 'Unit 1: Calculus',
        topics: [
          { id: 'math-topic-1', name: 'Limits and Continuity', quizCount: 45, completed: false },
          { id: 'math-topic-2', name: 'Differentiation', quizCount: 60, completed: false },
          { id: 'math-topic-3', name: 'Integration', quizCount: 55, completed: false },
          { id: 'math-topic-4', name: 'Applications', quizCount: 40, completed: false },
        ],
      },
      {
        id: 'unit-2',
        name: 'Unit 2: Linear Algebra',
        topics: [
          { id: 'math-topic-5', name: 'Matrices', quizCount: 35, completed: false },
          { id: 'math-topic-6', name: 'Determinants', quizCount: 30, completed: false },
          { id: 'math-topic-7', name: 'Vector Spaces', quizCount: 40, completed: false },
        ],
      },
    ],
  },
];

export const preparationCategories = [
  { id: 'academic', name: 'Academic Resources', icon: 'BookOpen' },
  { id: 'video', name: 'Video Lectures', icon: 'PlayCircle' },
  { id: 'keynotes', name: 'Key Notes', icon: 'FileText' },
  { id: 'simulations', name: 'Simulations', icon: 'Beaker' },
  { id: 'objective', name: 'Objective Paper', icon: 'ClipboardList' },
  { id: 'subjective', name: 'Subjective Paper', icon: 'PenTool' },
  { id: 'pastpapers', name: 'Past & Model Papers', icon: 'FileStack' },
  { id: 'experiments', name: 'Experiments', icon: 'TestTube' },
];
