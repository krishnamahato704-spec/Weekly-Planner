import { readStored, writeStored } from './storage';
import { validateNcertProgress, validateNcertNotes } from './dataValidation';
export interface NcertChapter {
  id: string;
  chapterNumber: number;
  title: string;
  theme?: string;
}

export interface NcertBook {
  id: string;
  title: string;
  subject: 'Integrated Social Science' | 'History' | 'Political Science' | 'Geography' | 'Economics';
  classNum: number;
  part?: string;
  description?: string;
  chapters: NcertChapter[];
}

export interface NcertClassInfo {
  classNum: number;
  className: string;
  structureDesc: string;
  books: NcertBook[];
}

export interface RevisionEvent {
  id: string;
  completedAt: string; // ISO date string or '' if legacy unknown
  legacy?: boolean;
  notes?: string;
  taskId?: string; // Linked weekly planner task id if synced from weekly task
}

export interface NcertChapterProgress {
  reading: boolean;
  readingAt?: string;
  notes: boolean;
  notesAt?: string;
  revision: boolean; // Retained for backward compatibility (true if revisionHistory has items)
  revisionAt?: string; // Most recent revision timestamp
  revisionHistory?: RevisionEvent[];
}

export interface ChapterResourceLink {
  id: string;
  title: string;
  url: string;
}

export interface ChapterNoteData {
  text: string;
  primaryLink: string;
  resources: ChapterResourceLink[];
  updatedAt?: string;
}

export type NcertNotesStore = Record<string, ChapterNoteData>;
export type ChapterNotesStore = NcertNotesStore;
export type RevisionHistoryStore = Record<string, RevisionEvent[]>;

export type NcertProgressStore = Record<string, NcertChapterProgress>;

export interface NcertFlatChapter {
  id: string;
  chapterNumber: number;
  title: string;
  theme?: string;
  classNum: number;
  className: string;
  bookId: string;
  bookTitle: string;
  subject: string;
}

export const NCERT_STORAGE_KEY = 'ncertSocialScienceProgress_v3';
export const NCERT_NOTES_STORAGE_KEY = 'ncertChapterNotes_v1';

