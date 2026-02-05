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

export type DocumentKind = 'cv' | 'coverLetter';

export type DocumentRenderFormat = 'docx' | 'pdf';

export type CVStyle = 'standard' | 'aesthetic' | 'signature';

export interface DocumentHeader {
  name: string;
  phone: string;
  email: string;
  role: string;
}

export interface DocumentSection {
  title: string;
  paragraphs: string[];
  bullets: string[];
}

export interface CoverLetterModel {
  dateLine: string;
  greeting: string;
  paragraphs: string[];
  signOff: string;
  signature: string;
}

export interface DocumentModel {
  id: string;
  kind: DocumentKind;
  title: string;
  sections: DocumentSection[];
  header?: DocumentHeader;
  style?: CVStyle;
  coverLetter?: CoverLetterModel;
  rawText: string;
}

export interface RenderedDocument {
  id: string;
  ownerId: string;
  format: DocumentRenderFormat;
  fileName: string;
  blob: Blob;
  createdAt: number;
  cacheKey: string;
}

export type ChatMode = 'instant' | 'confirm';

export interface PendingChatAction {
  id: string;
  message: string;
  summary: string[];
  createdAt: number;
  expiresAt: number;
}

export interface UserSubmission {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  target_role: string | null;
  job_title: string;
  job_description: string;
  person_spec: string | null;
  cv_filename: string | null;
  cv_text: string | null;
  service_type: string | null;
  status: string | null;
  internal_notes: string | null;
  output_type: string;
  created_at: string;
}
