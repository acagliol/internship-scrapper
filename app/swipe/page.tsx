'use client';

import React, { useState, useEffect } from 'react';
import { Heart, X, MapPin, Calendar, Building2, TrendingUp, ArrowLeft, RotateCcw, Sparkles } from 'lucide-react';
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
}

interface SwipeAction {
  jobKey: string;
  action: 'like' | 'pass';
  timestamp: number;
}

// Customize these with YOUR resume keywords and skills
const RESUME_KEYWORDS = [
  'software', 'engineer', 'full stack', 'frontend', 'backend',
  'react', 'typescript', 'javascript', 'python', 'java',
  'web development', 'api', 'database', 'cloud', 'aws',
  'machine learning', 'data', 'mobile', 'android', 'ios'
];

export default function SwipePage() {
  const [jobs, setJobs] = useState<ProcessedJob[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [likedJobs, setLikedJobs] = useState<Set<string>>(new Set());
  const [passedJobs, setPassedJobs] = useState<Set<string>>(new Set());
  const [swipeHistory, setSwipeHistory] = useState<SwipeAction[]>([]);
  const [stats, setStats] = useState({ liked: 0, passed: 0, remaining: 0 });

  // Load saved data from localStorage
  useEffect(() => {
    const savedLiked = localStorage.getItem('swipeLikedJobs');
    const savedPassed = localStorage.getItem('swipePassedJobs');
    const savedHistory = localStorage.getItem('swipeHistory');

    if (savedLiked) setLikedJobs(new Set(JSON.parse(savedLiked)));
    if (savedPassed) setPassedJobs(new Set(JSON.parse(savedPassed)));
    if (savedHistory) setSwipeHistory(JSON.parse(savedHistory));
  }, []);

  // Save to localStorage
  const saveLikedJob = (jobKey: string) => {
    const newLiked = new Set(likedJobs);
    newLiked.add(jobKey);
    setLikedJobs(newLiked);
    localStorage.setItem('swipeLikedJobs', JSON.stringify([...newLiked]));

    // Also save to favorites (same as main page)
    const favorites = new Set(JSON.parse(localStorage.getItem('favoriteJobs') || '[]'));
    favorites.add(jobKey);
    localStorage.setItem('favoriteJobs', JSON.stringify([...favorites]));
  };

  const savePassedJob = (jobKey: string) => {
    const newPassed = new Set(passedJobs);
    newPassed.add(jobKey);
    setPassedJobs(newPassed);
    localStorage.setItem('swipePassedJobs', JSON.stringify([...newPassed]));
  };

  const addToHistory = (jobKey: string, action: 'like' | 'pass') => {
    const newHistory = [...swipeHistory, { jobKey, action, timestamp: Date.now() }];
    setSwipeHistory(newHistory);
    localStorage.setItem('swipeHistory', JSON.stringify(newHistory));
  };

  // Calculate match score
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

  // Filter function
  const shouldIncludeJob = (job: Job): boolean => {
    if (!job.locations) return false;

    const locationArray = Array.isArray(job.locations) ? job.locations : [job.locations];
    const locations = locationArray.join(' ').toLowerCase();

    if (locations.includes('remote')) return true;

    const usKeywords = [
      'usa', 'united states', 'u.s.', 'california', 'texas', 'new york',
      'washington', 'massachusetts', 'illinois', 'georgia', 'florida',
      'san francisco', 'seattle', 'austin', 'boston', 'chicago', 'atlanta',
      ', ca', ', tx', ', ny', ', wa', ', ma', ', il', ', ga', ', fl'
    ];

    const europeKeywords = [
      'europe', 'germany', 'france', 'uk', 'united kingdom', 'spain',
      'london', 'berlin', 'paris', 'amsterdam', 'dublin', 'zurich'
    ];

    const argentinaKeywords = ['argentina', 'buenos aires'];

    return usKeywords.some(kw => locations.includes(kw)) ||
           europeKeywords.some(kw => locations.includes(kw)) ||
           argentinaKeywords.some(kw => locations.includes(kw));
  };

  // Fetch jobs
  const fetchJobs = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json'
      );

      if (!response.ok) throw new Error('Failed to fetch jobs');

      const data: Job[] = await response.json();

      const processedJobs = data
        .filter(job => job.active && (job.is_visible !== false))
        .map(job => ({
          ...job,
          matchScore: calculateMatchScore(job),
          isFiltered: shouldIncludeJob(job)
        }))
        .filter(job => job.isFiltered)
        .filter(job => {
          const jobKey = `${job.company_name}-${job.title}`;
          return !likedJobs.has(jobKey) && !passedJobs.has(jobKey);
        })
        .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score

      setJobs(processedJobs);
      updateStats(processedJobs.length);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [likedJobs, passedJobs]);

  const updateStats = (remaining: number) => {
    setStats({
      liked: likedJobs.size,
      passed: passedJobs.size,
      remaining
    });
  };

  

  useEffect(() => {
    updateStats(jobs.length - currentIndex);
  }, [currentIndex, jobs, likedJobs, passedJobs]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (currentIndex >= jobs.length) return;

    const currentJob = jobs[currentIndex];
    const jobKey = `${currentJob.company_name}-${currentJob.title}`;

    setSwipeDirection(direction);

    setTimeout(() => {
      if (direction === 'right') {
        saveLikedJob(jobKey);
        addToHistory(jobKey, 'like');
      } else {
        savePassedJob(jobKey);
        addToHistory(jobKey, 'pass');
      }

      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
    }, 300);
  };

  const handleUndo = () => {
    if (swipeHistory.length === 0 || currentIndex === 0) return;

    const lastAction = swipeHistory[swipeHistory.length - 1];

    // Remove from liked or passed
    if (lastAction.action === 'like') {
      const newLiked = new Set(likedJobs);
      newLiked.delete(lastAction.jobKey);
      setLikedJobs(newLiked);
      localStorage.setItem('swipeLikedJobs', JSON.stringify([...newLiked]));

      const favorites = new Set(JSON.parse(localStorage.getItem('favoriteJobs') || '[]'));
      favorites.delete(lastAction.jobKey);
      localStorage.setItem('favoriteJobs', JSON.stringify([...favorites]));
    } else {
      const newPassed = new Set(passedJobs);
      newPassed.delete(lastAction.jobKey);
      setPassedJobs(newPassed);
      localStorage.setItem('swipePassedJobs', JSON.stringify([...newPassed]));
    }

    // Remove from history
    const newHistory = swipeHistory.slice(0, -1);
    setSwipeHistory(newHistory);
    localStorage.setItem('swipeHistory', JSON.stringify(newHistory));

    // Go back
    setCurrentIndex(prev => prev - 1);
  };

  const resetSwipes = () => {
    if (confirm('Are you sure you want to reset all swipes? This will clear your liked and passed jobs.')) {
      setLikedJobs(new Set());
      setPassedJobs(new Set());
      setSwipeHistory([]);
      setCurrentIndex(0);
      localStorage.removeItem('swipeLikedJobs');
      localStorage.removeItem('swipePassedJobs');
      localStorage.removeItem('swipeHistory');
      fetchJobs();
    }
  };

  const currentJob = jobs[currentIndex];
  const progress = jobs.length > 0 ? ((currentIndex / jobs.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to List</span>
            </Link>
            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={swipeHistory.length === 0}
                className="p-2 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo last swipe"
              >
                <RotateCcw size={20} />
              </button>
              <button
                onClick={resetSwipes}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition text-sm font-medium"
              >
                Reset All
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Sparkles className="text-purple-600" size={32} />
            Job Swipe
          </h1>
          <p className="text-gray-600">Swipe right to like, left to pass</p>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{currentIndex} / {jobs.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <Heart className="text-green-500 mx-auto mb-2" size={24} />
            <p className="text-2xl font-bold text-gray-900">{stats.liked}</p>
            <p className="text-sm text-gray-600">Liked</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <X className="text-red-500 mx-auto mb-2" size={24} />
            <p className="text-2xl font-bold text-gray-900">{stats.passed}</p>
            <p className="text-sm text-gray-600">Passed</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <TrendingUp className="text-blue-500 mx-auto mb-2" size={24} />
            <p className="text-2xl font-bold text-gray-900">{stats.remaining}</p>
            <p className="text-sm text-gray-600">Remaining</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
            <p className="mt-6 text-gray-600 text-lg">Loading jobs...</p>
          </div>
        )}

        {/* No More Jobs */}
        {!loading && currentIndex >= jobs.length && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">All Done!</h2>
            <p className="text-gray-600 mb-6">
              You've reviewed all available jobs. Check your liked jobs on the main page!
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium"
              >
                View All Jobs
              </Link>
              <button
                onClick={resetSwipes}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-medium"
              >
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* Job Card */}
        {!loading && currentJob && (
          <div className="relative">
            <div
              className={`bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 transform ${
                swipeDirection === 'left' ? '-translate-x-full rotate-12 opacity-0' :
                swipeDirection === 'right' ? 'translate-x-full -rotate-12 opacity-0' :
                'translate-x-0 rotate-0 opacity-100'
              }`}
            >
              {/* Match Score Badge */}
              <div className="absolute top-6 right-6 z-10">
                <div className={`px-5 py-2 rounded-full font-bold text-lg shadow-lg ${
                  currentJob.matchScore >= 70 ? 'bg-green-500 text-white' :
                  currentJob.matchScore >= 40 ? 'bg-yellow-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {currentJob.matchScore}% Match
                </div>
              </div>

              {/* Card Content */}
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    {currentJob.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xl text-gray-700 font-semibold mb-4">
                    <Building2 size={24} className="text-purple-600" />
                    {currentJob.company_name}
                  </div>
                </div>

                {/* Job Details */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3 text-gray-700">
                    <MapPin size={20} className="text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-gray-500 mb-1">Location</p>
                      <p className="text-lg">
                        {Array.isArray(currentJob.locations)
                          ? currentJob.locations.join(', ')
                          : currentJob.locations}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-gray-700">
                    <Calendar size={20} className="text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-gray-500 mb-1">Posted</p>
                      <p className="text-lg">{formatDate(currentJob.date_posted)}</p>
                    </div>
                  </div>

                  {currentJob.sponsorship && (
                    <div className="mt-4">
                      <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {currentJob.sponsorship}
                      </span>
                    </div>
                  )}

                  {currentJob.terms && currentJob.terms.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-sm text-gray-500 mb-2">Terms</p>
                      <div className="flex flex-wrap gap-2">
                        {currentJob.terms.map((term, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Apply Link */}
                <a
                  href={currentJob.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition font-medium mb-6"
                >
                  View Full Description & Apply
                </a>

                {/* Action Buttons */}
                <div className="flex justify-center gap-6">
                  <button
                    onClick={() => handleSwipe('left')}
                    className="w-20 h-20 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-lg"
                  >
                    <X size={40} strokeWidth={3} />
                  </button>

                  <button
                    onClick={() => handleSwipe('right')}
                    className="w-20 h-20 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-lg"
                  >
                    <Heart size={40} strokeWidth={3} />
                  </button>
                </div>

                <div className="text-center mt-6 text-sm text-gray-500">
                  <p>Press <kbd className="px-2 py-1 bg-gray-100 rounded">←</kbd> to pass or <kbd className="px-2 py-1 bg-gray-100 rounded">→</kbd> to like</p>
                </div>
              </div>
            </div>

            {/* Next Card Preview (shows slightly behind) */}
            {currentIndex + 1 < jobs.length && (
              <div className="absolute top-4 left-4 right-4 bottom-4 bg-white rounded-3xl shadow-xl -z-10 opacity-50" />
            )}
            {currentIndex + 2 < jobs.length && (
              <div className="absolute top-8 left-8 right-8 bottom-8 bg-white rounded-3xl shadow-lg -z-20 opacity-25" />
            )}
          </div>
        )}

        {/* Keyboard shortcuts */}
        {!loading && currentJob && (
          <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Tips</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Use the buttons or keyboard arrows to swipe</li>
              <li>• Liked jobs are automatically saved to your favorites</li>
              <li>• Jobs are sorted by match score (highest first)</li>
              <li>• Use "Undo" to go back one step</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Add keyboard support
if (typeof window !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      const passButton = document.querySelector('[data-swipe="left"]') as HTMLButtonElement;
      passButton?.click();
    } else if (e.key === 'ArrowRight') {
      const likeButton = document.querySelector('[data-swipe="right"]') as HTMLButtonElement;
      likeButton?.click();
    }
  });
}
