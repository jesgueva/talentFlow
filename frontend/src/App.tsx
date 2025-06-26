import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import JobList from './components/jobs/JobList';
import JobDetail from './components/jobs/JobDetail';
import CandidateList from './components/candidates/CandidateList';
import CandidateDetail from './components/candidates/CandidateDetail';
import InterviewList from './components/interviews/InterviewList';
import Layout from './components/layout/Layout';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/jobs" element={
                <ProtectedRoute>
                  <Layout>
                    <JobList />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/jobs/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <JobDetail />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/candidates" element={
                <ProtectedRoute>
                  <Layout>
                    <CandidateList />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/candidates/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <CandidateDetail />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/interviews" element={
                <ProtectedRoute>
                  <Layout>
                    <InterviewList />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
