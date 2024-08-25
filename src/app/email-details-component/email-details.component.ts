import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GmailService } from '../services/gmail.service';
import { FooterComponent } from '../shared/footer/footer.component';
import { HeaderComponent } from '../shared/header/header.component';
import { CommonModule } from '@angular/common';
import {
  AttachmentMetadata,
  Email,
  EmailPart,
} from '../dataModel/email-details.model';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import sanitizeHtml from 'sanitize-html';
import * as he from 'he';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-email-details-component',
  standalone: true,
  templateUrl: './email-details.component.html',
  styleUrl: './email-details.component.css',
  imports: [FooterComponent, HeaderComponent, CommonModule],
})
export class EmailDetailsComponent implements OnInit {
  email?: Email;
  from?: string;
  subject?: string;
  date?: string;
  bodyContent?: string;
  loading: boolean = true;
  attachments: any; // Array to hold attachment metadata

  constructor(
    private route: ActivatedRoute,
    private gmailService: GmailService
  ) {}

  ngOnInit() {
    const emailId: any = this.route.snapshot.paramMap.get('id');
    this.fetchEmailDetails(emailId);
  }

  fetchEmailDetails(emailId: string) {
    this.gmailService.getEmailById(emailId).subscribe(
      (response) => {
        this.email = response;
        this.extractEmailDetails();
        this.extractAttachments(response);
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching email details', error);
        this.loading = false;
      }
    );
  }

  getAttachmentUrl(attachment: any): string {
    // Construct the URL for downloading the attachment
    if (this.email) {
      return `https://www.googleapis.com/gmail/v1/users/me/messages/${
        this.email.id
      }/attachments/${
        attachment.attachmentId
      }?access_token=${localStorage.getItem('access_token')}`;
    } else {
      return '';
    }
  }

  extractAttachments(email: any): void {
    if (email.payload.parts) {
      const attachmentRequests: Observable<any>[] = email.payload.parts
        .filter(
          (part: { [x: string]: any; mimeType: string }) =>
            part.mimeType === 'application/pdf' && part['body']?.attachmentId
        )
        .map((part: { body: { attachmentId: any } }) =>
          this.gmailService.getAttachmentMetadata(
            email.id,
            part.body.attachmentId
          )
        );

      if (attachmentRequests.length) {
        forkJoin(attachmentRequests).subscribe((attachmentData: any[]) => {
          this.attachments = attachmentData.map((data) => ({
            filename: data.filename,
            mimeType: data.mimeType,
            size: data.size,
          }));
        });
      }
    }
  }

  extractEmailDetails() {
    if (this.email?.payload) {
      console.log(this.email.payload);
      const headers = this.email.payload.headers;
      this.from = headers.find((header) => header.name === 'From')?.value;
      this.subject = headers.find((header) => header.name === 'Subject')?.value;
      this.date = headers.find((header) => header.name === 'Date')?.value;
      this.attachments = this.getAttachments(
        this.email.payload.parts,
        this.email.id
      );
      this.bodyContent = this.getBodyContent(
        this.email.payload.parts,
        this.email.payload.body
      );
    }
  }

  getBodyContent(parts: EmailPart[] | undefined, body: any): string {
    // Log parts and body for debugging
    console.log('Parts:', parts);
    console.log('Body:', body);

    // If there's a body directly in the payload
    if (body && body.data) {
      return this.base64UrlToBase64(body.data);
    }

    // If there are parts available
    if (parts && parts.length > 0) {
      // Find and decode the HTML part
      const htmlPart = parts.find(
        (part) => part.mimeType === 'text/html' && !part.filename
      );
      if (htmlPart && htmlPart.body && htmlPart.body.data) {
        return this.base64UrlToBase64(htmlPart.body.data);
      }

      // Find and decode the text part (if HTML part is not found)
      const textPart = parts.find(
        (part) => part.mimeType === 'text/plain' && !part.filename
      );
      if (textPart && textPart.body && textPart.body.data) {
        return this.base64UrlToBase64(textPart.body.data);
      }
    }

    // Default return if no content found
    return 'No content available';
  }

  // Convert base64url to base64
  base64UrlToBase64(base64Url: string): string {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    switch (base64.length % 4) {
      case 0:
        break;
      case 2:
        base64 += '==';
        break;
      case 3:
        base64 += '=';
        break;
      default:
        throw new Error('Illegal base64url string!');
    }
    return atob(base64);
  }

  getAttachments(
    parts: EmailPart[] | undefined,
    messageId: string
  ): Observable<AttachmentMetadata[]> {
    if (!parts) {
      return of([]);
    }

    const attachmentRequests = parts
      .filter((part) => part.filename && part.attachmentId)
      .map((part) => {
        console.log(part.attachmentId, messageId);
        return this.gmailService
          .getAttachmentData(part.attachmentId, messageId)
          .pipe(
            switchMap((response) => {
              const data = response;
              return of({
                filename: part.filename,
                mimeType: part.mimeType,
                size: part.size,
                // data: this.base64UrlToBase64(data),
                data: data,
              });
            }),
            catchError(() => of(null))
          );
      });

    return forkJoin(attachmentRequests).pipe(
      map(
        (results) =>
          results.filter((result) => result !== null) as AttachmentMetadata[]
      )
    );
  }
}
