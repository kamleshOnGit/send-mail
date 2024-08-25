import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Email } from './email-details';

@Injectable({
  providedIn: 'root',
})
export class GmailService {
  private apiUrl = 'https://www.googleapis.com/gmail/v1/';

  constructor(private http: HttpClient) {}

  // Method to send an email
  sendEmail(message: any): Observable<any> {
    const url = `${this.apiUrl}users/me/messages/send`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.post(url, message, { headers });
  }

  // Method to get user's emails
  getEmails(nextPageToken?: string): Observable<any> {
    let url = `${this.apiUrl}users/me/messages`;
    if (nextPageToken) {
      url += `?pageToken=${nextPageToken}`;
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.get(url, { headers });
  }

  // Method to get a specific email by ID
  getEmailById(emailId: string): Observable<Email> {
    const url = `${this.apiUrl}users/me/messages/${emailId}`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.get<Email>(url, { headers });
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
