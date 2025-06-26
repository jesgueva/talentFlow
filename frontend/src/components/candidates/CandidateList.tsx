import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { candidatesAPI, Candidate } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';

const CandidateList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get('job_id');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: candidates, isLoading, error } = useQuery({
    queryKey: ['candidates', jobIdParam, statusFilter],
    queryFn: () => candidatesAPI.getCandidates(jobIdParam || undefined, statusFilter || undefined),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading candidates</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>There was an error loading the candidates. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const candidatesData = candidates?.data || [];

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'strong fit':
        return 'bg-green-100 text-green-800';
      case 'moderate fit':
        return 'bg-yellow-100 text-yellow-800';
      case 'weak fit':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'interview_scheduled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">
            Candidates {jobIdParam && '(Filtered by Job)'}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Review and manage candidate applications.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Filter Candidates</h3>
              <p className="mt-1 text-sm text-gray-500">Choose which candidates to display</p>
            </div>
            <div className="mt-4 sm:mt-0 sm:flex sm:space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="interview_scheduled">Interview Scheduled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      {candidatesData.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {candidatesData.map((candidate: Candidate) => (
              <li key={candidate.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-800">
                          {candidate.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {candidate.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {candidate.email}
                          </p>
                          <p className="text-xs text-gray-400">
                            {candidate.job_title && `Applied for: ${candidate.job_title} • `}
                            Applied {formatDistanceToNow(new Date(candidate.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          {candidate.ranking_score && (
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">
                                {candidate.ranking_score.toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-500">Score</div>
                            </div>
                          )}
                          {candidate.tier && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(candidate.tier)}`}>
                              {candidate.tier}
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                            {candidate.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span className="truncate">
                            Skills: {candidate.skills.slice(0, 3).join(', ')}
                            {candidate.skills.length > 3 && ` +${candidate.skills.length - 3} more`}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6l-3.097 1.016A9.026 9.026 0 0112 15m0 0a8.997 8.997 0 01-8.903 0L0 13.255V7a2 2 0 012-2h4V6" />
                          </svg>
                          <span className="truncate">
                            Experience: {candidate.experience || 'Not specified'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6 flex-shrink-0">
                    <Link
                      to={`/candidates/${candidate.id}`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View Details
                      <svg className="ml-1 -mr-0.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusFilter 
                ? `No candidates found with status "${statusFilter}".`
                : 'No candidates have been uploaded yet.'
              }
            </p>
            {!statusFilter && !jobIdParam && (
              <div className="mt-6">
                <Link
                  to="/jobs"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Job & Upload Resumes
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateList;