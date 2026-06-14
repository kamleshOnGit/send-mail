import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Email, EmailDetails } from '../dataModel/email-details.model';

@Injectable({
  providedIn: 'root',
})
export class GmailService {
  private apiUrl = 'https://www.googleapis.com/gmail/v1/';
  private sheetsApiUrl = 'https://sheets.googleapis.com/v4/spreadsheets/';
  private userSetting =
    'https://www.googleapis.com/gmail/v1/users/me/settings/sendAs';

  constructor(private http: HttpClient) {}

  // Method to create the MIME email message and encode it
  private createEmailMessage(
    sender: string,
    recipient: string,
    subject: string,
    body: string,
    signature: string,
    cc?: string,
    bcc?: string
  ): string {
    const lines: string[] = [];

    // If a verified sendAs alias is provided, include the From header
    if (sender) {
      lines.push(`From: ${sender}`);
    }
    lines.push(`To: ${recipient}`);
    if (cc) lines.push(`Cc: ${cc}`);
    if (bcc) lines.push(`Bcc: ${bcc}`);
    lines.push(`Subject: ${subject}`);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');
    lines.push(`<div>${body}</div>`);
    lines.push(`<div>${signature}</div>`);

    return this.base64UrlEncode(lines.join('\n'));
  }

  // Helper method to encode a string to base64url format
  private base64UrlEncode(input: string): string {
    return btoa(unescape(encodeURIComponent(input)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
  }

  // Method to send an email
  sendEmail(
    sender: string,
    recipient: string,
    subject: string,
    body: string,
    signature: string,
    cc?: string,
    bcc?: string
  ): Observable<any> {
    const url = `${this.apiUrl}users/me/messages/send`;
    const emailMessage = this.createEmailMessage(
      sender,
      recipient,
      subject,
      body,
      signature,
      cc,
      bcc
    );
    return this.http.post(url, { raw: emailMessage }, { headers: this.getAuthHeaders() });
  }

  // Fetch all sendAs addresses (logged-in address + any verified aliases)
  getSendAsAddresses(): Observable<any> {
    return this.http.get<any>(this.userSetting, {
      headers: { Authorization: `Bearer ${this.getAccessToken()}` },
    });
  }

  // Keep old name as alias so existing effect calls still work
  getSignatures(): Observable<any> {
    return this.getSendAsAddresses();
  }

  updateSignature(sendAsEmail: string, signature: string): Observable<any> {
    const updateData = { sendAsEmail: { signature } };
    return this.http.put<any>(
      `${this.userSetting}/${sendAsEmail}`,
      updateData,
      { headers: { Authorization: `Bearer ${this.getAccessToken()}` } }
    );
  }

  // Method to get Google Sheets data
  getSheetData(spreadsheetId: string, range: string): Observable<any> {
    const url = `${this.sheetsApiUrl}${spreadsheetId}/values/${range}`;
    return this.http.get(url, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getAccessToken()}` }),
    });
  }

  updateSheetData(
    spreadsheetId: string,
    range: string,
    body: any
  ): Observable<any> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    return this.http.put(url, body, { headers: this.getAuthHeaders() });
  }

  // Method to get user's emails, 50 items per call
  getEmails(
    nextPageToken?: string,
    label: 'inbox' | 'sent' | 'trash' | 'draft' = 'inbox'
  ): Observable<any> {
    const labelIdsMap = {
      inbox: 'INBOX',
      sent: 'SENT',
      trash: 'TRASH',
      draft: 'DRAFT',
    };
    let url = `${this.apiUrl}users/me/messages?maxResults=50&labelIds=${labelIdsMap[label]}`;
    if (nextPageToken) url += `&pageToken=${nextPageToken}`;

    return this.http.get(url, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getAccessToken()}` }),
    });
  }

  // Method to get a specific email by ID
  getEmailById(emailId: string): Observable<EmailDetails> {
    const url = `${this.apiUrl}users/me/messages/${emailId}`;
    return this.http.get<EmailDetails>(url, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getAccessToken()}` }),
    });
  }

  // Fetch attachment metadata
  getAttachmentMetadata(emailId: string, attachmentId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${emailId}/attachments/${attachmentId}`,
      { headers: { Authorization: `Bearer ${this.getAccessToken()}` } }
    );
  }

  getAttachmentData(attachmentId: string, messageId: string): Observable<Blob> {
    const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`;
    return this.http.get(url, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getAccessToken()}` }),
      responseType: 'blob',
    });
  }

  getAttachmentUrl(attachment: any, email: any): string {
    return `https://www.googleapis.com/gmail/v1/users/me/messages/${email.id}/attachments/${attachment.attachmentId}?access_token=${this.getAccessToken()}`;
  }

  // Method to modify labels on an email
  modifyEmailLabels(
    emailId: string,
    labelsToAdd: string[],
    labelsToRemove: string[]
  ): Observable<any> {
    const url = `${this.apiUrl}users/me/messages/${emailId}/modify`;
    return this.http.post(
      url,
      { addLabelIds: labelsToAdd, removeLabelIds: labelsToRemove },
      { headers: this.getAuthHeaders() }
    );
  }

  // Method to delete an email
  deleteEmail(emailId: string): Observable<any> {
    const url = `${this.apiUrl}users/me/messages/${emailId}`;
    return this.http.delete(url, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getAccessToken()}` }),
    });
  }

  // Method to list all labels
  listLabels(): Observable<any> {
    const url = `${this.apiUrl}users/me/labels`;
    return this.http.get(url, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getAccessToken()}` }),
    });
  }

  // Method to get a specific label by ID
  getLabelById(labelId: string): Observable<any> {
    const url = `${this.apiUrl}users/me/labels/${labelId}`;
    return this.http.get(url, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getAccessToken()}` }),
    });
  }

  // Method to delete emails by selected IDs
  deleteEmailsByIds(emailIds: string[]): Observable<any> {
    const url = `${this.apiUrl}users/me/messages/batchDelete`;
    return this.http.post(url, { ids: emailIds }, { headers: this.getAuthHeaders() });
  }

  // Method to mark emails as read by selected IDs
  markEmailsAsRead(emailIds: string[]): Observable<any> {
    const url = `${this.apiUrl}users/me/messages/batchModify`;
    return this.http.post(
      url,
      { ids: emailIds, removeLabelIds: ['UNREAD'] },
      { headers: this.getAuthHeaders() }
    );
  }

  // Method to mark emails as unread by selected IDs
  markEmailsAsUnread(emailIds: string[]): Observable<any> {
    const url = `${this.apiUrl}users/me/messages/batchModify`;
    return this.http.post(
      url,
      { ids: emailIds, addLabelIds: ['UNREAD'] },
      { headers: this.getAuthHeaders() }
    );
  }

  // Method to archive emails by removing 'INBOX' label
  batchArchiveEmails(emailIds: string[]): Observable<any> {
    const url = `${this.apiUrl}users/me/messages/batchModify`;
    return this.http.post(
      url,
      { ids: emailIds, removeLabelIds: ['INBOX'] },
      { headers: this.getAuthHeaders() }
    );
  }

  getAccessToken(): string {
    return localStorage.getItem('access_token') || '';
  }
}
