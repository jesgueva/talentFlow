import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { candidatesAPI, interviewsAPI, emailsAPI } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [statusNotes, setStatusNotes] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailType, setEmailType] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const queryClient = useQueryClient();

  const { data: candidateData, isLoading, error } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => candidatesAPI.getCandidate(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes: string }) =>
      candidatesAPI.updateCandidateStatus(id!, status, notes),
    onSuccess: () => {
      toast.success('Status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['candidate', id] });
      setStatusNotes('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update status');
    },
  });

  const scheduleInterviewMutation = useMutation({
    mutationFn: ({ interviewType, location }: { interviewType: string; location: string }) =>
      interviewsAPI.scheduleInterview(id!, interviewType, location),
    onSuccess: () => {
      toast.success('Interview scheduled successfully!');
      queryClient.invalidateQueries({ queryKey: ['candidate', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to schedule interview');
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: ({ type, message, subject }: { type: string; message: string; subject: string }) =>
      emailsAPI.sendEmail(id!, type, message, subject),
    onSuccess: () => {
      toast.success('Email sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['candidate', id] });
      setShowEmailModal(false);
      setCustomMessage('');
      setCustomSubject('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send email');
    },
  });

  const handleStatusUpdate = (status: string) => {
    updateStatusMutation.mutate({ status, notes: statusNotes });
  };

  const handleScheduleInterview = () => {
    scheduleInterviewMutation.mutate({
      interviewType: 'initial',
      location: 'Virtual',
    });
  };

  const handleSendEmail = () => {
    sendEmailMutation.mutate({
      type: emailType,
      message: customMessage,
      subject: customSubject,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !candidateData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading candidate</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>The candidate could not be found or there was an error loading the data.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { candidate, interview, emails } = candidateData.data;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
              <p className="mt-1 text-sm text-gray-500">{candidate.email}</p>
              <div className="mt-2 flex items-center space-x-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                  {candidate.status.replace('_', ' ')}
                </span>
                {candidate.tier && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(candidate.tier)}`}>
                    {candidate.tier}
                  </span>
                )}
                {candidate.ranking_score && (
                  <span className="text-sm text-gray-600">
                    Score: <span className="font-semibold">{candidate.ranking_score.toFixed(2)}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                to="/candidates"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ← Back to Candidates
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Candidate Information</h2>
              
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{candidate.phone || 'Not provided'}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Applied Position</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {candidate.job?.title || 'Position not available'}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Experience</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                    {candidate.experience || 'No experience information provided'}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Education</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {candidate.education || 'No education information provided'}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Skills</dt>
                  <dd className="mt-1">
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.map((skill: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>

                {candidate.certifications && candidate.certifications.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Certifications</dt>
                    <dd className="mt-1">
                      <div className="flex flex-wrap gap-1">
                        {candidate.certifications.map((cert: string, index: number) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500">Applied</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDistanceToNow(new Date(candidate.created_at), { addSuffix: true })}
                  </dd>
                </div>
              </dl>

              {candidate.notes && (
                <div className="mt-6">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                    {candidate.notes}
                  </dd>
                </div>
              )}
            </div>
          </div>

          {/* Email History */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Email History</h3>
              
              {emails && emails.length > 0 ? (
                <div className="space-y-4">
                  {emails.map((email: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{email.subject}</h4>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{email.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No emails sent to this candidate yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Status</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Add notes about this status change..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={updateStatusMutation.isPending || candidate.status === 'approved'}
                    className="inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {candidate.status === 'approved' ? 'Approved' : 'Approve'}
                  </button>
                  
                  <button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={updateStatusMutation.isPending || candidate.status === 'rejected'}
                    className="inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {candidate.status === 'rejected' ? 'Rejected' : 'Reject'}
                  </button>
                </div>

                {candidate.status === 'approved' && !interview && (
                  <button
                    onClick={handleScheduleInterview}
                    disabled={scheduleInterviewMutation.isPending}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {scheduleInterviewMutation.isPending ? 'Scheduling...' : 'Schedule Interview'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interview Information */}
          {interview && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Interview Details</h3>
                
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{interview.interview_type}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        interview.status === 'scheduled' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {interview.status}
                      </span>
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                    <dd className="mt-1 text-sm text-gray-900">{interview.location}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Communication */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Communication</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setEmailType('custom');
                    setShowEmailModal(true);
                  }}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Send Email
                </button>
                
                {candidate.status !== 'rejected' && (
                  <button
                    onClick={() => {
                      setEmailType('rejection');
                      setShowEmailModal(true);
                    }}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Send Rejection Email
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEmailModal(false)} />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Send Email to {candidate.name}
                </h3>
                
                <div className="space-y-4">
                  {emailType === 'custom' && (
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Email subject"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      {emailType === 'rejection' ? 'Additional Message (optional)' : 'Message'}
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder={emailType === 'rejection' 
                        ? 'Add any personalized message...'
                        : 'Enter your email message...'
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={sendEmailMutation.isPending || (emailType === 'custom' && (!customSubject || !customMessage))}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDetail;