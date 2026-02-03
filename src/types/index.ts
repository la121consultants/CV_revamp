export interface CVData {
  fileName: string;
  content: string;
  fileType: 'pdf' | 'docx' | 'txt';
}

export interface JobDescription {
  title: string;
  description: string;
  personSpec?: string;
  linkedinUrl?: string;
}

export interface UserDetails {
  fullName: string;
  email: string;
  phone: string;
}

export interface TailoredOutput {
  cv: string;
  coverLetter: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export type OutputType = 'cv' | 'coverLetter' | 'both';

export interface UserSubmission {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  job_title: string;
  job_description: string;
  person_spec: string | null;
  linkedin_url: string | null;
  cv_filename: string | null;
  output_type: string;
  created_at: string;
}
