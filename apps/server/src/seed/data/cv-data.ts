export const cvProfile = {
    fullName: 'IGNA-IGBOKO HECTOR',
    phone: '+234-916-040-9456',
    linkedinUrl: 'linkedin.com/in/hector-ignatius',
    githubUrl: 'github.com/higna',
    portfolioUrl: 'higna.vercel.app',
    professionalSummary:
        'Full‑Stack Developer & Data Engineer with a passion for automation, AI integration, and clean architecture. ' +
        'I build production‑ready web applications, design scalable data pipelines, and turn complex workflows into simple, interactive tools. ' +
        'Experienced in Python, JavaScript/TypeScript, React, NestJS, PostgreSQL, cloud services, and AI APIs.',
    languages: ['English (Fluent)', 'Igbo (Fluent)'],
};

export const cvExperiences = [
    {
        jobTitle: 'Application Developer',
        company: 'Virology & Molecular Diagnostics Unit, IITA',
        description: [
            'Data Collection – Developed ODK‑enabled data collection tools.',
            'Data Pipeline & Automation – Develop ETL scripts (Python, Pandas, Playwright) to automatically download, clean, and merge data.',
            'Software Development – Build web apps (React, Node.js, WordPress) for teams across West Africa.',
            'Dashboards & Reporting – Design interactive dashboards (Power BI, Looker Studio) for real‑time tracking of production and registrations.',
            'Platform Administration – Manage the Seed Tracker platform, user accounts, permissions, and system troubleshooting.',
            'Training & Capacity Building – Lead workshops in Ghana, Sierra Leone, and Nigeria on data management and Seed Tracker usage.',
        ],
        startDate: '2022-11-01',
        endDate: null,
        isCurrent: true,
        order: 1,
    },
    {
        jobTitle: 'Public and Press Relations (NYSC)',
        company: 'Freedom of Information Acts, (OBS)',
        description: ['Captured high‑quality images and assisted with public relations campaigns.'],
        startDate: '2023-01-01',
        endDate: '2023-11-30',
        isCurrent: false,
        order: 2,
    },
    {
        jobTitle: 'Photographer & Graphics Designer',
        company: 'Stoney Photography',
        description: ['Conducted photography sessions and created visual content for social media and print.'],
        startDate: '2021-07-01',
        endDate: '2022-07-31',
        isCurrent: false,
        order: 3,
    },
    {
        jobTitle: 'IT Professional & Data Analyst',
        company: 'Angelic Unique Waters',
        description: [
            'Performed data analysis using Excel and built/maintained the company website.',
            'Provided customer support, ensuring smooth daily operations.',
        ],
        startDate: '2019-11-01',
        endDate: '2021-06-30',
        isCurrent: false,
        order: 4,
    },
    {
        jobTitle: 'Intern',
        company: 'YIIFSWA (IITA)',
        description: ['Managed data using SQL and developed web applications to support research.'],
        startDate: '2019-07-01',
        endDate: '2019-10-31',
        isCurrent: false,
        order: 5,
    },
];

export const cvEducations = [
    {
        degree: 'M.Sc. in Artificial Intelligence (In‑progress)',
        institution: 'University of Ibadan, Nigeria',
        startDate: '2023-01-01',
        endDate: null,
        grade: 'Specializing in Machine Learning and AI Techniques',
        order: 1,
    },
    {
        degree: 'B.Sc. in Computer Science',
        institution: 'Dominican University, Ibadan, Nigeria',
        startDate: '2017-01-01',
        endDate: '2021-12-31',
        grade: 'Awarded Best Programmer of the 2020/2021 academic session',
        order: 2,
    },
    {
        degree: 'National Diploma in Computer Science',
        institution: 'Federal School of Statistics, Ibadan, Nigeria',
        startDate: '2016-01-01',
        endDate: '2017-12-31',
        grade: null,
        order: 3,
    },
];

export const cvSkills = [
    // LANGUAGES
    { name: 'Python', category: 'LANGUAGES', proficiency: 5 },
    { name: 'JavaScript', category: 'LANGUAGES', proficiency: 5 },
    { name: 'TypeScript', category: 'LANGUAGES', proficiency: 5 },
    { name: 'Java', category: 'LANGUAGES', proficiency: 3 },
    { name: 'R', category: 'LANGUAGES', proficiency: 4 },
    { name: 'SQL', category: 'LANGUAGES', proficiency: 5 },
    { name: 'HTML', category: 'LANGUAGES', proficiency: 5 },
    { name: 'CSS', category: 'LANGUAGES', proficiency: 5 },

    // FRAMEWORKS
    { name: 'React', category: 'FRAMEWORKS', proficiency: 5 },
    { name: 'Next.js', category: 'FRAMEWORKS', proficiency: 4 },
    { name: 'NestJS', category: 'FRAMEWORKS', proficiency: 5 },
    { name: 'Node.js', category: 'FRAMEWORKS', proficiency: 5 },
    { name: 'TypeORM', category: 'FRAMEWORKS', proficiency: 4 },
    { name: 'Tailwind CSS', category: 'FRAMEWORKS', proficiency: 5 },
    { name: 'DaisyUI', category: 'FRAMEWORKS', proficiency: 5 },
    { name: 'Framer Motion', category: 'FRAMEWORKS', proficiency: 4 },

    // DATA & AI
    { name: 'Pandas', category: 'DATA_AND_AI', proficiency: 5 },
    { name: 'Data Analysis', category: 'DATA_AND_AI', proficiency: 5 },
    { name: 'Data Visualization', category: 'DATA_AND_AI', proficiency: 5 },
    { name: 'Machine Learning', category: 'DATA_AND_AI', proficiency: 4 },
    { name: 'Gemini API', category: 'DATA_AND_AI', proficiency: 4 },

    // CLOUD & DEVOPS
    { name: 'Supabase', category: 'CLOUD_AND_DEVOPS', proficiency: 5 },
    { name: 'PostgreSQL', category: 'CLOUD_AND_DEVOPS', proficiency: 5 },
    { name: 'Cloudinary', category: 'CLOUD_AND_DEVOPS', proficiency: 4 },
    { name: 'Brevo', category: 'CLOUD_AND_DEVOPS', proficiency: 4 },
    { name: 'Docker', category: 'CLOUD_AND_DEVOPS', proficiency: 3 },
    { name: 'Git & GitHub', category: 'CLOUD_AND_DEVOPS', proficiency: 5 },

    // AUTOMATION
    { name: 'Playwright', category: 'AUTOMATION', proficiency: 4 },
    { name: 'Selenium', category: 'AUTOMATION', proficiency: 4 },
    { name: 'BeautifulSoup', category: 'AUTOMATION', proficiency: 4 },

    // DATA COLLECTION
    { name: 'ODK', category: 'DATA_COLLECTION', proficiency: 5 },
    { name: 'Power BI', category: 'DATA_COLLECTION', proficiency: 4 },
    { name: 'Looker Studio', category: 'DATA_COLLECTION', proficiency: 5 },

    // DESIGN & CMS
    { name: 'WordPress', category: 'DESIGN_AND_CMS', proficiency: 4 },
    { name: 'Canva', category: 'DESIGN_AND_CMS', proficiency: 5 },
    { name: 'Figma', category: 'DESIGN_AND_CMS', proficiency: 3 },
];

