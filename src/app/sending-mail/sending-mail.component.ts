import { Component } from '@angular/core';
import { HeaderComponent } from '../shared/header/header.component';
import { FooterComponent } from '../shared/footer/footer.component';
import { GmailService } from '../services/gmail.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { concatMap, delay, from, Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import {
  loadSheetData,
  sendEmail,
  setEmailSendingStatus,
  updateSpreadsheetId,
} from '../dataStore/actions';
import {
  selectEmailSendingStatus,
  selectLoadingSheetData,
  selectSendingEmail,
  selectSheetData,
} from '../dataStore/selector';

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
  signature = '';
  spreadsheetId = ''; // The Google Spreadsheet ID
  spreadsheetUrl = ''; // The Google Spreadsheet ID
  sheetRange = 'Mailing!A2:E'; // Assuming columns are in A2:D (Sender, Recipient, Subject, Body)
  loadingSheetData$: Observable<boolean> | undefined;
  sendingEmail$: Observable<boolean> | undefined;
  emailSendingStatus$: Observable<{ [key: string]: string }> | undefined;
  sheetData$: Observable<string[][]> | undefined;
  isButtonDisabled: boolean = true;

  constructor(private gmailService: GmailService, private store: Store) {}

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    // Subscribe to sheet data in the component

    this.sheetData$ = this.store.select(selectSheetData);
    this.loadingSheetData$ = this.store.select(selectLoadingSheetData);
    this.sendingEmail$ = this.store.select(selectSendingEmail);
    this.emailSendingStatus$ = this.store.select(selectEmailSendingStatus);
    this.store.select(selectSheetData).subscribe((rows) => {
      if (rows && rows.length) {
        from(rows)
          .pipe(
            concatMap((row: any, i: number) => {
              if (row.length >= 4) {
                const [sender, recipient, subject, body, signature] = row;
                console.log(row);
                // Update compose box fields
                this.senderEmail = sender;
                this.recipientEmail = recipient;
                this.emailSubject = subject;
                this.emailBody = body;
                this.signature = signature;
                this.store.dispatch(
                  setEmailSendingStatus({ rowId: recipient, status: 'sending' })
                );
                // Simulate a random delay between 3 and 10 minutes
                const delayTime = this.getRandomDelay();

                return of(null).pipe(
                  delay(delayTime),
                  concatMap(() => {
                    // Dispatch sendEmail action instead of setting component properties
                    this.store.dispatch(
                      sendEmail({ sender, recipient, subject, body, signature })
                    );
                    return of(null); // Ensure an observable is returned
                  })
                );
              } else {
                return of(null);
              }
            })
          )
          .subscribe(
            () => console.log('Email sent successfully'),
            (error: any) => console.error('Error sending email', error)
          );
      }
    });
    // Subscribe to email sending status
    this.store.select(selectEmailSendingStatus).subscribe((status) => {
      console.log(
        status,
        Object.values(status).every((e) => e == 'success')
      );
      if (
        this.spreadsheetId.length == 0 &&
        Object.values(status).every((e) => e == 'success')
      ) {
        this.senderEmail = '';
        this.recipientEmail = '';
        this.emailSubject = '';
        this.emailBody = '';
        this.signature = '';
      }
      // const keys = Object.keys(status);
      // const values = Object.values(status);

      // if (keys.length > 0) {
      //   const email = keys[keys.length - 1]; // Get the email associated with the status
      //   const value = values[values.length - 1]; // Get the corresponding status

      //   // First, check if sheetData$ is defined and has values
      //   if (this.sheetData$) {
      //     this.sheetData$.subscribe((sheetData) => {
      //       if (sheetData && sheetData.length > 0) {
      //         // Ensure sheetData is not empty
      //         // Find the correct row index based on the email
      //         const rowIndex = sheetData.findIndex((row) => row[1] === email); // Assuming the recipient email is in column B

      //         // Check if rowIndex is valid and status is "success"
      //         if (rowIndex !== -1 && value === 'success') {
      //           console.log('Email sending status:', status, rowIndex, value);

      //           // Call updateSheetWithStatus to update the Google Sheet with status in column E
      //           this.updateSheetWithStatus(rowIndex + 2, value).subscribe(
      //             // Adding 2 because sheet rows are 1-indexed
      //             (response) => {
      //               console.log(
      //                 `Sheet updated for row ${rowIndex + 2}:`,
      //                 response
      //               );
      //             },
      //             (error) => {
      //               console.error(
      //                 `Failed to update sheet for row ${rowIndex + 2}:`,
      //                 error
      //               );
      //             }
      //           );
      //         } else if (rowIndex === -1) {
      //           console.error('Row index is not found for email:', email);
      //         } else if (value !== 'success') {
      //           console.warn(
      //             `Email status is ${value}, skipping sheet update.`
      //           );
      //         }
      //       } else {
      //         console.warn('Sheet data is empty.');
      //       }
      //     });
      //   } else {
      //     console.warn('sheetData$ is undefined.');
      //   }
      // }
    });
  }

  // updateSheetWithStatus(rowIndex: number, status: string): Observable<any> {
  //   const range = `Mailing!E${rowIndex}`; // Assuming status is written in column E
  //   const body = {
  //     values: [[status]], // Status is being written in the respective row
  //   };

  //   return this.gmailService.updateSheetData(this.spreadsheetId, range, body);
  // }

  extractSheetId(url: string): void {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const matches = url.match(regex);
    console.log(matches);
    if (matches && matches[1]) {
      const spreadsheetId = matches[1];
      this.spreadsheetId = spreadsheetId;
      this.store.dispatch(updateSpreadsheetId({ spreadsheetId: matches[1] }));
      console.log('Sheet ID:', spreadsheetId);
    } else {
      console.error('Invalid Google Sheet URL');
    }
  }

  // Dispatch the action to load sheet data
  loadSheetData(spreadsheetId: string, sheetRange: string) {
    this.store.dispatch(loadSheetData({ spreadsheetId, sheetRange }));
  }

  // Dispatch the action to send email
  sendEmail(
    sender: string,
    recipient: string,
    subject: string,
    body: string,
    signature: string
  ) {
    this.store.dispatch(
      sendEmail({ sender, recipient, subject, body, signature })
    );
  }

  // loadSheetData() {
  //   this.gmailService
  //     .getSheetData(this.spreadsheetId, this.sheetRange)
  //     .subscribe(
  //       (response) => {
  //         console.log('Sheet data:', response);
  //         // Process the rows here
  //         const rows = response.values;

  //         from(rows)
  //           .pipe(
  //             concatMap((row:any) => {
  //               if (row.length >= 4) {
  //                 const [sender, recipient, subject, body] = row;
  //                 // Update compose box fields
  //                 this.senderEmail = sender;
  //                 this.recipientEmail = recipient;
  //                 this.emailSubject = subject;
  //                 this.emailBody = body;

  //                 // Simulate a random delay between 3 and 10 minutes
  //                 const delayTime = this.getRandomDelay();

  //                 return of(null).pipe(
  //                   delay(delayTime),
  //                   concatMap(async () => this.sendEmails(
  //                     this.senderEmail,
  //                     this.recipientEmail,
  //                     this.emailSubject,
  //                     this.emailBody
  //                   )
  //                   )
  //                 );
  //               } else {
  //                 // Return an empty observable if the row does not have enough columns
  //                 return of(null);
  //               }
  //             })
  //           )
  //           .subscribe(
  //             () => console.log('Email sent successfully'),
  //             (error: any) => console.error('Error sending email', error)
  //           );
  //       },
  //       (error) => {
  //         console.error('Error fetching sheet data', error);
  //       }
  //     );
  // }

  // Helper method to get a random delay between 3 and 10 minutes
  private getRandomDelay(): number {
    const min = 0 * 60 * 1000; // 3 minutes in milliseconds
    const max = 1 * 60 * 1000; // 10 minutes in milliseconds
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // // Send emails for each row of data
  // sendEmails(sender: string, recipient: string, subject: string, body: string) {
  //   // Send email
  //   this.gmailService.sendEmail(sender, recipient, subject, body).subscribe(
  //     (response) => {
  //       console.log('Email sent successfully', response);
  //     },
  //     (error) => {
  //       console.error('Error sending email', error);
  //     }
  //   );
  // }
}
