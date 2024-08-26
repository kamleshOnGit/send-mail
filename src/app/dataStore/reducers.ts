// email.reducer.ts
import { Action, createReducer, on } from '@ngrx/store';
import {
  loadEmails,
  loadEmailsSuccess,
  loadEmailsFailure,
  loadEmailDetails,
  loadEmailDetailsSuccess,
  loadEmailDetailsFailure,
  saveEmailDetails,
  updateEmailInList,
} from './actions';
import { Email, EmailDetails } from '../dataModel/email-details.model';

export interface State {
  emails: Email[];
  emailDetails: { [key: string]: EmailDetails };
  error: any;
  loading: boolean;
}

export const initialState: State = {
  emails: [],
  emailDetails: {},
  error: null,
  loading: false,
};

const _emailReducer = createReducer(
  initialState,
  on(loadEmails, (state) => ({ ...state, loading: true })),
  on(loadEmailsSuccess, (state, { emails }) => ({
    ...state,
    emails,
    loading: false,
  })),
  on(loadEmailsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(loadEmailDetails, (state) => ({ ...state, loading: true })),
  on(loadEmailDetailsSuccess, (state, { emailDetails }) => ({
    ...state,
    emailDetails: { ...state.emailDetails, [emailDetails.id]: emailDetails },
    loading: false,
  })),
  on(loadEmailDetailsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(saveEmailDetails, (state, { emailDetails }) => {
    const updatedEmails = state.emails.map((email) =>
      email.id === emailDetails.id
        ? { ...email, ...emailDetails, subject: emailDetails.snippet } // Update with new details
        : email
    );

    return {
      ...state,
      emailDetails: {
        ...state.emailDetails,
        [emailDetails.id]: emailDetails,
      },
      emails: updatedEmails,
    };
  }),
  on(updateEmailInList, (state, { email }) => ({
    ...state,
    emails: state.emails.map((e) =>
      e.id === email.id ? { ...e, ...email } : e
    ),
  }))
);

export function emailReducer(state: State | undefined, action: Action) {
  return _emailReducer(state, action);
}
