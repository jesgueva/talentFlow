import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { jobsAPI, Job } from '../../utils/api';
import CreateJobModal from './CreateJobModal';
import { formatDistanceToNow } from 'date-fns';

const JobList: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ['jobs', statusFilter],
    queryFn: () => jobsAPI.getJobs(statusFilter),
  });

  const handleJobCreated = () => {
    setShowCreateModal(false);
    refetch();
  };

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
            <h3 className="text-sm font-medium text-red-800">Error loading jobs</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>There was an error loading the jobs. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const jobsData = jobs?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Jobs</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your job postings and recruitment processes.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Job
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Filter Jobs</h3>
              <p className="mt-1 text-sm text-gray-500">Choose which jobs to display</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="active">Active Jobs</option>
                <option value="inactive">Inactive Jobs</option>
                <option value="all">All Jobs</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      {jobsData.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {jobsData.map((job: Job) => (
            <div key={job.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6l-3.097 1.016A9.026 9.026 0 0112 15m0 0a8.997 8.997 0 01-8.903 0L0 13.255V7a2 2 0 012-2h4V6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {job.department}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {job.description}
                  </p>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Required Skills</h4>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {job.required_skills.slice(0, 3).map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        {skill}
                      </span>
                    ))}
                    {job.required_skills.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                        +{job.required_skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    {job.candidate_count || 0} candidates
                  </div>
                  <div className="text-sm text-gray-500">
                    Created {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-3">
                <div className="flex justify-between">
                  <div className="text-sm">
                    <span className="text-gray-500">Min Experience: </span>
                    <span className="font-medium text-gray-900">{job.min_experience_years} years</span>
                  </div>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6l-3.097 1.016A9.026 9.026 0 0112 15m0 0a8.997 8.997 0 01-8.903 0L0 13.255V7a2 2 0 012-2h4V6" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first job posting.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <CreateJobModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onJobCreated={handleJobCreated}
        />
      )}
    </div>
  );
};

export default JobList;