// Complete dataset for Classes 6-12 Social Science (29 Books, 212 Chapters, 636 Tasks)
export const NCERT_CLASSES_DATA: NcertClassInfo[] = [
  // =========================================================================
  // CLASS 6: Integrated Social Science (1 Book, 14 Chapters)
  // =========================================================================
  {
    classNum: 6,
    className: 'Class 6',
    structureDesc: 'Integrated Social Science (1 Book)',
    books: [
      {
        id: 'c6-b1',
        title: 'Exploring Society: India and Beyond',
        subject: 'Integrated Social Science',
        classNum: 6,
        description: 'New integrated curriculum connecting Geography, History, Civics, and Economics',
        chapters: [
          { id: 'c6-b1-ch1', chapterNumber: 1, title: 'Locating Places on the Earth', theme: 'India and the World: Land and the People' },
          { id: 'c6-b1-ch2', chapterNumber: 2, title: 'Oceans and Continents', theme: 'India and the World: Land and the People' },
          { id: 'c6-b1-ch3', chapterNumber: 3, title: 'Landforms and Life', theme: 'India and the World: Land and the People' },
          { id: 'c6-b1-ch4', chapterNumber: 4, title: 'Timeline and Sources of History', theme: 'Tapestry of the Past' },
          { id: 'c6-b1-ch5', chapterNumber: 5, title: 'India, That is Bharat', theme: 'Tapestry of the Past' },
          { id: 'c6-b1-ch6', chapterNumber: 6, title: 'The Beginnings of Indian Civilisation', theme: 'Tapestry of the Past' },
          { id: 'c6-b1-ch7', chapterNumber: 7, title: "India's Cultural Roots", theme: 'Our Cultural Heritage and Knowledge Traditions' },
          { id: 'c6-b1-ch8', chapterNumber: 8, title: "Unity in Diversity, or 'Many in the One'", theme: 'Our Cultural Heritage and Knowledge Traditions' },
          { id: 'c6-b1-ch9', chapterNumber: 9, title: 'Family and Community', theme: 'Governance and Democracy' },
          { id: 'c6-b1-ch10', chapterNumber: 10, title: 'Grassroots Democracy — Part 1: Governance', theme: 'Governance and Democracy' },
          { id: 'c6-b1-ch11', chapterNumber: 11, title: 'Grassroots Democracy — Part 2: Local Government in Rural Areas', theme: 'Governance and Democracy' },
          { id: 'c6-b1-ch12', chapterNumber: 12, title: 'Grassroots Democracy — Part 3: Local Government in Urban Areas', theme: 'Governance and Democracy' },
          { id: 'c6-b1-ch13', chapterNumber: 13, title: 'The Value of Work', theme: 'Economic Life Around Us' },
          { id: 'c6-b1-ch14', chapterNumber: 14, title: 'Economic Activities Around Us', theme: 'Economic Life Around Us' },
        ],
      },
    ],
  },

  // =========================================================================
  // CLASS 7: 2 Integrated Parts (2 Books, 20 Chapters)
  // =========================================================================
  {
    classNum: 7,
    className: 'Class 7',
    structureDesc: '2 Integrated Parts (2 Books)',
    books: [
      {
        id: 'c7-b1',
        title: 'Exploring Society: India and Beyond – Part 1',
        subject: 'Integrated Social Science',
        classNum: 7,
        part: 'Part 1',
        description: 'Physical diversity, climatic systems, ancient empires, and early governance',
        chapters: [
          { id: 'c7-b1-ch1', chapterNumber: 1, title: 'Geographical Diversity of India' },
          { id: 'c7-b1-ch2', chapterNumber: 2, title: 'Understanding the Weather' },
          { id: 'c7-b1-ch3', chapterNumber: 3, title: 'Climates of India' },
          { id: 'c7-b1-ch4', chapterNumber: 4, title: 'New Beginnings: Cities and States' },
          { id: 'c7-b1-ch5', chapterNumber: 5, title: 'The Rise of Empires' },
          { id: 'c7-b1-ch6', chapterNumber: 6, title: 'The Age of Reorganisation' },
          { id: 'c7-b1-ch7', chapterNumber: 7, title: 'The Gupta Era: An Age of Tireless Creativity' },
          { id: 'c7-b1-ch8', chapterNumber: 8, title: 'How the Land Becomes Sacred' },
          { id: 'c7-b1-ch9', chapterNumber: 9, title: 'From the Rulers to the Ruled: Types of Governments' },
          { id: 'c7-b1-ch10', chapterNumber: 10, title: 'The Constitution of India – An Introduction' },
          { id: 'c7-b1-ch11', chapterNumber: 11, title: 'From Barter to Money' },
          { id: 'c7-b1-ch12', chapterNumber: 12, title: 'Understanding Markets' },
        ],
      },
      {
        id: 'c7-b2',
        title: 'Exploring Society: India and Beyond – Part 2',
        subject: 'Integrated Social Science',
        classNum: 7,
        part: 'Part 2',
        description: 'Farming systems, medieval kingdoms, modern state apparatus, and infrastructure',
        chapters: [
          { id: 'c7-b2-ch1', chapterNumber: 1, title: 'The Story of the Indian Farming' },
          { id: 'c7-b2-ch2', chapterNumber: 2, title: 'India and Her Neighbours' },
          { id: 'c7-b2-ch3', chapterNumber: 3, title: 'Empires and Kingdoms: 6th to 10th Centuries' },
          { id: 'c7-b2-ch4', chapterNumber: 4, title: 'Turning Tides: 11th and 12th Centuries' },
          { id: 'c7-b2-ch5', chapterNumber: 5, title: 'India, a Home to Many' },
          { id: 'c7-b2-ch6', chapterNumber: 6, title: 'The State, the Government, and You' },
          { id: 'c7-b2-ch7', chapterNumber: 7, title: "Infrastructure: Engine of India's Development" },
          { id: 'c7-b2-ch8', chapterNumber: 8, title: 'Banks and the Magic of Finance' },
        ],
      },
    ],
  },

  // =========================================================================
  // CLASS 8: 2 Integrated Parts (2 Books, 15 Chapters)
  // =========================================================================
  {
    classNum: 8,
    className: 'Class 8',
    structureDesc: '2 Integrated Parts (2 Books)',
    books: [
      {
        id: 'c8-b1',
        title: 'Exploring Society: India and Beyond – Part 1',
        subject: 'Integrated Social Science',
        classNum: 8,
        part: 'Part 1',
        description: 'Natural resources, Maratha rise, colonial encounters, and parliamentary democracy',
        chapters: [
          { id: 'c8-b1-ch1', chapterNumber: 1, title: 'Natural Resources and Their Use' },
          { id: 'c8-b1-ch2', chapterNumber: 2, title: "Reshaping India's Political Map" },
          { id: 'c8-b1-ch3', chapterNumber: 3, title: 'The Rise of the Marathas' },
          { id: 'c8-b1-ch4', chapterNumber: 4, title: 'The Colonial Era in India' },
          { id: 'c8-b1-ch5', chapterNumber: 5, title: "Universal Franchise and India's Electoral System" },
          { id: 'c8-b1-ch6', chapterNumber: 6, title: 'The Parliamentary System: Legislature and Executive' },
          { id: 'c8-b1-ch7', chapterNumber: 7, title: 'Factors of Production' },
        ],
      },
      {
        id: 'c8-b2',
        title: 'Exploring Society: India and Beyond – Part 2 (Revised)',
        subject: 'Integrated Social Science',
        classNum: 8,
        part: 'Part 2',
        description: 'World geography, road to independence, judiciary, population, and architecture',
        chapters: [
          { id: 'c8-b2-ch1', chapterNumber: 1, title: 'World Geography: Some Glimpses' },
          { id: 'c8-b2-ch2', chapterNumber: 2, title: "India's Long Road to Independence" },
          { id: 'c8-b2-ch3', chapterNumber: 3, title: 'A Journey Through Indian Architecture' },
          { id: 'c8-b2-ch4', chapterNumber: 4, title: 'The Role of the Judiciary in Our Society' },
          { id: 'c8-b2-ch5', chapterNumber: 5, title: 'Citizenship: Rights and Duties' },
          { id: 'c8-b2-ch6', chapterNumber: 6, title: 'Dynamics of Population' },
          { id: 'c8-b2-ch7', chapterNumber: 7, title: "India's Urban Landscape" },
          { id: 'c8-b2-ch8', chapterNumber: 8, title: 'Cultural Currents: 13th to 17th Centuries' },
        ],
      },
    ],
  },

  // =========================================================================
  // CLASS 9: 2 Integrated Parts (2 Books, 15 Chapters - 29 Sep 2026 Edition)
  // =========================================================================
  {
    classNum: 9,
    className: 'Class 9',
    structureDesc: '2 Integrated Parts (2 Books)',
    books: [
      {
        id: 'c9-b1',
        title: 'Understanding Society: India and Beyond – Part 1',
        subject: 'Integrated Social Science',
        classNum: 9,
        part: 'Part 1',
        description: 'Earth dynamics, early human civilisation, state formation, democracy, and markets',
        chapters: [
          { id: 'c9-b1-ch1', chapterNumber: 1, title: 'Understanding Social Science' },
          { id: 'c9-b1-ch2', chapterNumber: 2, title: "Shaping of the Earth's Surface" },
          { id: 'c9-b1-ch3', chapterNumber: 3, title: 'Atmosphere and Climate' },
          { id: 'c9-b1-ch4', chapterNumber: 4, title: 'Early Humans and Beginning of Civilisation' },
          { id: 'c9-b1-ch5', chapterNumber: 5, title: 'State and Society up to 1000 CE' },
          { id: 'c9-b1-ch6', chapterNumber: 6, title: 'Democracy' },
          { id: 'c9-b1-ch7', chapterNumber: 7, title: 'Elections' },
          { id: 'c9-b1-ch8', chapterNumber: 8, title: 'Building Blocks in Economics: The Problem of Choice' },
          { id: 'c9-b1-ch9', chapterNumber: 9, title: 'The Price Puzzle: What Drives the Market' },
        ],
      },
      {
        id: 'c9-b2',
        title: 'Understanding Society: India and Beyond – Part 2',
        subject: 'Integrated Social Science',
        classNum: 9,
        part: 'Part 2',
        description: 'Oceans, resistance traditions (1000-1700 CE), public policy, personal finance, startups',
        chapters: [
          { id: 'c9-b2-ch1', chapterNumber: 1, title: 'Oceans and Life' },
          { id: 'c9-b2-ch2', chapterNumber: 2, title: 'Life on Earth' },
          { id: 'c9-b2-ch3', chapterNumber: 3, title: 'Resistance and Resilience (1000–1700 CE)' },
          { id: 'c9-b2-ch4', chapterNumber: 4, title: 'Governance and Public Policy' },
          { id: 'c9-b2-ch5', chapterNumber: 5, title: 'Managing Your Personal Finances' },
          { id: 'c9-b2-ch6', chapterNumber: 6, title: 'From Ideas to Startups' },
        ],
      },
    ],
  },

  // =========================================================================
  // CLASS 10: 4 Subject Books (4 Books, 22 Chapters)
  // =========================================================================
  {
    classNum: 10,
    className: 'Class 10',
    structureDesc: '4 Subject Books (4 Disciplines)',
    books: [
      {
        id: 'c10-hist',
        title: 'India and the Contemporary World – II',
        subject: 'History',
        classNum: 10,
        description: 'European and Indian nationalism, global trade, industrialisation, and print culture',
        chapters: [
          { id: 'c10-hist-ch1', chapterNumber: 1, title: 'The Rise of Nationalism in Europe' },
          { id: 'c10-hist-ch2', chapterNumber: 2, title: 'Nationalism in India' },
          { id: 'c10-hist-ch3', chapterNumber: 3, title: 'The Making of a Global World' },
          { id: 'c10-hist-ch4', chapterNumber: 4, title: 'The Age of Industrialisation' },
          { id: 'c10-hist-ch5', chapterNumber: 5, title: 'Print Culture and the Modern World' },
        ],
      },
      {
        id: 'c10-pol',
        title: 'Democratic Politics – II',
        subject: 'Political Science',
        classNum: 10,
        description: 'Power sharing mechanisms, federal structures, gender & religion, and political parties',
        chapters: [
          { id: 'c10-pol-ch1', chapterNumber: 1, title: 'Power Sharing' },
          { id: 'c10-pol-ch2', chapterNumber: 2, title: 'Federalism' },
          { id: 'c10-pol-ch3', chapterNumber: 3, title: 'Gender, Religion and Caste' },
          { id: 'c10-pol-ch4', chapterNumber: 4, title: 'Political Parties' },
          { id: 'c10-pol-ch5', chapterNumber: 5, title: 'Outcomes of Democracy' },
        ],
      },
      {
        id: 'c10-geo',
        title: 'Contemporary India – II',
        subject: 'Geography',
        classNum: 10,
        description: 'Resources, forests, wildlife, water, agriculture, minerals, and manufacturing industries',
        chapters: [
          { id: 'c10-geo-ch1', chapterNumber: 1, title: 'Resources and Development' },
          { id: 'c10-geo-ch2', chapterNumber: 2, title: 'Forest and Wildlife Resources' },
          { id: 'c10-geo-ch3', chapterNumber: 3, title: 'Water Resources' },
          { id: 'c10-geo-ch4', chapterNumber: 4, title: 'Agriculture' },
          { id: 'c10-geo-ch5', chapterNumber: 5, title: 'Minerals and Energy Resources' },
          { id: 'c10-geo-ch6', chapterNumber: 6, title: 'Manufacturing Industries' },
          { id: 'c10-geo-ch7', chapterNumber: 7, title: 'Lifelines of National Economy' },
        ],
      },
      {
        id: 'c10-eco',
        title: 'Understanding Economic Development',
        subject: 'Economics',
        classNum: 10,
        description: 'Developmental indicators, economic sectors, money, credit, globalisation, and consumer rights',
        chapters: [
          { id: 'c10-eco-ch1', chapterNumber: 1, title: 'Development' },
          { id: 'c10-eco-ch2', chapterNumber: 2, title: 'Sectors of the Indian Economy' },
          { id: 'c10-eco-ch3', chapterNumber: 3, title: 'Money and Credit' },
          { id: 'c10-eco-ch4', chapterNumber: 4, title: 'Globalisation and the Indian Economy' },
          { id: 'c10-eco-ch5', chapterNumber: 5, title: 'Consumer Rights' },
        ],
      },
    ],
  },

  // =========================================================================
  // CLASS 11: 4 Disciplines / 8 Books (67 Chapters)
  // =========================================================================
  {
    classNum: 11,
    className: 'Class 11',
    structureDesc: '4 Disciplines / 8 Books',
    books: [
      // HISTORY (1 Book, 7 Chapters)
      {
        id: 'c11-hist',
        title: 'Themes in World History',
        subject: 'History',
        classNum: 11,
        description: 'Early urban life, Roman Empire, nomadic empires, feudalism, and paths to modernisation',
        chapters: [
          { id: 'c11-hist-ch1', chapterNumber: 1, title: 'Writing and City Life' },
          { id: 'c11-hist-ch2', chapterNumber: 2, title: 'An Empire Across Three Continents' },
          { id: 'c11-hist-ch3', chapterNumber: 3, title: 'Nomadic Empires' },
          { id: 'c11-hist-ch4', chapterNumber: 4, title: 'The Three Orders' },
          { id: 'c11-hist-ch5', chapterNumber: 5, title: 'Changing Cultural Traditions' },
          { id: 'c11-hist-ch6', chapterNumber: 6, title: 'Displacing Indigenous Peoples' },
          { id: 'c11-hist-ch7', chapterNumber: 7, title: 'Paths to Modernisation' },
        ],
      },

      // POLITICAL SCIENCE (2 Books, 18 Chapters)
      {
        id: 'c11-pol-const',
        title: 'Indian Constitution at Work',
        subject: 'Political Science',
        classNum: 11,
        part: 'Book 1',
        description: 'Constitutional philosophy, fundamental rights, elections, executive, judiciary, and federalism',
        chapters: [
          { id: 'c11-pol-const-ch1', chapterNumber: 1, title: 'Constitution: Why and How?' },
          { id: 'c11-pol-const-ch2', chapterNumber: 2, title: 'Rights in the Indian Constitution' },
          { id: 'c11-pol-const-ch3', chapterNumber: 3, title: 'Election and Representation' },
          { id: 'c11-pol-const-ch4', chapterNumber: 4, title: 'Executive' },
          { id: 'c11-pol-const-ch5', chapterNumber: 5, title: 'Legislature' },
          { id: 'c11-pol-const-ch6', chapterNumber: 6, title: 'Judiciary' },
          { id: 'c11-pol-const-ch7', chapterNumber: 7, title: 'Federalism' },
          { id: 'c11-pol-const-ch8', chapterNumber: 8, title: 'Local Governments' },
          { id: 'c11-pol-const-ch9', chapterNumber: 9, title: 'Constitution as a Living Document' },
          { id: 'c11-pol-const-ch10', chapterNumber: 10, title: 'The Philosophy of the Constitution' },
        ],
      },
      {
        id: 'c11-pol-theory',
        title: 'Political Theory',
        subject: 'Political Science',
        classNum: 11,
        part: 'Book 2',
        description: 'Core theoretical foundations: freedom, equality, social justice, rights, and secularism',
        chapters: [
          { id: 'c11-pol-theory-ch1', chapterNumber: 1, title: 'Political Theory: An Introduction' },
          { id: 'c11-pol-theory-ch2', chapterNumber: 2, title: 'Freedom' },
          { id: 'c11-pol-theory-ch3', chapterNumber: 3, title: 'Equality' },
          { id: 'c11-pol-theory-ch4', chapterNumber: 4, title: 'Social Justice' },
          { id: 'c11-pol-theory-ch5', chapterNumber: 5, title: 'Rights' },
          { id: 'c11-pol-theory-ch6', chapterNumber: 6, title: 'Citizenship' },
          { id: 'c11-pol-theory-ch7', chapterNumber: 7, title: 'Nationalism' },
          { id: 'c11-pol-theory-ch8', chapterNumber: 8, title: 'Secularism' },
        ],
      },

      // GEOGRAPHY (3 Books, 26 Chapters)
      {
        id: 'c11-geo-phys',
        title: 'Fundamentals of Physical Geography',
        subject: 'Geography',
        classNum: 11,
        part: 'Book 1',
        description: 'Earth origin, geomorphic processes, climate systems, oceans, and biodiversity',
        chapters: [
          { id: 'c11-geo-phys-ch1', chapterNumber: 1, title: 'Geography as a Discipline' },
          { id: 'c11-geo-phys-ch2', chapterNumber: 2, title: 'The Origin and Evolution of the Earth' },
          { id: 'c11-geo-phys-ch3', chapterNumber: 3, title: 'Interior of the Earth' },
          { id: 'c11-geo-phys-ch4', chapterNumber: 4, title: 'Distribution of Oceans and Continents' },
          { id: 'c11-geo-phys-ch5', chapterNumber: 5, title: 'Geomorphic Processes' },
          { id: 'c11-geo-phys-ch6', chapterNumber: 6, title: 'Landforms and their Evolution' },
          { id: 'c11-geo-phys-ch7', chapterNumber: 7, title: 'Composition and Structure of Atmosphere' },
          { id: 'c11-geo-phys-ch8', chapterNumber: 8, title: 'Solar Radiation, Heat Balance and Temperature' },
          { id: 'c11-geo-phys-ch9', chapterNumber: 9, title: 'Atmospheric Circulation and Weather Systems' },
          { id: 'c11-geo-phys-ch10', chapterNumber: 10, title: 'Water in the Atmosphere' },
          { id: 'c11-geo-phys-ch11', chapterNumber: 11, title: 'World Climate and Climate Change' },
          { id: 'c11-geo-phys-ch12', chapterNumber: 12, title: 'Water (Oceans)' },
          { id: 'c11-geo-phys-ch13', chapterNumber: 13, title: 'Movements of Ocean Water' },
          { id: 'c11-geo-phys-ch14', chapterNumber: 14, title: 'Biodiversity and Conservation' },
        ],
      },
      {
        id: 'c11-geo-india',
        title: 'India: Physical Environment',
        subject: 'Geography',
        classNum: 11,
        part: 'Book 2',
        description: 'Physiography of India, river basins, monsoon mechanisms, natural vegetation, hazards',
        chapters: [
          { id: 'c11-geo-india-ch1', chapterNumber: 1, title: 'India — Location' },
          { id: 'c11-geo-india-ch2', chapterNumber: 2, title: 'Structure and Physiography' },
          { id: 'c11-geo-india-ch3', chapterNumber: 3, title: 'Drainage System' },
          { id: 'c11-geo-india-ch4', chapterNumber: 4, title: 'Climate' },
          { id: 'c11-geo-india-ch5', chapterNumber: 5, title: 'Natural Vegetation' },
          { id: 'c11-geo-india-ch6', chapterNumber: 6, title: 'Natural Hazards and Disasters' },
        ],
      },
      {
        id: 'c11-geo-prac',
        title: 'Practical Work in Geography – Part I',
        subject: 'Geography',
        classNum: 11,
        part: 'Book 3',
        description: 'Cartographic techniques, scales, projections, topographical maps, and aerial surveys',
        chapters: [
          { id: 'c11-geo-prac-ch1', chapterNumber: 1, title: 'Introduction to Maps' },
          { id: 'c11-geo-prac-ch2', chapterNumber: 2, title: 'Map Scale' },
          { id: 'c11-geo-prac-ch3', chapterNumber: 3, title: 'Latitude, Longitude and Time' },
          { id: 'c11-geo-prac-ch4', chapterNumber: 4, title: 'Map Projections' },
          { id: 'c11-geo-prac-ch5', chapterNumber: 5, title: 'Topographical Maps' },
          { id: 'c11-geo-prac-ch6', chapterNumber: 6, title: 'Introduction to Aerial Photographs and Remote Sensing' },
        ],
      },

      // ECONOMICS (2 Books, 16 Chapters)
      {
        id: 'c11-eco-stats',
        title: 'Statistics for Economics',
        subject: 'Economics',
        classNum: 11,
        part: 'Book 1',
        description: 'Collection, organisation, presentation, central tendency, dispersion, correlation, index numbers',
        chapters: [
          { id: 'c11-eco-stats-ch1', chapterNumber: 1, title: 'Introduction' },
          { id: 'c11-eco-stats-ch2', chapterNumber: 2, title: 'Collection of Data' },
          { id: 'c11-eco-stats-ch3', chapterNumber: 3, title: 'Organisation of Data' },
          { id: 'c11-eco-stats-ch4', chapterNumber: 4, title: 'Presentation of Data' },
          { id: 'c11-eco-stats-ch5', chapterNumber: 5, title: 'Measures of Central Tendency' },
          { id: 'c11-eco-stats-ch6', chapterNumber: 6, title: 'Correlation' },
          { id: 'c11-eco-stats-ch7', chapterNumber: 7, title: 'Index Numbers' },
          { id: 'c11-eco-stats-ch8', chapterNumber: 8, title: 'Use of Statistical Tools' },
        ],
      },
      {
        id: 'c11-eco-dev',
        title: 'Indian Economic Development',
        subject: 'Economics',
        classNum: 11,
        part: 'Book 2',
        description: 'Post-independence reforms, LPG appraisal, human capital, rural credit, and sustainable growth',
        chapters: [
          { id: 'c11-eco-dev-ch1', chapterNumber: 1, title: 'Indian Economy on the Eve of Independence' },
          { id: 'c11-eco-dev-ch2', chapterNumber: 2, title: 'Indian Economy (1950–1990)' },
          { id: 'c11-eco-dev-ch3', chapterNumber: 3, title: 'Liberalisation, Privatisation, and Globalisation: An Appraisal' },
          { id: 'c11-eco-dev-ch4', chapterNumber: 4, title: 'Human Capital Formation in India' },
          { id: 'c11-eco-dev-ch5', chapterNumber: 5, title: 'Rural Development' },
          { id: 'c11-eco-dev-ch6', chapterNumber: 6, title: 'Employment: Growth, Informalisation and Other Issues' },
          { id: 'c11-eco-dev-ch7', chapterNumber: 7, title: 'Environment and Sustainable Development' },
          { id: 'c11-eco-dev-ch8', chapterNumber: 8, title: 'Comparative Development Experiences of India and Its Neighbours' },
        ],
      },
    ],
  },

  // =========================================================================
  // CLASS 12: 4 Disciplines / 10 Books (59 Chapters)
  // =========================================================================
  {
    classNum: 12,
    className: 'Class 12',
    structureDesc: '4 Disciplines / 10 Books',
    books: [
      // HISTORY (3 Books, 12 Chapters)
      {
        id: 'c12-hist-p1',
        title: 'Themes in Indian History – Part I',
        subject: 'History',
        classNum: 12,
        part: 'Part I (Ancient)',
        description: 'Harappan civilisation, Mahajanapadas, early societies, Buddhism and Jainism',
        chapters: [
          { id: 'c12-hist-p1-ch1', chapterNumber: 1, title: 'Bricks, Beads and Bones: The Harappan Civilisation' },
          { id: 'c12-hist-p1-ch2', chapterNumber: 2, title: 'Kings, Farmers and Towns: Early States and Economies (c. 600 BCE–600 CE)' },
          { id: 'c12-hist-p1-ch3', chapterNumber: 3, title: 'Kinship, Caste and Class: Early Societies (c. 600 BCE–600 CE)' },
          { id: 'c12-hist-p1-ch4', chapterNumber: 4, title: 'Thinkers, Beliefs and Buildings: Cultural Developments (c. 600 BCE–600 CE)' },
        ],
      },
      {
        id: 'c12-hist-p2',
        title: 'Themes in Indian History – Part II',
        subject: 'History',
        classNum: 12,
        part: 'Part II (Medieval)',
        description: "Travel chronicles, Bhakti-Sufi traditions, Vijayanagara Empire, and Mughal agrarian economy",
        chapters: [
          { id: 'c12-hist-p2-ch1', chapterNumber: 1, title: 'Through the Eyes of Travellers: Perceptions of Society' },
          { id: 'c12-hist-p2-ch2', chapterNumber: 2, title: 'Bhakti–Sufi Traditions: Changes in Religious Beliefs and Devotional Texts' },
          { id: 'c12-hist-p2-ch3', chapterNumber: 3, title: 'An Imperial Capital: Vijayanagara' },
          { id: 'c12-hist-p2-ch4', chapterNumber: 4, title: 'Peasants, Zamindars and the State: Agrarian Society and the Mughal Empire' },
        ],
      },
      {
        id: 'c12-hist-p3',
        title: 'Themes in Indian History – Part III',
        subject: 'History',
        classNum: 12,
        part: 'Part III (Modern)',
        description: 'Colonial archives, 1857 Revolt, Mahatma Gandhi and Nationalist movement, framing Constitution',
        chapters: [
          { id: 'c12-hist-p3-ch1', chapterNumber: 1, title: 'Colonialism and the Countryside: Exploring Official Archives' },
          { id: 'c12-hist-p3-ch2', chapterNumber: 2, title: 'Rebels and the Raj: The Revolt of 1857 and Its Representations' },
          { id: 'c12-hist-p3-ch3', chapterNumber: 3, title: 'Mahatma Gandhi and the Nationalist Movement: Civil Disobedience and Beyond' },
          { id: 'c12-hist-p3-ch4', chapterNumber: 4, title: 'Framing the Constitution: The Beginning of a New Era' },
        ],
      },

      // POLITICAL SCIENCE (2 Books, 15 Chapters)
      {
        id: 'c12-pol-world',
        title: 'Contemporary World Politics',
        subject: 'Political Science',
        classNum: 12,
        part: 'Book 1',
        description: 'End of bipolarity, alternative centres of power, South Asia, UN, global security, environment',
        chapters: [
          { id: 'c12-pol-world-ch1', chapterNumber: 1, title: 'The End of Bipolarity' },
          { id: 'c12-pol-world-ch2', chapterNumber: 2, title: 'Contemporary Centres of Power' },
          { id: 'c12-pol-world-ch3', chapterNumber: 3, title: 'Contemporary South Asia' },
          { id: 'c12-pol-world-ch4', chapterNumber: 4, title: 'International Organisations' },
          { id: 'c12-pol-world-ch5', chapterNumber: 5, title: 'Security in the Contemporary World' },
          { id: 'c12-pol-world-ch6', chapterNumber: 6, title: 'Environment and Natural Resources' },
          { id: 'c12-pol-world-ch7', chapterNumber: 7, title: 'Globalisation' },
        ],
      },
      {
        id: 'c12-pol-india',
        title: 'Politics in India Since Independence',
        subject: 'Political Science',
        classNum: 12,
        part: 'Book 2',
        description: 'Nation building, one-party dominance, external relations, Emergency, regional aspirations',
        chapters: [
          { id: 'c12-pol-india-ch1', chapterNumber: 1, title: 'Challenges of Nation Building' },
          { id: 'c12-pol-india-ch2', chapterNumber: 2, title: 'Era of One-Party Dominance' },
          { id: 'c12-pol-india-ch3', chapterNumber: 3, title: 'Politics of Planned Development' },
          { id: 'c12-pol-india-ch4', chapterNumber: 4, title: "India's External Relations" },
          { id: 'c12-pol-india-ch5', chapterNumber: 5, title: 'Challenges to and Restoration of the Congress System' },
          { id: 'c12-pol-india-ch6', chapterNumber: 6, title: 'The Crisis of Democratic Order' },
          { id: 'c12-pol-india-ch7', chapterNumber: 7, title: 'Regional Aspirations' },
          { id: 'c12-pol-india-ch8', chapterNumber: 8, title: 'Recent Developments in Indian Politics' },
        ],
      },

      // GEOGRAPHY (3 Books, 21 Chapters)
      {
        id: 'c12-geo-human',
        title: 'Fundamentals of Human Geography',
        subject: 'Geography',
        classNum: 12,
        part: 'Book 1',
        description: 'World population dynamics, human development, primary/secondary/tertiary sectors, trade',
        chapters: [
          { id: 'c12-geo-human-ch1', chapterNumber: 1, title: 'Human Geography: Nature and Scope' },
          { id: 'c12-geo-human-ch2', chapterNumber: 2, title: 'The World Population: Distribution, Density and Growth' },
          { id: 'c12-geo-human-ch3', chapterNumber: 3, title: 'Human Development' },
          { id: 'c12-geo-human-ch4', chapterNumber: 4, title: 'Primary Activities' },
          { id: 'c12-geo-human-ch5', chapterNumber: 5, title: 'Secondary Activities' },
          { id: 'c12-geo-human-ch6', chapterNumber: 6, title: 'Tertiary and Quaternary Activities' },
          { id: 'c12-geo-human-ch7', chapterNumber: 7, title: 'Transport and Communication' },
          { id: 'c12-geo-human-ch8', chapterNumber: 8, title: 'International Trade' },
        ],
      },
      {
        id: 'c12-geo-india',
        title: 'India: People and Economy',
        subject: 'Geography',
        classNum: 12,
        part: 'Book 2',
        description: 'Indian population distribution, settlement patterns, land, water, minerals, planning',
        chapters: [
          { id: 'c12-geo-india-ch1', chapterNumber: 1, title: 'Population: Distribution, Density, Growth and Composition' },
          { id: 'c12-geo-india-ch2', chapterNumber: 2, title: 'Human Settlements' },
          { id: 'c12-geo-india-ch3', chapterNumber: 3, title: 'Land Resources and Agriculture' },
          { id: 'c12-geo-india-ch4', chapterNumber: 4, title: 'Water Resources' },
          { id: 'c12-geo-india-ch5', chapterNumber: 5, title: 'Mineral and Energy Resources' },
          { id: 'c12-geo-india-ch6', chapterNumber: 6, title: 'Planning and Sustainable Development in Indian Context' },
          { id: 'c12-geo-india-ch7', chapterNumber: 7, title: 'Transport and Communication' },
          { id: 'c12-geo-india-ch8', chapterNumber: 8, title: 'International Trade' },
          { id: 'c12-geo-india-ch9', chapterNumber: 9, title: 'Geographical Perspective on Selected Issues and Problems' },
        ],
      },
      {
        id: 'c12-geo-prac',
        title: 'Practical Work in Geography – Part II',
        subject: 'Geography',
        classNum: 12,
        part: 'Book 3',
        description: 'Data sources, processing techniques, graphical cartography, spatial information technology',
        chapters: [
          { id: 'c12-geo-prac-ch1', chapterNumber: 1, title: 'Data — Its Source and Compilation' },
          { id: 'c12-geo-prac-ch2', chapterNumber: 2, title: 'Data Processing' },
          { id: 'c12-geo-prac-ch3', chapterNumber: 3, title: 'Graphical Representation of Data' },
          { id: 'c12-geo-prac-ch4', chapterNumber: 4, title: 'Spatial Information Technology' },
        ],
      },

      // ECONOMICS (2 Books, 11 Chapters)
      {
        id: 'c12-eco-micro',
        title: 'Introductory Microeconomics',
        subject: 'Economics',
        classNum: 12,
        part: 'Book 1',
        description: 'Consumer choice, utility, demand, production functions, cost curves, market equilibrium',
        chapters: [
          { id: 'c12-eco-micro-ch1', chapterNumber: 1, title: 'Introduction to Microeconomics' },
          { id: 'c12-eco-micro-ch2', chapterNumber: 2, title: 'Theory of Consumer Behaviour' },
          { id: 'c12-eco-micro-ch3', chapterNumber: 3, title: 'Production and Costs' },
          { id: 'c12-eco-micro-ch4', chapterNumber: 4, title: 'The Theory of the Firm Under Perfect Competition' },
          { id: 'c12-eco-micro-ch5', chapterNumber: 5, title: 'Market Equilibrium' },
        ],
      },
      {
        id: 'c12-eco-macro',
        title: 'Introductory Macroeconomics',
        subject: 'Economics',
        classNum: 12,
        part: 'Book 2',
        description: 'National income accounting, monetary system, multiplier, fiscal budget, foreign exchange',
        chapters: [
          { id: 'c12-eco-macro-ch1', chapterNumber: 1, title: 'Introduction to Macroeconomics' },
          { id: 'c12-eco-macro-ch2', chapterNumber: 2, title: 'National Income Accounting' },
          { id: 'c12-eco-macro-ch3', chapterNumber: 3, title: 'Money and Banking' },
          { id: 'c12-eco-macro-ch4', chapterNumber: 4, title: 'Determination of Income and Employment' },
          { id: 'c12-eco-macro-ch5', chapterNumber: 5, title: 'Government Budget and the Economy' },
          { id: 'c12-eco-macro-ch6', chapterNumber: 6, title: 'Open Economy Macroeconomics' },
        ],
      },
    ],
  },
];

