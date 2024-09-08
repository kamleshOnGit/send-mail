import { Component } from '@angular/core';
import { HeaderComponent } from '../shared/header/header.component';
import { FooterComponent } from '../shared/footer/footer.component';
import { GmailService } from '../services/gmail.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { concatMap, delay, from, of } from 'rxjs';

@Component({
  selector: 'app-sending-mail',
  standalone: true,
  templateUrl: './sending-mail.component.html',
  styleUrl: './sending-mail.component.css',
  imports: [HeaderComponent, FooterComponent, CommonModule, FormsModule],
})
export class SendingMailComponent {
  senderEmail = '';
  recipientEmail = '';
  emailSubject = '';
  emailBody = '';
  spreadsheetId = ''; // The Google Spreadsheet ID
  spreadsheetUrl = ''; // The Google Spreadsheet ID
  sheetRange = 'Mailing!A2:D'; // Assuming columns are in A2:D (Sender, Recipient, Subject, Body)
  constructor(private gmailService: GmailService) {}

  extractSheetId(url: string): void {
    // Regular expression to extract the Sheet ID from the URL
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const matches = url.match(regex);

    if (matches && matches[1]) {
      this.spreadsheetId = matches[1]; // Extracted Sheet ID
      console.log('Sheet ID:', this.spreadsheetId);
    } else {
      console.error('Invalid Google Sheet URL');
    }
  }

  loadSheetData() {
    this.gmailService
      .getSheetData(this.spreadsheetId, this.sheetRange)
      .subscribe(
        (response) => {
          console.log('Sheet data:', response);
          // Process the rows here
          const rows = response.values;

          from(rows)
            .pipe(
              concatMap((row:any) => {
                if (row.length >= 4) {
                  const [sender, recipient, subject, body] = row;
                  // Update compose box fields
                  this.senderEmail = sender;
                  this.recipientEmail = recipient;
                  this.emailSubject = subject;
                  this.emailBody = body;

                  // Simulate a random delay between 3 and 10 minutes
                  const delayTime = this.getRandomDelay();

                  return of(null).pipe(
                    delay(delayTime),
                    concatMap(async () => this.sendEmails(
                      this.senderEmail,
                      this.recipientEmail,
                      this.emailSubject,
                      this.emailBody
                    )
                    )
                  );
                } else {
                  // Return an empty observable if the row does not have enough columns
                  return of(null);
                }
              })
            )
            .subscribe(
              () => console.log('Email sent successfully'),
              (error: any) => console.error('Error sending email', error)
            );
        },
        (error) => {
          console.error('Error fetching sheet data', error);
        }
      );
  }


  // Helper method to get a random delay between 3 and 10 minutes
  private getRandomDelay(): number {
    const min = 1 * 60 * 1000; // 3 minutes in milliseconds
    const max = 2 * 60 * 1000; // 10 minutes in milliseconds
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Send emails for each row of data
  sendEmails(sender: string, recipient: string, subject: string, body: string) {
    // Send email
    this.gmailService.sendEmail(sender, recipient, subject, body).subscribe(
      (response) => {
        console.log('Email sent successfully', response);
      },
      (error) => {
        console.error('Error sending email', error);
      }
    );
  }
}
