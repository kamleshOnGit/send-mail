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