// Utility: Flattened list of all 212 chapters with book & class metadata
export interface NcertFlatChapter extends NcertChapter {
  bookId: string;
  bookTitle: string;
  subject: string;
  classNum: number;
  className: string;
}

export const ALL_NCERT_CHAPTERS: NcertFlatChapter[] = NCERT_CLASSES_DATA.flatMap((c) =>
  c.books.flatMap((b) =>
    b.chapters.map((ch) => ({
      ...ch,
      bookId: b.id,
      bookTitle: b.title,
      subject: b.subject,
      classNum: c.classNum,
      className: c.className,
    }))
  )
);

export const TOTAL_NCERT_BOOKS = NCERT_CLASSES_DATA.reduce(
  (acc, c) => acc + c.books.length,
  0
); // 29

export const TOTAL_NCERT_CHAPTERS = ALL_NCERT_CHAPTERS.length; // 212
export const TOTAL_NCERT_TASKS = TOTAL_NCERT_CHAPTERS * 3; // 636

// Storage operations
export function migrateNcertProgressStore(store: Record<string, any>): NcertProgressStore {
  const migrated: NcertProgressStore = {};
  if (!store || typeof store !== 'object') return migrated;

  for (const [chId, prog] of Object.entries(validateNcertProgress(store))) {
    if (!prog || typeof prog !== 'object') continue;
    const history: RevisionEvent[] = Array.isArray(prog.revisionHistory)
      ? [...prog.revisionHistory]
      : [];

    // Non-destructive migration: if legacy progress had revision: true but no history entries, migrate safely
    if (prog.revision && history.length === 0) {
      history.push({
        id: `rev-legacy-${chId}`,
        completedAt: prog.revisionAt || '',
        legacy: true,
        notes: 'Previously marked complete',
      });
    }

    const hasRevision = history.length > 0 || !!prog.revision;
    const latestRevision = history[history.length - 1];
    const latestTimestamp = latestRevision?.completedAt || prog.revisionAt;

    migrated[chId] = {
      reading: !!prog.reading,
      readingAt: prog.readingAt,
      notes: !!prog.notes,
      notesAt: prog.notesAt,
      revision: hasRevision,
      revisionAt: latestTimestamp,
      revisionHistory: history,
    };
  }
  return migrated;
}

