export interface Project {
  id: string;
  number: string;
  category: string;
  title: string;
  description: string;
  tech: string[];
  github: string;
  mockType: 'erp' | 'ai' | 'lms';
}

export interface JourneyItem {
  year: string;
  title: string;
  organization: string;
  location: string;
  detail: string;
}

export interface Stat {
  label: string;
  value: number;
  suffix: string;
  decimals: number;
}

export interface AwardStat {
  platform: string;
  count: string;
  suffix: string;
  label: string;
}

export interface Certification {
  title: string;
  issuer: string;
  year: string;
  id: string;
}

export const PORTFOLIO_DATA = {
  name: {
    first: 'ANTIMA',
    full: 'ANTIMA',
  },
  role: {
    line1: 'FULL-STACK',
    line2: 'DEVELOPER & DEVOPS.',
  },
  tagline: 'Architecting resilient enterprise software, AI voice engines, and automated cloud systems from Jaipur to the world.',
  manifesto: [
    { text: 'I build systems where ', highlight: false },
    { text: 'PERFORMANCE', highlight: true },
    { text: ' meets flawless human interaction. From enterprise ERP engines to ', highlight: false },
    { text: 'AUTONOMOUS AI VOICE AGENTS', highlight: true },
    { text: ', I write clean code that scales effortlessly in ', highlight: false },
    { text: 'PRODUCTION.', highlight: true },
  ],
  stats: [
    { label: 'ACADEMIC SCORE', value: 72, suffix: '%', decimals: 0 },
    { label: 'PROBLEMS SOLVED', value: 480, suffix: '+', decimals: 0 },
    { label: 'PRODUCTION APPS', value: 18, suffix: '+', decimals: 0 },
  ] as Stat[],
  projects: [
    {
      id: 'solar-erp',
      number: '01 / 03',
      category: 'ENTERPRISE ERP & AUTOMATION',
      title: 'SOLAR ERP & SUNCITY',
      description: 'End-to-end solar business management system with automated workflows, WhatsApp updates, and analytics.',
      tech: ['React.js', 'Node.js', 'WhatsApp API', 'MySQL'],
      github: 'https://github.com/antima',
      mockType: 'erp',
    },
    {
      id: 'ai-caller',
      number: '02 / 03',
      category: 'GENERATIVE AI & VOICE PIPELINES',
      title: 'AI CALLER SYSTEM',
      description: 'Autonomous voice agent leveraging ElevenLabs APIs for voice synthesis and real-time automated phone workflows.',
      tech: ['ElevenLabs', 'Node.js', 'TypeScript', 'Webhooks'],
      github: 'https://github.com/antima',
      mockType: 'ai',
    },
    {
      id: 'lms-collab',
      number: '03 / 03',
      category: 'COLLABORATIVE PLATFORM',
      title: 'LMS & VIRTUAL SUITE',
      description: 'Real-time learning ecosystem featuring live class administration, interactive whiteboards, and role access.',
      tech: ['React.js', 'Socket.IO', 'MongoDB', 'Tailwind'],
      github: 'https://github.com/antima',
      mockType: 'lms',
    },
  ] as Project[],
  journey: [
    {
      year: '2024 — PRESENT',
      title: 'FULL STACK & DEVOPS ENGINEER',
      organization: 'CodeCafe IT Solutions',
      location: 'Jaipur, India',
      detail: 'Architecting ERP systems, ElevenLabs AI callers, WhatsApp Meta APIs, and Linux VPS cloud deployments.',
    },
    {
      year: '2023 — 2024',
      title: 'FULL STACK DEVELOPER',
      organization: 'Webkalakaar Pvt Ltd',
      location: 'Jaipur, India',
      detail: 'Built LMS platforms, real-time Socket.IO collaboration tools, and scalable REST APIs with React and Node.',
    },
    {
      year: '2021 — 2024',
      title: 'BACHELOR OF COMPUTER APPLICATIONS',
      organization: 'University Maharani College',
      location: 'Jaipur, India',
      detail: 'Graduated with 72.3% distinction. Focused on data structures, algorithms, databases, and system design.',
    },
  ] as JourneyItem[],
  journeyYears: {
    start: 2021,
    end: 2024,
  },
  skills: [
    'TypeScript',
    'React.js',
    'Node.js',
    'Next.js',
    'Express.js',
    'ElevenLabs',
    'Docker',
    'MongoDB',
    'Linux / VPS',
    'Nginx',
    'MySQL',
    'WhatsApp API',
    'n8n Workflows',
    'Socket.IO',
    'Redux',
    'CI/CD Pipelines',
  ],
  awardStats: [
    { platform: 'CODECAFE', count: '100', suffix: '%', label: 'PRODUCTION DELIVERY' },
    { platform: 'ELEVENLABS', count: '12', suffix: '+', label: 'AI VOICE PIPELINES' },
    { platform: 'SOLVED', count: '480', suffix: '+', label: 'ALGORITHMIC CHALLENGES' },
    { platform: 'UPTIME', count: '99.9', suffix: '%', label: 'SYSTEM RELIABILITY' },
  ] as AwardStat[],
  certifications: [
    { title: 'FULL STACK ARCHITECTURE', issuer: 'CODECAFE IT SOLUTIONS', year: '2024', id: 'CC-0941' },
    { title: 'META CLOUD & WHATSAPP API', issuer: 'META DEVELOPERS', year: '2024', id: 'MT-8821' },
    { title: 'BACHELOR OF COMP. APPS', issuer: 'MAHARANI COLLEGE, JAIPUR', year: '2024', id: 'BCA-723' },
    { title: 'AI VOICE PIPELINES', issuer: 'ELEVENLABS APIS', year: '2024', id: 'EL-3390' },
    { title: 'LINUX VPS & NGINX DEVOPS', issuer: 'UBUNTU SYSTEMS', year: '2023', id: 'LX-4102' },
    { title: 'ADVANCED TYPESCRIPT & REACT', issuer: 'MODERN WEB DEV', year: '2023', id: 'TS-7714' },
  ] as Certification[],
  contact: {
    emailUser: 'antima142005',
    emailDomain: '@gmail.com',
    fullEmail: 'antima142005@gmail.com',
    github: 'https://github.com/antima',
    linkedin: 'https://linkedin.com/in/antima',
    resumeUrl: './resume.pdf',
    copyrightYear: 2026,
  },
};

