// email.selectors.ts
import { createSelector, createFeatureSelector } from '@ngrx/store';
import { State } from './reducers';
import { Email, EmailDetails } from '../dataModel/email-details.model';

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
    (state: State) => state.emailDetails[emailId],
  );

  export const selectPaginatedEmails = createSelector(
    (state: State) => state.emails,
    (state: State) => state.pagination,
    (emails, pagination) => {
      const start = (pagination.currentPage - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      return emails.slice(start, end);
    }
  );

  // Selectors for pagination state
  export const selectTotalPages = createSelector(
    (state: State) => state.pagination,
    (pagination) => Math.ceil(pagination.totalEmails / pagination.pageSize)
  );

  export const selectCurrentPage = createSelector(
    (state: State) => state.pagination,
    (pagination) => pagination.currentPage
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