export function loadNcertProgress(): NcertProgressStore {
  return readStored([NCERT_STORAGE_KEY, 'ncertSocialScienceProgress_v2', 'ncertSocialScienceProgress_v1', 'ncertSocialScienceProgress'], value => migrateNcertProgressStore(validateNcertProgress(value)), {});
}
export function saveNcertProgress(store: NcertProgressStore): void { writeStored(NCERT_STORAGE_KEY, store); }
export function loadNcertNotes(): NcertNotesStore {
  return readStored([NCERT_NOTES_STORAGE_KEY, 'ncertChapterNotes'], validateNcertNotes, {});
}
export function saveNcertNotes(store: NcertNotesStore): void { writeStored(NCERT_NOTES_STORAGE_KEY, store); }

export function hasChapterNotes(note?: ChapterNoteData): { hasText: boolean; hasLink: boolean } {
  if (!note) return { hasText: false, hasLink: false };
  const hasText = !!(note.text && note.text.trim().length > 0);
  const hasLink = !!(
    (note.primaryLink && note.primaryLink.trim().length > 0) ||
    (note.resources && note.resources.length > 0)
  );
  return { hasText, hasLink };
}

// Helpers to compute statistics & revision information
export function getChapterRevisionCount(progress?: NcertChapterProgress): number {
  if (!progress) return 0;
  if (Array.isArray(progress.revisionHistory)) {
    return progress.revisionHistory.length;
  }
  return progress.revision ? 1 : 0;
}

