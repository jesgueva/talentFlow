import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { jobsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: () => void;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onJobCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    description: '',
    required_skills: '',
    preferred_skills: '',
    min_experience_years: 0,
    education_level: '',
    certifications: '',
  });

  const createJobMutation = useMutation({
    mutationFn: (jobData: any) => jobsAPI.createJob(jobData),
    onSuccess: () => {
      toast.success('Job created successfully!');
      onJobCreated();
      setFormData({
        title: '',
        department: '',
        description: '',
        required_skills: '',
        preferred_skills: '',
        min_experience_years: 0,
        education_level: '',
        certifications: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create job');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const jobData = {
      ...formData,
      required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(s => s),
      preferred_skills: formData.preferred_skills.split(',').map(s => s.trim()).filter(s => s),
      certifications: formData.certifications.split(',').map(s => s.trim()).filter(s => s),
    };

    createJobMutation.mutate(jobData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'min_experience_years' ? parseInt(value) || 0 : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Create New Job
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          Job Title *
                        </label>
                        <input
                          type="text"
                          name="title"
                          id="title"
                          required
                          value={formData.title}
                          onChange={handleChange}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="e.g. Senior Software Engineer"
                        />
                      </div>

                      <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                          Department *
                        </label>
                        <input
                          type="text"
                          name="department"
                          id="department"
                          required
                          value={formData.department}
                          onChange={handleChange}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="e.g. Engineering"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Job Description *
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        required
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Describe the role, responsibilities, and requirements..."
                      />
                    </div>

                    <div>
                      <label htmlFor="required_skills" className="block text-sm font-medium text-gray-700">
                        Required Skills *
                      </label>
                      <input
                        type="text"
                        name="required_skills"
                        id="required_skills"
                        required
                        value={formData.required_skills}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="e.g. Python, React, Node.js (comma-separated)"
                      />
                    </div>

                    <div>
                      <label htmlFor="preferred_skills" className="block text-sm font-medium text-gray-700">
                        Preferred Skills
                      </label>
                      <input
                        type="text"
                        name="preferred_skills"
                        id="preferred_skills"
                        value={formData.preferred_skills}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="e.g. AWS, Docker, Kubernetes (comma-separated)"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="min_experience_years" className="block text-sm font-medium text-gray-700">
                          Minimum Experience (years)
                        </label>
                        <input
                          type="number"
                          name="min_experience_years"
                          id="min_experience_years"
                          min="0"
                          value={formData.min_experience_years}
                          onChange={handleChange}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="education_level" className="block text-sm font-medium text-gray-700">
                          Education Level
                        </label>
                        <select
                          name="education_level"
                          id="education_level"
                          value={formData.education_level}
                          onChange={handleChange}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="">Select education level</option>
                          <option value="High School">High School</option>
                          <option value="Associate Degree">Associate Degree</option>
                          <option value="Bachelor's Degree">Bachelor's Degree</option>
                          <option value="Master's Degree">Master's Degree</option>
                          <option value="PhD">PhD</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="certifications" className="block text-sm font-medium text-gray-700">
                        Certifications
                      </label>
                      <input
                        type="text"
                        name="certifications"
                        id="certifications"
                        value={formData.certifications}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="e.g. AWS Certified, PMP (comma-separated)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={createJobMutation.isPending}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateJobModal;