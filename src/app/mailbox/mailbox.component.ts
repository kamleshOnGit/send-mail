import { Component, OnDestroy, OnInit } from '@angular/core';
import { FooterComponent } from '../shared/footer/footer.component';
import { HeaderComponent } from '../shared/header/header.component';
import { GmailService } from '../services/gmail.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { take, takeUntil } from 'rxjs/operators';
import { State } from '../dataStore/reducers';
import {
  loadEmails,
  goToNextPage,
  goToPrevPage,
  resetNextPrevToken,
  toggleStar,
  markAsRead,
  markAsUnread,
  batchMarkAsRead,
  batchMarkAsUnread,
  batchArchiveEmails,
  batchArchiveEmailsSuccess,
  batchMarkAsReadSuccess,
  batchMarkAsUnreadSuccess,
  batchArchiveEmailsFailure,
  batchMarkAsReadFailure,
  batchMarkAsUnreadFailure,
} from '../dataStore/actions';
import { Email } from '../dataModel/email-details.model';
import {
  selectAllEmails,
  selectCurrentPage,
  selectHasNextPage,
  selectHasPrevPage,
  selectCurrentLabel,
  dataLoading,
} from '../dataStore/selector';

import { DecodeHtmlPipe } from '../pipes/decode-html.pipe';

@Component({
  selector: 'app-mailbox',
  standalone: true,
  templateUrl: './mailbox.component.html',
  styleUrl: './mailbox.component.css',
  imports: [FooterComponent, HeaderComponent, CommonModule, RouterModule, DecodeHtmlPipe],
})
export class MailboxComponent implements OnInit, OnDestroy {
  showDropdown: any;
  loading = true;

  emails$!: Observable<Email[]>;
  currentPage$!: Observable<number>;
  hasNextPage$!: Observable<boolean>;
  hasPrevPage$!: Observable<boolean>;

  currentLabel: 'inbox' | 'sent' | 'trash' | 'draft' = 'inbox';
  selectedEmailIds = new Set<string>();
  private destroy$ = new Subject<void>();

  // Modal State
  showModal = false;
  modalType: 'confirm' | 'status' = 'confirm';
  modalTitle = '';
  modalMessage = '';
  modalAction?: () => void;
  isProcessing = false;
  modalStatus: 'success' | 'error' | 'none' = 'success';

  constructor(
    private gmailService: GmailService,
    private router: Router,
    private store: Store<State>,
    private actions$: Actions
  ) {}