export function getLastRevisedDisplay(progress?: NcertChapterProgress): { label: string; isLegacy?: boolean } | null {
  if (!progress) return null;
  const history = progress.revisionHistory;
  if (history && history.length > 0) {
    const latest = history[history.length - 1];
    if (latest.legacy && !latest.completedAt) {
      return { label: 'Previously marked complete', isLegacy: true };
    }
    if (latest.completedAt) {
      try {
        const d = new Date(latest.completedAt);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) return { label: 'Today' };
        return {
          label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
        };
      } catch {
        return { label: latest.completedAt };
      }
    }
  }

  if (progress.revision) {
    if (progress.revisionAt) {
      try {
        const d = new Date(progress.revisionAt);
        return {
          label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
        };
      } catch {
        return { label: progress.revisionAt };
      }
    }
    return { label: 'Previously marked complete', isLegacy: true };
  }

  return null;
}

// P1.4 Progress calculation rules:
// Reading only = 33%
// Reading + Notes = 67%
// Reading + Notes + at least 1 Revision = 100%
// Additional revision events do NOT make progress exceed 100%.
export function getChapterProgressPercent(progress?: NcertChapterProgress): number {
  if (!progress) return 0;
  const hasReading = !!progress.reading;
  const hasNotes = !!progress.notes;
  const revCount = getChapterRevisionCount(progress);
  const hasRevision = revCount > 0;

  let stages = 0;
  if (hasReading) stages++;
  if (hasNotes) stages++;
  if (hasRevision) stages++;

  if (stages === 3) return 100;
  if (stages === 2) return 67;
  if (stages === 1) return 33;
  return 0;
}

export function isChapterComplete(progress?: NcertChapterProgress): boolean {
  if (!progress) return false;
  const revCount = getChapterRevisionCount(progress);
  return !!(progress.reading && progress.notes && revCount > 0);
}

export function isBookComplete(book: NcertBook, store: NcertProgressStore): boolean {
  if (book.chapters.length === 0) return false;
  return book.chapters.every((ch) => isChapterComplete(store[ch.id]));
}

export function getAllFlatChapters(): NcertFlatChapter[] {
  // Chapter metadata is static. Give callers their own array without rebuilding every chapter.
  return ALL_NCERT_CHAPTERS.slice();
}