export const cvProjects = [
    {
        title: 'Portfolio Command Center',
        slug: 'portfolio-command-center',
        description:
            'A full‑stack dynamic portfolio with role‑based dashboards, AI chatbot, email verification, Google OAuth, ' +
            'and a Python‑powered data pipeline. Built with React, NestJS, PostgreSQL, Tailwind, Cloudinary, and Brevo.',
        techStack: ['React', 'TypeScript', 'NestJS', 'PostgreSQL', 'Tailwind CSS', 'DaisyUI', 'Cloudinary', 'Brevo', 'Docker'],
        liveUrl: 'https://higna.vercel.app',
        githubUrl: 'https://github.com/higna/portfolio',
        imageUrl: null,
        isFeatured: true,
        order: 1,
    },
    {
        title: 'Cocoa Seed Tracker',
        slug: 'cocoa-seed-tracker',
        description:
            'Build and Manage the Cocoa Seed Tracker site, developed data collection tools, analyzed and visualized data.',
        techStack: ['ReactJS', 'Power BI', 'Google Data Studio', 'WordPress', 'Python'],
        liveUrl: 'https://seedtracker.org/cocoa',
        githubUrl: null,
        imageUrl: null,
        isFeatured: true,
        order: 2,
    },
    {
        title: 'Data Pipeline',
        slug: 'data-pipeline',
        description:
            'Python‑based ETL pipeline that downloads form data from ONA API, cleans and merges CSVs, and uploads to Google Sheets. ' +
            'Features a Superadmin dashboard to select forms and run extractions.',
        techStack: ['Python', 'Pandas', 'Google Sheets API', 'ONA API', 'NestJS'],
        liveUrl: null,
        githubUrl: 'https://github.com/higna/seed-tracker-etl',
        imageUrl: null,
        isFeatured: true,
        order: 3,
    },
    {
        title: 'AI Co‑Pilot Chatbot',
        slug: 'ai-co-pilot',
        description:
            'Chat interface powered by Gemini that answers questions about my resume, generates tailored CVs, and serves as a site‑wide assistant.',
        techStack: ['React', 'TypeScript', 'Gemini API', 'WebSocket'],
        liveUrl: null,
        githubUrl: 'https://github.com/higna/portfolio',
        imageUrl: null,
        isFeatured: false,
        order: 4,
    },
    {
        title: 'BBTV Alliance',
        slug: 'bbtv-alliance',
        description: 'Designed and maintained the project website for the BBTV alliance.',
        techStack: ['WordPress'],
        liveUrl: 'https://bbtvalliance.org',
        githubUrl: null,
        imageUrl: null,
        isFeatured: false,
        order: 5,
    },
    {
        title: 'OGFIMS',
        slug: 'ogfims-dashboard',
        description: 'Designed an interactive dashboard for project data visualization.',
        techStack: ['Google Data Studio', 'Python'],
        liveUrl: null,
        githubUrl: null,
        imageUrl: null,
        isFeatured: false,
        order: 6,
    },
    {
        title: 'Web Scraper (Selenium)',
        slug: 'web-scraper',
        description: 'Built a Python‑based web scraper tool using Selenium to automate data entry.',
        techStack: ['Python', 'Selenium'],
        liveUrl: null,
        githubUrl: 'https://github.com/higna/web-scraper',
        imageUrl: null,
        isFeatured: false,
        order: 7,
    },
    {
        title: 'Recyclick Initiative',
        slug: 'recyclick-initiative',
        description:
            'Developed and maintained a ReactJS‑based site for a climate change, resource recycling initiative.',
        techStack: ['ReactJS', 'JavaScript'],
        liveUrl: 'https://recyclickafrica.org',
        githubUrl: null,
        imageUrl: null,
        isFeatured: false,
        order: 8,
    },
    {
        title: 'E‑Voting System',
        slug: 'e-voting-system',
        description: 'Designed a mobile voting app for my undergraduate project using Java and Firebase.',
        techStack: ['Java', 'Firebase'],
        liveUrl: null,
        githubUrl: null,
        imageUrl: null,
        isFeatured: false,
        order: 9,
    },
    {
        title: 'YHE Foundation',
        slug: 'yhe-foundation',
        description: 'Developed and managed the YHE Foundation website.',
        techStack: ['WordPress'],
        liveUrl: 'https://yhefoundation.org',
        githubUrl: null,
        imageUrl: null,
        isFeatured: false,
        order: 10,
    },
];

export const cvCertifications = [
    {
        name: 'Python for Data Science, AI & Development',
        issuer: 'IBM',
        date: '2024-09-01',
        order: 1,
    },
    {
        name: 'Introduction to Statistical Analysis & Machine Learning using R',
        issuer: 'IITA',
        date: '2024-04-01',
        order: 2,
    },
    {
        name: 'Essentials of Data Visualization using MS Excel',
        issuer: 'Acacia University',
        date: '2024-02-01',
        order: 3,
    },
    {
        name: 'Technical Support Fundamentals',
        issuer: 'Google',
        date: '2023-12-01',
        order: 4,
    },
    {
        name: 'IT Security: Defense Against Digital Threats',
        issuer: 'Google',
        date: '2023-11-01',
        order: 5,
    },
    {
        name: 'Basics of Digital Marketing',
        issuer: 'UniAthena',
        date: '2023-11-01',
        order: 6,
    },
    {
        name: 'Use of Seed Tracker',
        issuer: 'CGIAR',
        date: '2023-09-01',
        order: 7,
    },
];