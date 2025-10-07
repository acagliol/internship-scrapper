'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, TrendingUp, RefreshCw, ExternalLink } from 'lucide-react';

interface Job {
  company_name: string;
  title: string;
  locations: string;
  url: string;
  date_posted: number;
  date_updated: number;
  active: boolean;
  sponsorship?: string;
  terms?: string[];
  is_visible?: boolean;
}

interface ProcessedJob extends Job {
  matchScore: number;
  isFiltered: boolean;
}

// Customize these with YOUR resume keywords and skills
const RESUME_KEYWORDS = [
  'software', 'engineer', 'full stack', 'frontend', 'backend',
  'react', 'typescript', 'javascript', 'python', 'java',
  'web development', 'api', 'database', 'cloud', 'aws',
  'machine learning', 'data', 'mobile', 'android', 'ios'
];

export default function InternshipScraperPage() {
  const [jobs, setJobs] = useState<ProcessedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [minMatchScore, setMinMatchScore] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [jobTypeFilter, setJobTypeFilter] = useState<'all' | 'swe' | 'quant' | 'pm'>('swe');

  // Filter by job type (SWE, Quant, PM)
  const matchesJobType = (job: Job): boolean => {
    const title = job.title.toLowerCase();

    if (jobTypeFilter === 'all') return true;

    if (jobTypeFilter === 'swe') {
      return title.includes('software') ||
             title.includes('engineer') ||
             title.includes('developer') ||
             title.includes('swe') ||
             title.includes('frontend') ||
             title.includes('backend') ||
             title.includes('full stack') ||
             title.includes('fullstack');
    }

    if (jobTypeFilter === 'quant') {
      return title.includes('quant') ||
             title.includes('quantitative') ||
             title.includes('trading');
    }

    if (jobTypeFilter === 'pm') {
      return title.includes('product') &&
             (title.includes('manager') || title.includes('management'));
    }

    return true;
  };

  // Location filter function
  const shouldIncludeJob = (job: Job): boolean => {
    const locations = job.locations.toLowerCase();

    // Include if remote
    if (locations.includes('remote')) {
      return true;
    }

    // US states and major cities
    const usKeywords = [
      'usa', 'united states', 'u.s.', 'california', 'texas', 'new york',
      'washington', 'massachusetts', 'illinois', 'georgia', 'florida',
      'san francisco', 'seattle', 'austin', 'boston', 'chicago', 'atlanta',
      'denver', 'portland', 'los angeles', 'san diego', 'miami', 'dallas'
    ];

    // European countries and cities
    const europeKeywords = [
      'europe', 'germany', 'france', 'uk', 'united kingdom', 'spain',
      'italy', 'netherlands', 'poland', 'sweden', 'switzerland',
      'london', 'berlin', 'paris', 'amsterdam', 'dublin', 'zurich'
    ];

    // Argentina
    const argentinaKeywords = ['argentina', 'buenos aires'];

    // Check if location matches any filter
    const matchesUS = usKeywords.some(kw => locations.includes(kw));
    const matchesEurope = europeKeywords.some(kw => locations.includes(kw));
    const matchesArgentina = argentinaKeywords.some(kw => locations.includes(kw));

    return matchesUS || matchesEurope || matchesArgentina;
  };

  // Calculate match score based on resume keywords
  const calculateMatchScore = (job: Job): number => {
    const jobText = `${job.title} ${job.company_name}`.toLowerCase();
    let matches = 0;

    RESUME_KEYWORDS.forEach(keyword => {
      if (jobText.includes(keyword.toLowerCase())) {
        matches++;
      }
    });

    return Math.min(100, Math.round((matches / RESUME_KEYWORDS.length) * 100 * 2)); // Multiply by 2 for better scoring
  };

  // Fetch jobs from GitHub
  const fetchJobs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch job listings');
      }

      const data: Job[] = await response.json();

      // Filter and process jobs
      const processedJobs = data
        .filter(job => job.active && (job.is_visible !== false))
        .filter(job => matchesJobType(job))
        .map(job => ({
          ...job,
          matchScore: calculateMatchScore(job),
          isFiltered: shouldIncludeJob(job)
        }))
        .filter(job => job.isFiltered)
        .sort((a, b) => b.matchScore - a.matchScore);

      setJobs(processedJobs);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [jobTypeFilter]);

  // Filter jobs by search term and match score
  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.locations.toLowerCase().includes(searchTerm.toLowerCase());

    const meetsScoreThreshold = job.matchScore >= minMatchScore;

    return matchesSearch && meetsScoreThreshold;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Summer 2026 Internships
              </h1>
              <p className="text-gray-600">
                Filtered for US, Europe, Argentina & Remote • Matched to your resume
              </p>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-2">
                  Last updated: {lastUpdated.toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={fetchJobs}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Jobs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{jobs.length}</p>
              </div>
              <Briefcase className="text-blue-600" size={36} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">After Filters</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{filteredJobs.length}</p>
              </div>
              <Search className="text-green-600" size={36} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Top Match</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {filteredJobs.length > 0 ? `${filteredJobs[0].matchScore}%` : 'N/A'}
                </p>
              </div>
              <TrendingUp className="text-purple-600" size={36} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">High Matches</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {filteredJobs.filter(j => j.matchScore >= 50).length}
                </p>
              </div>
              <MapPin className="text-orange-600" size={36} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type
              </label>
              <select
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="swe">Software Engineering</option>
                <option value="quant">Quant/Trading</option>
                <option value="pm">Product Management</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by title, company, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Match Score: {minMatchScore}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <p className="text-red-800 font-medium">Error: {error}</p>
            <button
              onClick={fetchJobs}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-6 text-gray-600 text-lg">Loading internships...</p>
          </div>
        )}

        {/* Job Listings */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <p className="text-gray-600 text-lg">No jobs match your current filters.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setMinMatchScore(0);
                  }}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredJobs.map((job, index) => (
                <div
                  key={`${job.company_name}-${job.title}-${index}`}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border-l-4"
                  style={{
                    borderLeftColor:
                      job.matchScore >= 70 ? '#10b981' :
                      job.matchScore >= 40 ? '#f59e0b' :
                      '#6b7280'
                  }}
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {job.title}
                          </h3>
                          <p className="text-lg text-gray-700 font-medium">
                            {job.company_name}
                          </p>
                        </div>
                        <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                          job.matchScore >= 70 ? 'bg-green-100 text-green-800' :
                          job.matchScore >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.matchScore}% Match
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          <MapPin size={16} />
                          {job.locations}
                        </span>
                        <span>Posted: {formatDate(job.date_posted)}</span>
                        {job.sponsorship && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {job.sponsorship}
                          </span>
                        )}
                      </div>

                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        Apply Now
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📝 Customization Guide</h3>
          <div className="space-y-3 text-gray-700">
            <p><strong>1. Update Resume Keywords:</strong> Edit the RESUME_KEYWORDS array (line 29) with your actual skills</p>
            <p><strong>2. Adjust Location Filters:</strong> Modify the shouldIncludeJob function for your preferences</p>
            <p><strong>3. Filter by Job Type:</strong> Use the dropdown to see only SWE, Quant, or PM roles</p>
            <p><strong>4. Deploy to Vercel:</strong> Push to GitHub and connect to Vercel for auto-deployment</p>
            <p><strong>5. Auto-refresh:</strong> Add a Vercel cron job to fetch updates every hour</p>
            <p className="text-sm text-gray-600 mt-4">
              💡 <strong>Data Source:</strong> This pulls directly from SimplifyJobs&apos; listings.json (updated daily)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
