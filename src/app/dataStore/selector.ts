// email.selectors.ts
import { createSelector, createFeatureSelector } from '@ngrx/store';
import { State } from './reducers';
import { EmailDetails } from '../dataModel/email-details.model';


export const selectEmails = (state: State) => state.emails;
export const selectLoading = (state: State) => state.loading;
// Selector to get the whole email state
export const selectEmailState = createFeatureSelector<State>('email');

export const selectEmailDetailsById = (id: string) =>
  createSelector(selectEmailState, (state: State) => state.emailDetails[id]);

export const selectEmailDetails = createSelector(
  (state: State) => state.emailDetails,
  (emailDetails: { [key: string]: EmailDetails }, props: { emailId: string }) =>
    emailDetails[props.emailId]
);

