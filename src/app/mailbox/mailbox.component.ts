import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FooterComponent } from '../shared/footer/footer.component';
import { HeaderComponent } from '../shared/header/header.component';
import { GmailService } from '../services/gmail.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { State } from '../dataStore/reducers';
import {
  loadEmails,
  loadEmailsSuccess,
  saveEmailDetails,
  updateEmailInList,
} from '../dataStore/actions';
import { Email, EmailDetails } from '../dataModel/email-details.model';
import {
  selectHasEmails,
  selectAllEmails,
  selectEmailDetailsById,
} from '../dataStore/selector';

@Component({
  selector: 'app-mailbox',
  standalone: true,
  providers: [AuthService],
  templateUrl: './mailbox.component.html',
  styleUrl: './mailbox.component.css',
  imports: [FooterComponent, HeaderComponent, CommonModule],
})
export class MailboxComponent {
  loading: boolean = true;
  nextPageToken: any;
  emails$: Observable<Email[]> | undefined;
  constructor(
    private gmailService: GmailService,
    private router: Router,
    private store: Store<State>
  ) {}

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    // this.fetchEmails();
    this.store.pipe(select(selectAllEmails)).subscribe((emails) => {
      if (emails.length === 0) {
        // Dispatch loadEmails action to fetch emails from API
        this.store.dispatch(loadEmails());
      } else {
        // Emails are already loaded
        this.emails$ = this.store.pipe(select(selectAllEmails));
        this.loading = false;
      }
    });
  }

  fetchEmails(nextPageToken?: string): void {
    this.gmailService.getEmails().subscribe((response: any) => {
      // Check if there is a nextPageToken, and if so, fetch the next page
      // if (response.nextPageToken) {
      //   this.fetchEmails(response.nextPageToken);
      // }
      this.store.dispatch(loadEmailsSuccess({ emails: response }));
      this.nextPageToken = response.nextPageToken;
      const emailIds = response.messages.map((message: any) => message.id);
      this.fetchEmailDetails(emailIds);
    });
  }

  // async fetchEmailDetails(emailIds: string[]): Promise<void> {
  //   const emailDetails: any[] = [];

  //   for (const emailId of emailIds) {
  //     try {
  //       const email = await this.gmailService.getEmailById(emailId).toPromise();
  //       const details: EmailDetails = {
  //         id: email?.id || '',
  //         historyId: email?.historyId || '',
  //         internalDate: email?.internalDate || 0,
  //         labelIds: email?.labelIds || [],
  //         sizeEstimate: email?.sizeEstimate || 0,
  //         snippet: email?.snippet || '',
  //         threadId: email?.threadId || '',
  //         payload: email?.payload || undefined,
  //         subject:
  //           this.getHeaderValue(email?.payload?.headers, 'Subject') || '',
  //       };

  //       emailDetails.push(details);
  //       this.store.dispatch(saveEmailDetails({ emailDetails: details }));
  //       this.store.dispatch(updateEmailInList({ email: details }));
  //       this.loading = false;
  //       // Delay between requests (e.g., 500ms)
  //       await new Promise((resolve) => setTimeout(resolve, 500));
  //     } catch (error) {
  //       console.error(
  //         `Failed to fetch details for email ID: ${emailId}`,
  //         error
  //       );
  //       // Optional: Retry logic can be added here
  //     }
  //   }

  //   // this.emails = emailDetails;
  // }

  fetchEmailDetails(emailIds: string[]) {
    emailIds.forEach((id) => {
      // Check if the email details are already in the store
      this.store
        .pipe(select(selectEmailDetailsById(id)))
        .subscribe((details) => {
          if (!details) {
            // Fetch details if not already in the store
            this.gmailService
              .getEmailById(id)
              .toPromise()
              .then((email) => {
                const emailDetails: EmailDetails = {
                  id: email?.id || '',
                  historyId: email?.historyId || '',
                  internalDate: email?.internalDate || 0,
                  labelIds: email?.labelIds || [],
                  sizeEstimate: email?.sizeEstimate || 0,
                  snippet: email?.snippet || '',
                  threadId: email?.threadId || '',
                  subject:
                    this.getHeaderValue(email?.payload?.headers, 'Subject') ||
                    '',
                };
                this.loading = false;
                this.store.dispatch(saveEmailDetails({ emailDetails }));
                this.store.dispatch(updateEmailInList({ email: details }));
              })
              .catch((error) =>
                console.error('Error fetching email details:', error)
              );
          }
        });
    });
  }

  getHeaderValue(headers: any[] | undefined, name: string): string {
    if (headers) {
      const header = headers.find((header) => header.name === name);
      return header ? header.value : 'No subject';
    } else {
      return 'No subject';
    }
  }

  viewEmail(emailId: string) {
    // Navigate to the email details component with the email ID
    // Assuming you have routing set up for email details
    this.router.navigate(['/inbox', emailId]);
  }
}
