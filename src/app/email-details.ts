// email.model.ts
export interface Email {
  id: string;
  threadId: string;
  payload?: EmailPayload;
}

export interface EmailPayload {
  headers: EmailHeader[];
  parts?: EmailPart[];
  body: EmailBody;
}

export interface EmailHeader {
  name: string;
  value: string;
}

export interface EmailPart {
  attachmentId: any;
  size: any;
  filename: any;
  mimeType: string;
  body: EmailBody;
}

export interface EmailBody {
  data: string; // Base64 encoded string
}

export interface AttachmentMetadata {
  filename: string;
  mimeType: string;
  size: number;
  data: any; // base64 encoded data
}
