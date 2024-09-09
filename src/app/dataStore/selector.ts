// email.selectors.ts

import { createSelector, createFeatureSelector } from '@ngrx/store';
import { State } from './reducers';
import { Email } from '../dataModel/email-details.model';

export const selectEmailState = createFeatureSelector<State>('email');

// Selector to fetch all emails
export const selectAllEmails = createSelector(
  selectEmailState,
  (state: State) => state.emails
);

// Selector to check if there are any emails in the store
export const selectHasEmails = createSelector(
  selectAllEmails,
  (emails: Email[]) => emails.length > 0
);

// Selector to get email details by id directly
export const selectEmailDetailsById = (emailId: string) =>
  createSelector(
    selectEmailState,
    (state: State) => state.emailDetails[emailId]
  );

// Selector to get pagination state
export const selectPagination = createSelector(
  selectEmailState,
  (state: State) => state.pagination
);

// Selector to get paginated emails
export const selectPaginatedEmails = createSelector(
  selectAllEmails,
  selectPagination,
  (emails, pagination) => {
    if (!pagination) return emails; // Handle case where pagination might be undefined
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return emails.slice(start, end);
  }
);

// Selectors for pagination state
export const selectTotalPages = createSelector(
  selectPagination,
  (pagination) => {
    if (!pagination) return 0; // Handle case where pagination might be undefined
    return Math.ceil(pagination.totalEmails / pagination.pageSize);
  }
);

export const selectCurrentPage = createSelector(
  selectPagination,
  (pagination) => (pagination ? pagination.currentPage : 1) // Default to 1 if pagination is undefined
);

export const selectHasNextPage = createSelector(
  selectCurrentPage,
  selectTotalPages,
  (currentPage, totalPages) => currentPage < totalPages
);

export const selectHasPrevPage = createSelector(
  selectCurrentPage,
  (currentPage) => currentPage > 1
);

export const getCurrentPage = createSelector(
  selectPagination,
  (pagination) => (pagination ? pagination.currentPage : 1) // Default to 1 if pagination is undefined
);

// Selectors for pagination state
export const selectNextPageToken = createSelector(
  selectEmailState,
  (state: State) => state.pagination.nextPageToken
);

export const selectPrevPageToken = createSelector(
  selectEmailState,
  (state: State) => state.pagination.prevPageToken
);

// Select sheet data
export const selectSheetData = createSelector(
  selectEmailState,
  (state: State) => state.sheetData
);

// Select email sending status
export const selectEmailSendingStatus = createSelector(
  selectEmailState,
  (state: State) => state.emailSendingStatus
);
