# 🎯 Summer 2026 Internship Scraper

A Next.js application that scrapes and filters Summer 2026 tech internships from the SimplifyJobs GitHub repository, with intelligent resume matching and location filtering.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## ✨ Features

- 🔍 **Live Data Fetching**: Pulls directly from SimplifyJobs' daily-updated `listings.json`
- 🌍 **Smart Location Filtering**: Auto-filters for US, Europe, Argentina, and Remote positions
- 🎯 **Resume Matching Algorithm**: Scores each job based on your customizable resume keywords
- 🏷️ **Job Type Filters**: Filter by Software Engineering, Quant/Trading, or Product Management roles
- 🔄 **Real-time Search**: Instant search by company, title, or location
- 📊 **Match Score Slider**: Filter jobs by minimum match percentage
- 📈 **Stats Dashboard**: Visual overview of total jobs, matches, and filters
- 🎨 **Modern UI**: Gradient backgrounds, shadow cards, and responsive design with Tailwind CSS

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone or download this project
cd internship-scraper

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` 🎉

---

## ⚙️ Customization

### 1. **Update Resume Keywords**

Edit `app/page.tsx` at line 29 to add your actual skills:

```typescript
const RESUME_KEYWORDS = [
  'react', 'typescript', 'python', 'java', // Add your skills here
  'machine learning', 'aws', 'docker',
  'full stack', 'backend', 'frontend'
];
```

The matching algorithm will score jobs higher if they mention more of your keywords.

### 2. **Adjust Location Filters**

Modify the `shouldIncludeJob()` function in `app/page.tsx` (lines 77-108) to customize location preferences:

```typescript
const usKeywords = [
  'california', 'texas', 'new york', // Add/remove states
  'san francisco', 'austin', 'boston' // Add/remove cities
];
```

### 3. **Customize Job Type Filters**

Edit the `matchesJobType()` function (lines 42-74) to refine what counts as SWE, Quant, or PM roles.

---

## 📂 Project Structure

```
internship-scraper/
├── app/
│   ├── page.tsx          # Main component (400+ lines)
│   ├── layout.tsx        # Root layout with metadata
│   └── globals.css       # Tailwind CSS styles
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── next.config.js        # Next.js configuration
└── README.md             # This file
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14.2** | React framework with App Router |
| **TypeScript** | Type-safe JavaScript |
| **React 18** | UI components and hooks |
| **Tailwind CSS** | Utility-first styling |
| **Lucide React** | Icon library |

---

## 📊 How It Works

### Data Flow

1. **Fetch**: Pulls JSON from SimplifyJobs GitHub (updated daily by Pitt CS Club & Simplify)
2. **Filter**:
   - Active jobs only (`job.active === true`)
   - Location matches (US/Europe/Argentina/Remote)
   - Job type matches (SWE/Quant/PM based on dropdown)
3. **Score**: Calculates match percentage based on your resume keywords
4. **Sort**: Orders by match score (highest first)
5. **Display**: Shows filtered results with color-coded match scores

### Match Score Algorithm

```typescript
const calculateMatchScore = (job: Job): number => {
  const jobText = `${job.title} ${job.company_name}`.toLowerCase();
  let matches = 0;

  RESUME_KEYWORDS.forEach(keyword => {
    if (jobText.includes(keyword.toLowerCase())) {
      matches++;
    }
  });

  return Math.min(100, Math.round((matches / RESUME_KEYWORDS.length) * 100 * 2));
};
```

**Match Score Color Coding:**
- 🟢 **Green (70%+)**: High match - prioritize these
- 🟡 **Yellow (40-69%)**: Medium match - review carefully
- ⚪ **Gray (<40%)**: Low match - may not align with your skills

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Click "Deploy"

Vercel will automatically:
- Build your Next.js app
- Deploy to a global CDN
- Give you a `.vercel.app` URL
- Auto-deploy on every git push

### Optional: Add Auto-Refresh Cron Job

Add a Vercel cron job to refresh data every hour:

1. Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "0 * * * *"
  }]
}
```

2. Create `app/api/cron/route.ts` (ISR revalidation endpoint)

---

## 📝 Data Source

This project pulls from:

**SimplifyJobs Summer 2026 Internships**
`https://github.com/SimplifyJobs/Summer2026-Internships`

- Updated daily by Pitt Computer Science Club and Simplify
- JSON endpoint: `https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json`

**⚠️ Note:** This project does **not** scrape company websites directly. It uses SimplifyJobs' pre-aggregated, community-maintained dataset.

---

## 🤝 Contributing

Want to improve the scraper? Here are some ideas:

- [ ] Add email notifications for new high-match jobs
- [ ] Create a "Save for Later" feature (localStorage)
- [ ] Add dark mode toggle
- [ ] Export filtered results to CSV
- [ ] Add company logo fetching (Clearbit API)
- [ ] Implement user authentication for saved preferences

---

## 📄 License

MIT License - feel free to use for personal projects!

---

## 🙏 Acknowledgments

- **SimplifyJobs** for maintaining the Summer 2026 Internships list
- **Pitt Computer Science Club** for daily updates
- **Simplify** for automating application processes

---

## 📧 Contact

Built by Alejo Cagliolo

**Questions or suggestions?** Open an issue on GitHub!

---

*Happy job hunting! 🚀*
