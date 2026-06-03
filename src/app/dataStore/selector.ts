// email.selectors.ts
import { createSelector, createFeatureSelector } from '@ngrx/store';
import { State } from './reducers';
import { Email } from '../dataModel/email-details.model';

export const selectEmailState = createFeatureSelector<State>('email');

export const selectAllEmails = createSelector(
  selectEmailState,
  (state: State) => state.emails
);

export const selectHasEmails = createSelector(
  selectAllEmails,
  (emails: Email[]) => emails.length > 0
);

export const selectEmailDetailsById = (emailId: string) =>
  createSelector(
    selectEmailState,
    (state: State) => state.emailDetails[emailId]
  );

export const selectPagination = createSelector(
  selectEmailState,
  (state: State) => state.pagination
);

export const selectCurrentPage = createSelector(
  selectPagination,
  (p) => p.currentPage
);

export const selectHasNextPage = createSelector(
  selectPagination,
  (p) => p.hasNextPage
);

export const selectHasPrevPage = createSelector(
  selectPagination,
  (p) => p.hasPrevPage
);

// Not used for display anymore but kept for compat
export const selectTotalPages = createSelector(
  selectPagination,
  (p) => Math.ceil(p.totalEmails / p.pageSize)
);

export const getCurrentPage = selectCurrentPage;

// The token to use when fetching the NEXT page
export const selectNextPageToken = createSelector(
  selectPagination,
  (p) => p.nextPageToken
);

// The token to use when going BACK one page:
// second-to-last entry in the history stack (the one before the current page)
export const selectPrevPageToken = createSelector(
  selectPagination,
  (p) => {
    const history = p.pageTokenHistory;
    // history[0]=undefined (p1), history[1]=token-for-p2, ...
    // Current page is history.length - 1.
    // To go back, we want history[length - 2].
    if (history.length < 2) return undefined;
    return history[history.length - 2];
  }
);

// Full token history — needed by effects to build the updated history on success
export const selectPageTokenHistory = createSelector(
  selectPagination,
  (p) => p.pageTokenHistory
);

// Which label (inbox/sent/…) is currently loaded
export const selectCurrentLabel = createSelector(
  selectEmailState,
  (state: State) => state.currentLabel
);

export const selectSheetData = createSelector(
  selectEmailState,
  (state: State) => state.sheetData
);

export const selectEmailSendingStatus = createSelector(
  selectEmailState,
  (state: State) => state.emailSendingStatus
);

export const selectLoadingSheetData = createSelector(
  selectEmailState,
  (state: State) => state.loadingSheetData
);

export const selectSendingEmail = createSelector(
  selectEmailState,
  (state: State) => state.sendingEmail
);

export const selectSpreadsheetId = createSelector(
  selectEmailState,
  (state: State) => state.spreadsheetId
);

export const selectEmailsByLabel = (label: 'inbox' | 'sent' | 'trash' | 'draft') =>
  createSelector(selectEmailState, (state: State) =>
    state.emails.filter((email) => email.labelIds.includes(label.toUpperCase()))
  );

export const dataLoading = createSelector(
  selectEmailState,
  (state: State) => state.loading
);

// Paginated slice — kept for compat but inbox/sent use the full `emails` array
// since Gmail returns exactly one page per request
export const selectPaginatedEmails = createSelector(
  selectAllEmails,
  selectPagination,
  (emails, pagination) => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    return emails.slice(start, start + pagination.pageSize);
  }
);
