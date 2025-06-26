import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { jobsAPI, Candidate } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [dragActive, setDragActive] = useState(false);
  const queryClient = useQueryClient();

  const { data: jobData, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsAPI.getJob(id!),
    enabled: !!id,
  });

  const uploadResumesMutation = useMutation({
    mutationFn: (files: FileList) => jobsAPI.uploadResumes(id!, files),
    onSuccess: (data) => {
      toast.success(`Successfully processed ${data.data.processed_count} resumes`);
      queryClient.invalidateQueries({ queryKey: ['job', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to upload resumes');
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      toast.error('Please select PDF files only');
      return;
    }

    if (pdfFiles.length !== files.length) {
      toast('Only PDF files were selected for upload', { icon: '⚠️' });
    }

    const fileList = new DataTransfer();
    pdfFiles.forEach(file => fileList.items.add(file));
    
    uploadResumesMutation.mutate(fileList.files);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !jobData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading job</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>The job could not be found or there was an error loading it.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { job, candidates } = jobData.data;

  return (
    <div className="space-y-6">
      {/* Job Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="mt-1 text-sm text-gray-500">{job.department}</p>
              <div className="mt-2 flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  job.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {job.status}
                </span>
                <span className="ml-4 text-sm text-gray-500">
                  Created {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                to="/jobs"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ← Back to Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Job Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
              
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Required Skills</h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {job.required_skills.map((skill: string, index: number) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900">Preferred Skills</h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {job.preferred_skills.map((skill: string, index: number) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Experience Required</h3>
                  <p className="mt-1 text-sm text-gray-600">{job.min_experience_years} years</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900">Education Level</h3>
                  <p className="mt-1 text-sm text-gray-600">{job.education_level || 'Not specified'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900">Certifications</h3>
                  <div className="mt-1">
                    {job.certifications.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {job.certifications.map((cert: string, index: number) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                            {cert}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">None specified</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          {/* Resume Upload */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Resumes</h3>
              
              <div
                className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept=".pdf"
                        onChange={handleFileSelect}
                        disabled={uploadResumesMutation.isPending}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF files only</p>
                </div>
              </div>

              {uploadResumesMutation.isPending && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Processing resumes...</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Total Candidates</dt>
                  <dd className="text-sm font-medium text-gray-900">{candidates.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">New Applications</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {candidates.filter((c: Candidate) => c.status === 'new').length}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Approved</dt>
                  <dd className="text-sm font-medium text-green-600">
                    {candidates.filter((c: Candidate) => c.status === 'approved').length}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Rejected</dt>
                  <dd className="text-sm font-medium text-red-600">
                    {candidates.filter((c: Candidate) => c.status === 'rejected').length}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Candidates ({candidates.length})
            </h3>
            {candidates.length > 0 && (
              <Link
                to={`/candidates?job_id=${job.id}`}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                View All Candidates →
              </Link>
            )}
          </div>

          {candidates.length > 0 ? (
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {candidates.slice(0, 5).map((candidate: Candidate) => (
                  <li key={candidate.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-800">
                            {candidate.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {candidate.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {candidate.email}
                        </p>
                        {candidate.ranking_score && (
                          <p className="text-xs text-gray-400">
                            Ranking Score: {candidate.ranking_score.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          candidate.status === 'new' 
                            ? 'bg-blue-100 text-blue-800'
                            : candidate.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : candidate.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {candidate.status}
                        </span>
                      </div>
                      <div className="flex-shrink-0">
                        <Link
                          to={`/candidates/${candidate.id}`}
                          className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              
              {candidates.length > 5 && (
                <div className="mt-4 text-center">
                  <Link
                    to={`/candidates?job_id=${job.id}`}
                    className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                  >
                    View {candidates.length - 5} More Candidates →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload resumes to start processing candidates for this job.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetail;