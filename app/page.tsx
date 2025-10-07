'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, TrendingUp, RefreshCw, ExternalLink, Download, Star, Calendar, Filter, SortAsc, Globe, Heart } from 'lucide-react';
import Link from 'next/link';

interface Job {
  company_name: string;
  title: string;
  locations: string | string[];
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
  isFavorite?: boolean;
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

  // New filters
  const [locationFilter, setLocationFilter] = useState<'all' | 'remote' | 'us' | 'europe' | 'argentina'>('all');
  const [sponsorshipFilter, setSponsorshipFilter] = useState<'all' | 'sponsors' | 'no-sponsors'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');
  const [sortBy, setSortBy] = useState<'match' | 'date' | 'company'>('match');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favoriteJobs');
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save favorites to localStorage
  const toggleFavorite = (jobKey: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(jobKey)) {
      newFavorites.delete(jobKey);
    } else {
      newFavorites.add(jobKey);
    }
    setFavorites(newFavorites);
    localStorage.setItem('favoriteJobs', JSON.stringify([...newFavorites]));
  };

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

  // Check if job matches location filter
  const matchesLocation = (job: Job, locString: string): boolean => {
    if (locationFilter === 'all') return true;

    if (locationFilter === 'remote') {
      return locString.includes('remote');
    }

    if (locationFilter === 'us') {
      const usKeywords = [
        'usa', 'united states', 'u.s.', 'california', 'texas', 'new york',
        'washington', 'massachusetts', 'illinois', 'georgia', 'florida',
        'san francisco', 'seattle', 'austin', 'boston', 'chicago', 'atlanta',
        'denver', 'portland', 'los angeles', 'san diego', 'miami', 'dallas',
        ', ca', ', tx', ', ny', ', wa', ', ma', ', il', ', ga', ', fl', ', co', ', or',
        ', az', ', nc', ', va', ', pa', ', oh', ', mi', ', tn', ', nj', ', md'
      ];
      return usKeywords.some(kw => locString.includes(kw));
    }

    if (locationFilter === 'europe') {
      const europeKeywords = [
        'europe', 'germany', 'france', 'uk', 'united kingdom', 'spain',
        'italy', 'netherlands', 'poland', 'sweden', 'switzerland',
        'london', 'berlin', 'paris', 'amsterdam', 'dublin', 'zurich'
      ];
      return europeKeywords.some(kw => locString.includes(kw));
    }

    if (locationFilter === 'argentina') {
      return locString.includes('argentina') || locString.includes('buenos aires');
    }

    return false;
  };

  // Location filter function - initial data filtering
  const shouldIncludeJob = (job: Job): boolean => {
    if (!job.locations) return false;

    const locationArray = Array.isArray(job.locations) ? job.locations : [job.locations];
    const locations = locationArray.join(' ').toLowerCase();

    // Include if remote
    if (locations.includes('remote')) {
      return true;
    }

    // US states and major cities
    const usKeywords = [
      'usa', 'united states', 'u.s.', 'california', 'texas', 'new york',
      'washington', 'massachusetts', 'illinois', 'georgia', 'florida',
      'san francisco', 'seattle', 'austin', 'boston', 'chicago', 'atlanta',
      'denver', 'portland', 'los angeles', 'san diego', 'miami', 'dallas',
      ', ca', ', tx', ', ny', ', wa', ', ma', ', il', ', ga', ', fl', ', co', ', or',
      ', az', ', nc', ', va', ', pa', ', oh', ', mi', ', tn', ', nj', ', md'
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

    return Math.min(100, Math.round((matches / RESUME_KEYWORDS.length) * 100 * 2));
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
        .filter(job => job.isFiltered);

      setJobs(processedJobs);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [jobTypeFilter]);

  // Filter jobs by all criteria
  const filteredJobs = jobs.filter(job => {
    const locationArray = Array.isArray(job.locations) ? job.locations : [job.locations];
    const locationsString = locationArray.join(' ').toLowerCase();

    // Search filter
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      locationsString.includes(searchTerm.toLowerCase());

    // Match score filter
    const meetsScoreThreshold = job.matchScore >= minMatchScore;

    // Location filter
    const meetsLocationFilter = matchesLocation(job, locationsString);

    // Sponsorship filter
    let meetsSponsorshipFilter = true;
    if (sponsorshipFilter === 'sponsors') {
      meetsSponsorshipFilter = !!job.sponsorship && job.sponsorship.toLowerCase().includes('sponsor');
    } else if (sponsorshipFilter === 'no-sponsors') {
      meetsSponsorshipFilter = !job.sponsorship || !job.sponsorship.toLowerCase().includes('sponsor');
    }

    // Date filter
    let meetsDateFilter = true;
    if (dateFilter !== 'all') {
      const now = Date.now() / 1000;
      const daysDiff = (now - job.date_posted) / 86400;

      if (dateFilter === '7days') meetsDateFilter = daysDiff <= 7;
      else if (dateFilter === '30days') meetsDateFilter = daysDiff <= 30;
      else if (dateFilter === '90days') meetsDateFilter = daysDiff <= 90;
    }

    // Favorites filter
    const jobKey = `${job.company_name}-${job.title}`;
    const meetsFavoritesFilter = !showFavoritesOnly || favorites.has(jobKey);

    return matchesSearch && meetsScoreThreshold && meetsLocationFilter &&
           meetsSponsorshipFilter && meetsDateFilter && meetsFavoritesFilter;
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'match') {
      return b.matchScore - a.matchScore;
    } else if (sortBy === 'date') {
      return b.date_posted - a.date_posted;
    } else if (sortBy === 'company') {
      return a.company_name.localeCompare(b.company_name);
    }
    return 0;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Company', 'Title', 'Location', 'Match Score', 'Date Posted', 'Sponsorship', 'URL'];
    const rows = sortedJobs.map(job => {
      const locationArray = Array.isArray(job.locations) ? job.locations : [job.locations];
      return [
        job.company_name,
        job.title,
        locationArray.join('; '),
        job.matchScore,
        formatDate(job.date_posted),
        job.sponsorship || 'N/A',
        job.url
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `internships-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Summer 2026 Internships
              </h1>
              <p className="text-gray-600">
                Smart filtering • Resume matching • Swipe mode • Track favorites
              </p>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-2">
                  Last updated: {lastUpdated.toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/swipe"
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition flex items-center gap-2 font-medium"
              >
                <Heart size={18} />
                Swipe Mode
              </Link>
              <button
                onClick={exportToCSV}
                disabled={sortedJobs.length === 0}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                Export CSV
              </button>
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
                <p className="text-3xl font-bold text-gray-900 mt-1">{sortedJobs.length}</p>
              </div>
              <Search className="text-green-600" size={36} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Favorites</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{favorites.size}</p>
              </div>
              <Star className="text-yellow-500" size={36} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">High Matches</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {sortedJobs.filter(j => j.matchScore >= 50).length}
                </p>
              </div>
              <TrendingUp className="text-purple-600" size={36} />
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="text-gray-700" size={20} />
            <h2 className="text-xl font-bold text-gray-900">Filters & Search</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {/* Job Type */}
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

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe size={14} className="inline mr-1" />
                Location
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Locations</option>
                <option value="remote">Remote Only</option>
                <option value="us">US Only</option>
                <option value="europe">Europe Only</option>
                <option value="argentina">Argentina Only</option>
              </select>
            </div>

            {/* Sponsorship Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sponsorship
              </label>
              <select
                value={sponsorshipFilter}
                onChange={(e) => setSponsorshipFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="sponsors">Offers Sponsorship</option>
                <option value="no-sponsors">No Sponsorship</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={14} className="inline mr-1" />
                Posted Date
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
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

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <SortAsc size={14} className="inline mr-1" />
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="match">Best Match</option>
                <option value="date">Most Recent</option>
                <option value="company">Company Name</option>
              </select>
            </div>

            {/* Match Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Match Score: {minMatchScore}%
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

          {/* Show Favorites Toggle */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                showFavoritesOnly
                  ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Star size={16} className={showFavoritesOnly ? 'fill-yellow-500' : ''} />
              {showFavoritesOnly ? 'Showing Favorites Only' : 'Show All Jobs'}
            </button>

            <button
              onClick={() => {
                setSearchTerm('');
                setMinMatchScore(0);
                setLocationFilter('all');
                setSponsorshipFilter('all');
                setDateFilter('all');
                setShowFavoritesOnly(false);
              }}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
            >
              Clear All Filters
            </button>
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
            {sortedJobs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <p className="text-gray-600 text-lg">No jobs match your current filters.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setMinMatchScore(0);
                    setLocationFilter('all');
                    setSponsorshipFilter('all');
                    setDateFilter('all');
                    setShowFavoritesOnly(false);
                  }}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              sortedJobs.map((job, index) => {
                const jobKey = `${job.company_name}-${job.title}`;
                const isFavorite = favorites.has(jobKey);

                return (
                  <div
                    key={`${jobKey}-${index}`}
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
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-2xl font-bold text-gray-900">
                                {job.title}
                              </h3>
                              <button
                                onClick={() => toggleFavorite(jobKey)}
                                className="p-2 hover:bg-yellow-50 rounded-full transition"
                                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                <Star
                                  size={24}
                                  className={isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                />
                              </button>
                            </div>
                            <p className="text-lg text-gray-700 font-medium mt-1">
                              {job.company_name}
                            </p>
                          </div>
                          <div className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap ${
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
                            {Array.isArray(job.locations) ? job.locations.join(', ') : job.locations}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={16} />
                            Posted: {formatDate(job.date_posted)}
                          </span>
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
                );
              })
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">New Features</h3>
          <div className="grid md:grid-cols-2 gap-4 text-gray-700">
            <div>
              <p className="font-semibold mb-2">Advanced Filters:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Filter by location (Remote, US, Europe, Argentina)</li>
                <li>Filter by sponsorship status</li>
                <li>Filter by date posted (7/30/90 days)</li>
                <li>Sort by match score, date, or company name</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">New Features:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>🔥 Tinder-style swipe mode for quick reviewing</li>
                <li>Save favorite jobs (stored in browser)</li>
                <li>Export filtered results to CSV</li>
                <li>Enhanced search across all fields</li>
                <li>Better UI with more stats</li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Customize RESUME_KEYWORDS (line 26) to match your skills for better matching!
          </p>
        </div>
      </div>
    </div>
  );
}
