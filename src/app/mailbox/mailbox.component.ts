import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FooterComponent } from '../shared/footer/footer.component';
import { HeaderComponent } from '../shared/header/header.component';
import { GmailService } from '../services/gmail.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, Observable, take, withLatestFrom } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { State } from '../dataStore/reducers';
import {
  loadEmails,
  loadEmailsSuccess,
  markAsRead,
  markAsUnread,
  paginateEmails,
  resetNextPrevToken,
  saveEmailDetails,
  toggleStar,
  updateCurrentPage,
  updateEmailInList,
} from '../dataStore/actions';
import { Email, EmailDetails } from '../dataModel/email-details.model';
import {
  selectHasEmails,
  selectAllEmails,
  selectEmailDetailsById,
  selectCurrentPage,
  selectHasNextPage,
  selectHasPrevPage,
  selectTotalPages,
  selectEmailsByLabel,
} from '../dataStore/selector';

@Component({
  selector: 'app-mailbox',
  standalone: true,
  providers: [AuthService],
  templateUrl: './mailbox.component.html',
  styleUrl: './mailbox.component.css',
  imports: [FooterComponent, HeaderComponent, CommonModule, RouterModule],
})
export class MailboxComponent {
  showDropdown: any;
  currentpage!: string;
  loading: boolean = true;
  nextPageToken: any;
  emails$: Observable<Email[]> | undefined;
  currentPage$!: Observable<number>;
  totalPages$: Observable<number> | undefined;
  hasNextPage$: Observable<boolean> | undefined;
  hasPrevPage$: Observable<boolean> | undefined;

  constructor(
    private gmailService: GmailService,
    private router: Router,
    private store: Store<State>
  ) {}

  ngOnInit(): void {
    this.store
      .pipe(
        select(selectAllEmails),
        withLatestFrom(this.store.select(selectCurrentPage))
      )
      .subscribe(([emails, currentPage]) => {
        if (emails.length === 0) {
          // Dispatch loadEmails action with the actual currentPage value
          this.store.dispatch(
            loadEmails({
              currentPage: currentPage,
              label: this.getValidLabel(this.router.url.slice(1)),
            })
          );

        } else {
          // Emails are already loaded, use the stored values
          this.emails$ = this.store.pipe(select(selectAllEmails));
          this.currentPage$ = this.store.pipe(select(selectCurrentPage));
          this.totalPages$ = this.store.pipe(select(selectTotalPages));
          this.hasNextPage$ = this.store.pipe(select(selectHasNextPage));
          this.hasPrevPage$ = this.store.pipe(select(selectHasPrevPage));
          this.loading = false;
          // this.currentRoute = this.router.url.slice(1);
        }
      });

    // this.store
    //   .pipe(
    //     select(
    //       selectEmailsByLabel(this.getValidLabel(this.router.url.slice(1)))
    //     ), // Select emails by the folder label
    //     withLatestFrom(this.store.select(selectCurrentPage)),
    //     take(1) // Only take the first emission and complete
    //   )
    //   .subscribe(([emails, currentPage]) => {
    //     if (!emails || emails.length === 0) {
    //       // No emails loaded for this label (folder), dispatch action
    //       this.store.dispatch(
    //         loadEmails({
    //           currentPage: currentPage,
    //           label: this.getValidLabel(this.router.url.slice(1)), // Pass the correct label
    //         })
    //       );
    //       console.log(
    //         this.emails$,
    //         this.getValidLabel(this.router.url.slice(1)).toUpperCase()
    //       );
    //     } else {
    //       console.log(
    //         this.emails$,
    //         this.getValidLabel(this.router.url.slice(1)).toUpperCase()
    //       );
    //       // Emails already loaded for this label, use stored values
    //       this.emails$ = this.store.pipe(
    //         select(
    //           selectEmailsByLabel(this.getValidLabel(this.router.url.slice(1)))
    //         )
    //       );
    //       this.currentPage$ = this.store.pipe(select(selectCurrentPage));
    //       this.totalPages$ = this.store.pipe(select(selectTotalPages));
    //       this.hasNextPage$ = this.store.pipe(select(selectHasNextPage));
    //       this.hasPrevPage$ = this.store.pipe(select(selectHasPrevPage));
    //       this.loading = false;
    //     }

    //   });

  }