  ngOnInit(): void {
    // Wire up store observables
    this.emails$ = this.store.pipe(select(selectAllEmails));
    this.currentPage$ = this.store.pipe(select(selectCurrentPage));
    this.hasNextPage$ = this.store.pipe(select(selectHasNextPage));
    this.hasPrevPage$ = this.store.pipe(select(selectHasPrevPage));

    // Drive loading spinner from store
    this.store
      .select(dataLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => setTimeout(() => (this.loading = v), 100));

    // Listen for batch operation successes
    this.actions$.pipe(
      ofType(
        batchArchiveEmailsSuccess,
        batchMarkAsReadSuccess,
        batchMarkAsUnreadSuccess
      ),
      takeUntil(this.destroy$)
    ).subscribe((action) => {
      this.isProcessing = false;
      let msg = 'Operation completed successfully';
      if (action.type === batchArchiveEmailsSuccess.type) msg = 'Emails archived successfully';
      if (action.type === batchMarkAsReadSuccess.type) msg = 'Emails marked as read';
      if (action.type === batchMarkAsUnreadSuccess.type) msg = 'Emails marked as unread';
      
      this.openStatusModal('Success', msg, 'success');
    });

    // Listen for batch operation failures
    this.actions$.pipe(
      ofType(
        batchArchiveEmailsFailure,
        batchMarkAsReadFailure,
        batchMarkAsUnreadFailure
      ),
      takeUntil(this.destroy$)
    ).subscribe((action) => {
      this.isProcessing = false;
      let msg = 'Operation failed. Please try again.';
      if (action.type === batchArchiveEmailsFailure.type) msg = 'Failed to archive emails';
      if (action.type === batchMarkAsReadFailure.type) msg = 'Failed to mark emails as read';
      if (action.type === batchMarkAsUnreadFailure.type) msg = 'Failed to mark emails as unread';
      
      this.openStatusModal('Error', msg, 'error');
    });

    // Determine which label this route represents
    const routeLabel = this.getLabelFromUrl(this.router.url);

    // Check what is currently in the store
    this.store
      .pipe(
        select(selectAllEmails),
        take(1) // one snapshot — don't subscribe forever
      )
      .subscribe((storedEmails) => {
        // Read the label the store was last loaded for
        this.store
          .pipe(select(selectCurrentLabel), take(1))
          .subscribe((storedLabel) => {
            if (storedEmails.length > 0 && storedLabel === routeLabel) {
              // Cache hit: same label, emails already in store.
              // Returning from an email detail — don't re-fetch, just show what we have.
              this.currentLabel = routeLabel;
              this.loading = false;
            } else {
              // Cache miss: different label, or first visit.
              // Reset pagination state and fetch fresh.
              this.currentLabel = routeLabel;
              this.store.dispatch(
                resetNextPrevToken({ nextPageToken: undefined, prevPageToken: undefined })
              );
              this.store.dispatch(loadEmails({ label: routeLabel }));
            }
          });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  navigateTo(folder: string): void {
    const label = this.getValidLabel(folder);
    this.currentLabel = label;
    // Always reset and fetch when the user explicitly clicks a folder
    this.store.dispatch(
      resetNextPrevToken({ nextPageToken: undefined, prevPageToken: undefined })
    );
    this.router.navigate([`/${folder}`]).then(() => {
      this.store.dispatch(loadEmails({ label }));
    });
  }

  sendSingle(): void {
    this.router.navigateByUrl('/mailing');
  }

  // ── Pagination ────────────────────────────────────────────────────────────

  nextPage(): void {
    this.store.dispatch(goToNextPage({ label: this.currentLabel }));
  }

  prevPage(): void {
    this.store.dispatch(goToPrevPage({ label: this.currentLabel }));
  }

  // ── Email actions ─────────────────────────────────────────────────────────

  viewEmail(emailId: string): void {
    this.router.navigate(['/inbox', emailId]);
  }

  toggleStar(emailId: string): void {
    this.store.dispatch(toggleStar({ emailId }));
  }

  markAsRead(emailId: string): void {
    this.store.dispatch(markAsRead({ emailId }));
  }

  markAsUnread(emailId: string): void {
    this.store.dispatch(markAsUnread({ emailId }));
  }

  toggleDropdown(event: Event): void {
    this.showDropdown = !this.showDropdown;
    event.stopPropagation();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getLabelFromUrl(url: string): 'inbox' | 'sent' | 'trash' | 'draft' {
    const segment = url.slice(1).split('?')[0].split('#')[0].split('/')[0];
    return this.getValidLabel(segment);
  }

  getValidLabel(s: string): 'inbox' | 'sent' | 'trash' | 'draft' {
    const valid: Record<string, 'inbox' | 'sent' | 'trash' | 'draft'> = {
      inbox: 'inbox',
      sent: 'sent',
      trash: 'trash',
      draft: 'draft',
    };
    return valid[s] ?? 'inbox';
  }

  // ── Modal Actions ────────────────────────────────────────────────────────

  openConfirmModal(title: string, message: string, action: () => void): void {
    this.modalType = 'confirm';
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalAction = action;
    this.modalStatus = 'none';
    this.showModal = true;
  }

  openStatusModal(title: string, message: string, status: 'success' | 'error'): void {
    this.modalType = 'status';
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalStatus = status;
    this.showModal = true;
    
    // Auto-close status modal after 3 seconds
    setTimeout(() => {
      if (this.showModal && this.modalType === 'status') {
        this.closeModal();
      }
    }, 3000);
  }

  closeModal(): void {
    this.showModal = false;
    this.modalAction = undefined;
  }

  confirmModalAction(): void {
    if (this.modalAction) {
      this.modalAction();
    }
    this.closeModal();
  }

  // ── Selection and Batch Actions ──────────────────────────────────────────

  selectAllEmails(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.emails$.pipe(take(1)).subscribe((emails) => {
        emails.forEach((email) => this.selectedEmailIds.add(email.id));
      });
    } else {
      this.selectedEmailIds.clear();
    }
  }

  selectEmail(emailId: string): void {
    if (this.selectedEmailIds.has(emailId)) {
      this.selectedEmailIds.delete(emailId);
    } else {
      this.selectedEmailIds.add(emailId);
    }
  }

  isAllSelected(): boolean {
    let allSelected = false;
    this.emails$.pipe(take(1)).subscribe((emails) => {
      allSelected = emails.length > 0 && emails.every((e) => this.selectedEmailIds.has(e.id));
    });
    return allSelected;
  }

  archiveSelectedEmails(): void {
    if (this.selectedEmailIds.size === 0) return;
    this.isProcessing = true;
    this.store.dispatch(batchArchiveEmails({ emailIds: Array.from(this.selectedEmailIds) }));
    this.selectedEmailIds.clear();
  }

  markSelectedAsUnread(): void {
    if (this.selectedEmailIds.size === 0) return;
    this.isProcessing = true;
    this.store.dispatch(batchMarkAsUnread({ emailIds: Array.from(this.selectedEmailIds) }));
    this.selectedEmailIds.clear();
  }

  markSelectedAsRead(): void {
    if (this.selectedEmailIds.size === 0) return;
    this.isProcessing = true;
    this.store.dispatch(batchMarkAsRead({ emailIds: Array.from(this.selectedEmailIds) }));
    this.selectedEmailIds.clear();
  }
}
