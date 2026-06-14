import { Component, OnDestroy, OnInit } from '@angular/core';
import { HeaderComponent } from '../shared/header/header.component';
import { FooterComponent } from '../shared/footer/footer.component';
import { GmailService } from '../services/gmail.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { concatMap, delay, Observable, of, Subject, Subscription } from 'rxjs';
import { from, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { EditorComponent } from '@tinymce/tinymce-angular';
import {
  cancelBulkSend,
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

export interface SendAsAddress {
  sendAsEmail: string;
  displayName?: string;
  isPrimary?: boolean;
  isDefault?: boolean;
  verificationStatus?: string;
}

@Component({
  selector: 'app-sending-mail',
  standalone: true,
  templateUrl: './sending-mail.component.html',
  styleUrl: './sending-mail.component.css',
  imports: [HeaderComponent, FooterComponent, CommonModule, FormsModule, EditorComponent],
})
export class SendingMailComponent implements OnInit, OnDestroy {
  // Form fields
  senderEmail = '';
  recipientEmail = '';
  ccEmail = '';
  bccEmail = '';
  emailSubject = '';
  emailBody = '';
  signature = '';
  showCc = false;
  showBcc = false;

  // Message type checkboxes
  useSimpleText = true;
  useHtmlTemplate = false;

  // TinyMCE configuration
  tinymceInit: Record<string, any> = {};

  // Google Sheets
  spreadsheetId = '';
  spreadsheetUrl = '';
  sheetRange = 'Mailing!A2:F'; // A=sender, B=recipient, C=subject, D=body, E=signature, F=status
  customSheetRange = ''; // let user override the range

  // sendAs aliases
  sendAsAddresses: SendAsAddress[] = [];
  loadingSendAs = false;
  sendAsError = '';

  // Store observables
  loadingSheetData$!: Observable<boolean>;
  sendingEmail$!: Observable<boolean>;
  emailSendingStatus$!: Observable<{ [key: string]: string }>;
  sheetData$!: Observable<string[][]>;

  // Bulk send state
  bulkSendTotal = 0;
  bulkSendDone = 0;
  isBulkSending = false;
  bulkCancelSubject = new Subject<void>();

  // Confirmation dialog
  showConfirmDialog = false;
  pendingBulkSend = false;

  // Subscriptions to clean up
  private subscriptions = new Subscription();

  constructor(private gmailService: GmailService, private store: Store) {}

  ngOnInit(): void {
    this.sheetData$ = this.store.select(selectSheetData);
    this.loadingSheetData$ = this.store.select(selectLoadingSheetData);
    this.sendingEmail$ = this.store.select(selectSendingEmail);
    this.emailSendingStatus$ = this.store.select(selectEmailSendingStatus);

    this.loadSendAsAddresses();
    this.updateEditorConfig();
  }

  onSimpleTextChange(): void {
    this.useSimpleText = true;
    this.useHtmlTemplate = false;
    this.updateEditorConfig();
  }

  onHtmlTemplateChange(): void {
    this.useHtmlTemplate = true;
    this.useSimpleText = false;
    this.updateEditorConfig();
  }

  updateEditorConfig(): void {
    if (this.useHtmlTemplate) {
      this.tinymceInit = {
        base_url: '/tinymce',
        suffix: '.min',
        license_key: 'gpl',
        plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount',
        toolbar:
          'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | code fullscreen preview | removeformat help',
        menubar: 'file edit view insert format tools table help',
        height: 400,
        promotion: false,
        branding: false,
      };
    } else {
      this.tinymceInit = {
        base_url: '/tinymce',
        suffix: '.min',
        license_key: 'gpl',
        plugins: 'advlist autolink lists link charmap preview searchreplace visualblocks fullscreen wordcount',
        toolbar:
          'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | fullscreen preview | removeformat',
        menubar: false,
        height: 400,
        promotion: false,
        branding: false,
      };
    }
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions to prevent memory leaks
    this.subscriptions.unsubscribe();
    this.bulkCancelSubject.complete();
  }

  // ── sendAs / From address ────────────────────────────────────────────────

  loadSendAsAddresses(): void {
    this.loadingSendAs = true;
    this.sendAsError = '';
    const sub = this.gmailService.getSendAsAddresses().subscribe({
      next: (response: any) => {
        this.sendAsAddresses = (response.sendAs || []).filter(
          (s: SendAsAddress) => s.verificationStatus === 'accepted' || s.isPrimary
        );
        // Pre-select the default/primary address
        const def =
          this.sendAsAddresses.find((s) => s.isDefault) ||
          this.sendAsAddresses.find((s) => s.isPrimary);
        if (def) this.senderEmail = def.sendAsEmail;
        this.loadingSendAs = false;
      },
      error: () => {
        this.sendAsError = 'Could not load send-as addresses.';
        this.loadingSendAs = false;
      },
    });
    this.subscriptions.add(sub);
  }

  // ── Single email send ────────────────────────────────────────────────────

  canSendSingle(): boolean {
    return (
      this.recipientEmail.trim().length > 0 &&
      this.emailSubject.trim().length > 0 &&
      this.emailBody.trim().length > 0
    );
  }

  onSendSingle(): void {
    if (!this.canSendSingle()) return;

    let finalBody = this.emailBody;
    if (this.useSimpleText) {
      // Basic HTML to plain text conversion if Simple Text is selected
      // We keep <br> as newlines and strip other tags
      finalBody = this.emailBody
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<(?:.|\n)*?>/gm, '');
    }

    this.store.dispatch(
      sendEmail({
        sender: this.senderEmail,
        recipient: this.recipientEmail,
        subject: this.emailSubject,
        body: finalBody,
        signature: this.signature,
        cc: this.ccEmail || undefined,
        bcc: this.bccEmail || undefined,
      })
    );
  }

  // ── Sheet URL parsing ────────────────────────────────────────────────────

  extractSheetId(url: string): void {
    const matches = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (matches?.[1]) {
      this.spreadsheetId = matches[1];
      this.store.dispatch(updateSpreadsheetId({ spreadsheetId: matches[1] }));
    }
  }

  get effectiveSheetRange(): string {
    return this.customSheetRange.trim() || this.sheetRange;
  }

  // ── Bulk send (with confirm + cancel + progress) ─────────────────────────

  onLoadSheetClick(): void {
    if (!this.spreadsheetId) return;
    this.store.dispatch(
      loadSheetData({ spreadsheetId: this.spreadsheetId, sheetRange: this.effectiveSheetRange })
    );
  }

  onBulkSendClick(): void {
    this.showConfirmDialog = true;
  }

  confirmBulkSend(): void {
    this.showConfirmDialog = false;
    this.startBulkSend();
  }

  cancelConfirm(): void {
    this.showConfirmDialog = false;
  }

  cancelBulkSend(): void {
    this.bulkCancelSubject.next();
    this.isBulkSending = false;
    this.store.dispatch(cancelBulkSend());
  }

  private startBulkSend(): void {
    // Re-create cancel subject for this run
    this.bulkCancelSubject = new Subject<void>();

    const sub = this.sheetData$.subscribe((rows) => {
      if (!rows?.length) return;

      const validRows = rows.filter((r) => r.length >= 4);
      this.bulkSendTotal = validRows.length;
      this.bulkSendDone = 0;
      this.isBulkSending = true;

      const bulkSub = from(validRows)
        .pipe(
          concatMap((row: string[]) => {
            const [sender, recipient, subject, body, signature] = row;

            // Show current row in preview
            this.senderEmail = sender || this.senderEmail;
            this.recipientEmail = recipient;
            this.emailSubject = subject;
            this.emailBody = body;
            this.signature = signature || '';

            this.store.dispatch(
              setEmailSendingStatus({ rowId: recipient, status: 'sending' })
            );

            const delayTime = this.getRandomDelay();
            return of(null).pipe(
              delay(delayTime),
              concatMap(() => {
                let finalBody = body;
                if (this.useSimpleText) {
                  finalBody = body
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<(?:.|\n)*?>/gm, '');
                }

                this.store.dispatch(
                  sendEmail({
                    sender: sender || this.senderEmail,
                    recipient,
                    subject,
                    body: finalBody,
                    signature: signature || '',
                  })
                );
                this.bulkSendDone++;
                return of(null);
              })
            );
          }),
          takeUntil(this.bulkCancelSubject)
        )
        .subscribe({
          complete: () => {
            this.isBulkSending = false;
          },
          error: () => {
            this.isBulkSending = false;
          },
        });

      this.subscriptions.add(bulkSub);
    });

    // Take only one snapshot of sheetData then unsubscribe
    sub.unsubscribe();
  }

  getRandomDelay(): number {
    // Random delay between 3 and 10 minutes (in ms)
    return Math.floor(Math.random() * (10 - 3 + 1) + 3) * 60 * 1000;
  }

  getProgressPercent(): number {
    if (!this.bulkSendTotal) return 0;
    return Math.round((this.bulkSendDone / this.bulkSendTotal) * 100);
  }

  getStatusIcon(status: string): string {
    if (status === 'success') return '✓';
    if (status === 'error') return '✗';
    return '…';
  }

  getStatusClass(status: string): string {
    if (status === 'success') return 'text-green-600 font-semibold';
    if (status === 'error') return 'text-red-600 font-semibold';
    return 'text-yellow-500';
  }
}
