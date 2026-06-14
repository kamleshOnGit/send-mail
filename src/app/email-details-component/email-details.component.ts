import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GmailService } from '../services/gmail.service';
import { FooterComponent } from '../shared/footer/footer.component';
import { HeaderComponent } from '../shared/header/header.component';
import { CommonModule, Location } from '@angular/common';
import {
  AttachmentMetadata,
  Email,
  EmailDetails,
  EmailPart,
} from '../dataModel/email-details.model';
import { SafeHtml, DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import sanitizeHtml from 'sanitize-html';
import * as he from 'he';
import { catchError, forkJoin, map, Observable, of, switchMap, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { loadEmailDetails } from '../dataStore/actions';
import { selectEmailDetailsById, dataLoading } from '../dataStore/selector';
import { Subject } from 'rxjs';

import { DecodeHtmlPipe } from '../pipes/decode-html.pipe';

@Component({
  selector: 'app-email-details-component',
  standalone: true,
  templateUrl: './email-details.component.html',
  styleUrl: './email-details.component.css',
  imports: [FooterComponent, HeaderComponent, CommonModule, DecodeHtmlPipe],
})
export class EmailDetailsComponent implements OnInit, OnDestroy {
  email?: Email;
  from?: string;
  subject?: string;
  date?: string;
  bodyContent?: string;
  bodyContenturl?: SafeResourceUrl;
  loading: boolean = true;
  bodyLoading: boolean = true;
  attachments$!: Observable<AttachmentMetadata[]>;
  emailDetails$!: Observable<EmailDetails | undefined>;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gmailService: GmailService,
    private store: Store,
    private sanitizer: DomSanitizer,
    private location: Location
  ) {}

  goBack(): void {
    this.location.back();
  }

  getAvatarInitial(name: string | undefined): string {
    if (!name) return '?';
    const decoded = he.decode(name);
    return decoded.charAt(0).toUpperCase();
  }

  getAttachmentUrl(attachment: any): string {
    if (this.email) {
      return `https://www.googleapis.com/gmail/v1/users/me/messages/${
        this.email.id
      }/attachments/${
        attachment.attachmentId
      }?access_token=${localStorage.getItem('access_token')}`;
    }
    return '';
  }

  onBodyLoad(): void {
    this.bodyLoading = false;
  }

  ngOnInit() {
    const emailId: any = this.route.snapshot.paramMap.get('id');
    this.emailDetails$ = this.store.select(selectEmailDetailsById(emailId));
    this.emailDetails$.subscribe((emailDetails) => {
      if (emailDetails) {
        this.email = emailDetails;
        this.extractEmailDetails();
      } else {
        this.store.dispatch(loadEmailDetails({ emailId }));
      }
    });

    // Drive loading spinner from store
    this.store
      .select(dataLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => setTimeout(() => (this.loading = v), 100));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  extractEmailDetails() {
    if (this.email?.payload) {
      const headers = this.email.payload.headers;
      this.from = headers.find((header) => header.name === 'From')?.value;
      this.subject = headers.find((header) => header.name === 'Subject')?.value;
      this.date = headers.find((header) => header.name === 'Date')?.value;
      
      this.attachments$ = this.getAttachments(
        this.email.payload.parts,
        this.email.id
      );

      this.bodyContenturl = this.sanitizer.bypassSecurityTrustResourceUrl(
        'data:text/html;charset=utf-8,' +
          encodeURIComponent(
            this.getBodyContent(
              this.email.payload.parts,
              this.email.payload.body
            )
          )
      );
      this.bodyLoading = true;
      this.loading = false;
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

  replyToEmail(): void {
    if (!this.email) return;
    this.router.navigate(['/mailing'], {
      queryParams: {
        to: this.from,
        subject: this.subject ? `Re: ${this.subject}` : undefined,
      },
    });
  }
}
