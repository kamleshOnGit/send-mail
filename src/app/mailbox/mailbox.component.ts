import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FooterComponent } from '../shared/footer/footer.component';
import { HeaderComponent } from '../shared/header/header.component';
import { GmailService } from '../services/gmail.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-mailbox',
  standalone: true,
  providers: [AuthService],
  templateUrl: './mailbox.component.html',
  styleUrl: './mailbox.component.css',
  imports: [FooterComponent, HeaderComponent, CommonModule],
})
export class MailboxComponent {
  emails: any[] = [];
  loading: boolean = true;
  nextPageToken: any;
  constructor(private gmailService: GmailService, private router: Router) {}

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.fetchEmails();
  }

  fetchEmails(nextPageToken?: string): void {
    this.gmailService.getEmails().subscribe((response: any) => {
      // Check if there is a nextPageToken, and if so, fetch the next page
      // if (response.nextPageToken) {
      //   this.fetchEmails(response.nextPageToken);
      // }
      this.nextPageToken = response.nextPageToken;
      const emailIds = response.messages.map((message: any) => message.id);
      this.fetchEmailDetails(emailIds);
    });
  }

  async fetchEmailDetails(emailIds: string[]): Promise<void> {
    const emailDetails: any[] = [];

    for (const emailId of emailIds) {
      try {
        const email = await this.gmailService.getEmailById(emailId).toPromise();
        emailDetails.push({
          id: email?.id,
          subject: this.getHeaderValue(email?.payload?.headers, 'Subject'),
          // other fields...
        });
        this.emails = emailDetails;
        this.loading = false;
        // Delay between requests (e.g., 500ms)
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(
          `Failed to fetch details for email ID: ${emailId}`,
          error
        );
        // Optional: Retry logic can be added here
      }
    }

    // this.emails = emailDetails;
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
