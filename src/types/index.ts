export interface CVData {
  fileName: string;
  content: string;
  fileType: 'pdf' | 'docx' | 'txt';
}

export interface JobDescription {
  title: string;
  description: string;
  personSpec?: string;
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
