import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  min_experience_years: number;
  education_level: string;
  certifications: string[];
  status: string;
  created_at: string;
  candidate_count?: number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  education: string;
  certifications: string[];
  job_id: string;
  job_title?: string;
  status: string;
  ranking_score?: number;
  ranking_details?: any;
  tier?: string;
  created_at: string;
  notes?: string;
}

export interface Interview {
  id: string;
  candidate_id: string;
  candidate_name?: string;
  candidate_email?: string;
  job_id: string;
  job_title?: string;
  interview_type: string;
  status: string;
  scheduled_time?: string;
  location: string;
  notes?: string;
  created_at: string;
}

export interface DashboardStats {
  total_jobs: number;
  total_candidates: number;
  scheduled_interviews: number;
  recent_candidates: Candidate[];
}

// Auth API
export const authAPI = {
  login: (email: string, password: string): Promise<AxiosResponse<{ access_token: string; user: User }>> =>
    api.post('/api/auth/login', { email, password }),
  
  getCurrentUser: (): Promise<AxiosResponse<User>> =>
    api.get('/api/auth/me'),
};

// Dashboard API
export const dashboardAPI = {
  getStats: (): Promise<AxiosResponse<DashboardStats>> =>
    api.get('/api/dashboard/stats'),
};

// Jobs API
export const jobsAPI = {
  getJobs: (status?: string): Promise<AxiosResponse<Job[]>> =>
    api.get('/api/jobs', { params: { status } }),
  
  getJob: (id: string): Promise<AxiosResponse<{ job: Job; candidates: Candidate[] }>> =>
    api.get(`/api/jobs/${id}`),
  
  createJob: (jobData: Partial<Job>): Promise<AxiosResponse<Job>> =>
    api.post('/api/jobs', jobData),
  
  uploadResumes: (jobId: string, files: FileList): Promise<AxiosResponse<{ message: string; processed_count: number }>> => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('resumes', file);
    });
    return api.post(`/api/jobs/${jobId}/upload-resumes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Candidates API
export const candidatesAPI = {
  getCandidates: (jobId?: string, status?: string): Promise<AxiosResponse<Candidate[]>> =>
    api.get('/api/candidates', { params: { job_id: jobId, status } }),
  
  getCandidate: (id: string): Promise<AxiosResponse<{ candidate: Candidate; interview?: Interview; emails: any[] }>> =>
    api.get(`/api/candidates/${id}`),
  
  updateCandidateStatus: (id: string, status: string, notes?: string): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/api/candidates/${id}/status`, { status, notes }),
};

// Interviews API
export const interviewsAPI = {
  getInterviews: (status?: string): Promise<AxiosResponse<Interview[]>> =>
    api.get('/api/interviews', { params: { status } }),
  
  scheduleInterview: (candidateId: string, interviewType: string, location: string): Promise<AxiosResponse<{ message: string; interview_id: string }>> =>
    api.post('/api/interviews', { candidate_id: candidateId, interview_type: interviewType, location }),
};

// Emails API
export const emailsAPI = {
  sendEmail: (candidateId: string, emailType: string, customMessage?: string, subject?: string): Promise<AxiosResponse<{ message: string }>> =>
    api.post('/api/emails/send', { candidate_id: candidateId, email_type: emailType, custom_message: customMessage, subject }),
};

export default api;