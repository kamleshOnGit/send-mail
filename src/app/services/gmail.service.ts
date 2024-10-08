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
    recipient: string,
    subject: string,
    body: string,
    signature: string
  ): string {
    const emailLines = [
      `To: ${recipient}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      `<div>${body}</div>`, // Wrap body content in a div to support HTML
      `<div>${signature}</div>`, // Wrap signature in a div for HTML content
    ].join('\n');

    // Encode the MIME message in base64url format
    const encodedEmail = this.base64UrlEncode(emailLines);

    return encodedEmail;
  }

  // Helper method to encode a string to base64url format
  private base64UrlEncode(input: string): string {
    return btoa(unescape(encodeURIComponent(input)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  // Method to send an email
  sendEmail(
    sender: string,
    recipient: string,
    subject: string,
    body: string,
    signature: string
  ): Observable<any> {
    const url = `${this.apiUrl}users/me/messages/send`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getAccessToken()}`, // Assumes you have a method to get the access token
    });

    // Create email message payload
    const emailMessage = this.createEmailMessage(
      recipient,
      subject,
      body,
      signature
    );

    // Send the POST request with the encoded email message
    return this.http.post(url, { raw: emailMessage }, { headers });
  }

  getSignatures(): Observable<any> {
    return this.http.get<any>(`${this.userSetting}`, {
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });
  }

  updateSignature(sendAsEmail: string, signature: string): Observable<any> {
    const updateData = {
      sendAsEmail: {
        signature: signature,
      },
    };

    return this.http.put<any>(
      `${this.userSetting}/${sendAsEmail}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
  }

  // Method to get Google Sheets data
  getSheetData(spreadsheetId: string, range: string): Observable<any> {
    const url = `${this.sheetsApiUrl}${spreadsheetId}/values/${range}`;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`, // Assumes you have a method to get the access token
    });

    return this.http.get(url, { headers });
  }

  updateSheetData(
    spreadsheetId: string,
    range: string,
    body: any
  ): Observable<any> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`, // Include access token in Authorization header
      'Content-Type': 'application/json',
    });

    return this.http.put(url, body, { headers });
  }

  // Method to get user's emails, 50 items per call
  getEmails(
    nextPageToken?: string,
    label: 'inbox' | 'sent' | 'trash' | 'draft' = 'inbox'
  ): Observable<any> {
    let url = `${this.apiUrl}users/me/messages?maxResults=50`; // Set maxResults to 50
    if (nextPageToken) {
      url += `&pageToken=${nextPageToken}`;
    }
    const labelIdsMap = {
      inbox: 'INBOX',
      sent: 'SENT',
      trash: 'TRASH',
      draft: 'DRAFT',
    };

    const labelId = labelIdsMap[label];
    url += `&labelIds=${labelId}`; // Add label to the API cal

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.get(url, { headers });
  }

  // Method to get a specific email by ID
  getEmailById(emailId: string): Observable<EmailDetails> {
    const url = `${this.apiUrl}users/me/messages/${emailId}`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.get<EmailDetails>(url, { headers });
  }

  // Fetch attachment metadata
  getAttachmentMetadata(
    emailId: string,
    attachmentId: string
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${emailId}/attachments/${attachmentId}`,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
  }

  getAttachmentData(attachmentId: string, messageId: string): Observable<Blob> {
    console.log(messageId, attachmentId);
    const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
      'Content-Type': 'application/json',
    });

    return this.http.get(url, { headers, responseType: 'blob' });
  }

  getAttachmentUrl(attachment: any, email: any): string {
    // Construct the URL for downloading the attachment
    return `https://www.googleapis.com/gmail/v1/users/me/messages/${
      email.id
    }/attachments/${
      attachment.attachmentId
    }?access_token=${this.getAccessToken()}`;
  }

  // Method to modify labels on an email
  modifyEmailLabels(
    emailId: string,
    labelsToAdd: string[],
    labelsToRemove: string[]
  ): Observable<any> {
    const url = `${this.apiUrl}users/me/messages/${emailId}/modify`;
    const requestBody = {
      addLabelIds: labelsToAdd,
      removeLabelIds: labelsToRemove,
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.post(url, requestBody, { headers });
  }

  // Method to delete an email
  deleteEmail(emailId: string): Observable<any> {
    const url = `${this.apiUrl}users/me/messages/${emailId}`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.delete(url, { headers });
  }

  // Method to list all labels
  listLabels(): Observable<any> {
    const url = `${this.apiUrl}users/me/labels`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.get(url, { headers });
  }

  // Method to get a specific label by ID
  getLabelById(labelId: string): Observable<any> {
    const url = `${this.apiUrl}users/me/labels/${labelId}`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.get(url, { headers });
  }

  // Method to delete emails by selected IDs
  deleteEmailsByIds(emailIds: string[]): Observable<any> {
    const url = `${this.apiUrl}users/me/messages/batchDelete`;
    const requestBody = {
      ids: emailIds,
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.post(url, requestBody, { headers });
  }

  // Method to mark emails as unread by selected IDs
  markEmailsAsUnread(emailIds: string[]): Observable<any> {
    const url = `${this.apiUrl}users/me/messages/batchModify`;
    const requestBody = {
      ids: emailIds,
      removeLabelIds: ['UNREAD'], // Remove the UNREAD label to mark as unread
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.post(url, requestBody, { headers });
  }

  // Method to get access token from local storage
  private getAccessToken(): string {
    // Retrieve the access token from local storage
    return localStorage.getItem('access_token') || '';
  }
}
