import { Component, OnDestroy, OnInit } from '@angular/core';
import { FooterComponent } from '../shared/footer/footer.component';
import { HeaderComponent } from '../shared/header/header.component';
import { GmailService } from '../services/gmail.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { select, Store } from '@ngrx/store';
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

@Component({
  selector: 'app-mailbox',
  standalone: true,
  templateUrl: './mailbox.component.html',
  styleUrl: './mailbox.component.css',
  imports: [FooterComponent, HeaderComponent, CommonModule, RouterModule],
})
export class MailboxComponent implements OnInit, OnDestroy {
  showDropdown: any;
  loading = true;

  emails$!: Observable<Email[]>;
  currentPage$!: Observable<number>;
  hasNextPage$!: Observable<boolean>;
  hasPrevPage$!: Observable<boolean>;

  private currentLabel: 'inbox' | 'sent' | 'trash' | 'draft' = 'inbox';
  private destroy$ = new Subject<void>();

  constructor(
    private gmailService: GmailService,
    private router: Router,
    private store: Store<State>
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

  // Stubs so the template doesn't break
  selectAllEmails(_: Event): void {}
  selectEmail(_: string): void {}
  moveSelectedEmails(): void {}
  archiveSelectedEmails(): void {}
  deleteSelectedEmails(): void {}
  markSelectedAsSpam(): void {}
  markSelectedAsUnread(): void {}
  markSelectedAsRead(): void {}
}
