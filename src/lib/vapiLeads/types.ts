export type VapiLeadPayload = {
  contact_reason: string;
  name: string;
  phone_number: string;
  address?: string;
  equipment_type?: string;
  brand?: string;
  issue_details?: string;
  preferred_time?: string;
  other_inquiries?: string;
};

export type SanitizedVapiLead = {
  contact_reason: string;
  name: string;
  phone_number: string;
  address: string;
  equipment_type: string;
  brand: string;
  issue_details: string;
  preferred_time: string;
  other_inquiries: string;
};

export type VapiLeadApiSuccess = {
  success: true;
  message: string;
  leadId?: string;
  action?: "created" | "updated";
};

export type VapiLeadApiError = {
  success: false;
  message: string;
};

export type VapiLeadApiResponse = VapiLeadApiSuccess | VapiLeadApiError;