  // fetchEmails(nextPageToken?: string): void {
  //   this.gmailService.getEmails().subscribe((response: any) => {
  //     // Check if there is a nextPageToken, and if so, fetch the next page
  //     // if (response.nextPageToken) {
  //     //   this.fetchEmails(response.nextPageToken);
  //     // }
  //     this.store.dispatch(loadEmailsSuccess({ emails: response }));
  //     this.nextPageToken = response.nextPageToken;
  //     const emailIds = response.messages.map((message: any) => message.id);
  //     this.fetchEmailDetails(emailIds);
  //   });
  // }

  navigateTo(folder: string) {
    this.loading = true
    this.store.dispatch(resetNextPrevToken({ nextPageToken: '',prevPageToken: ''}));
    const label = this.getValidLabel(folder);
    this.router.navigate([`/${folder}`]).then(() => {
      this.store.dispatch(
            loadEmails({
              currentPage: 0,
              label: this.getValidLabel(this.router.url.slice(1)),
            }) )
          });
  }

  getValidLabel(routeLabel: string): 'inbox' | 'sent' | 'trash' | 'draft' {
    const validLabels: {
      [key: string]: 'inbox' | 'sent' | 'trash' | 'draft';
    } = {
      inbox: 'inbox',
      sent: 'sent',
      trash: 'trash',
      draft: 'draft',
    };

    if (routeLabel in validLabels) {
      return validLabels[routeLabel];
    } else {
      throw new Error(`Invalid label: ${routeLabel}`); // Handle the invalid case as needed
    }
  }

  moveSelectedEmails() {
    throw new Error('Method not implemented.');
  }
  archiveSelectedEmails() {
    throw new Error('Method not implemented.');
  }
  deleteSelectedEmails() {
    throw new Error('Method not implemented.');
  }
  markSelectedAsSpam() {
    throw new Error('Method not implemented.');
  }
  markSelectedAsUnread() {
    throw new Error('Method not implemented.');
  }
  markSelectedAsRead() {
    throw new Error('Method not implemented.');
  }
  selectAllEmails($event: Event) {
    throw new Error('Method not implemented.');
  }
  selectEmail(arg0: string) {
    throw new Error('Method not implemented.');
  }

  onPageSelected(page: number): void {
    this.store.dispatch(updateCurrentPage({ currentPage: page }));
    this.store
      .pipe(select(selectCurrentPage))
      .subscribe((currentPage: number) => {
        this.store.dispatch(
          loadEmails({
            currentPage,
            label: this.getValidLabel(this.router.url.slice(1)),
          })
        );
      });
  }

  toggleStar(emailId: string) {
    this.store.dispatch(toggleStar({ emailId }));
  }

  markAsRead(emailId: string) {
    this.store.dispatch(markAsRead({ emailId }));
  }

  markAsUnread(emailId: string) {
    this.store.dispatch(markAsUnread({ emailId }));
  }

  nextPage() {
    this.store.dispatch(
      paginateEmails({
        direction: 'next',
        label: this.getValidLabel(this.router.url.slice(1)),
      })
    );
  }

  prevPage() {
    this.store.dispatch(
      paginateEmails({
        direction: 'prev',
        label: this.getValidLabel(this.router.url.slice(1)),
      })
    );
  }

  toggleDropdown(event: Event) {
    this.showDropdown = !this.showDropdown;
    event.stopPropagation();
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
                  payload: email?.payload || undefined,
                  label: '',
                  date: '',
                  isStarred: false,
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
