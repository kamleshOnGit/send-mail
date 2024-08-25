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
  on(saveEmailDetails, (state, { emailDetails }) => ({
    ...state,
    emailDetails: {
      ...state.emailDetails,
      [emailDetails.id]: emailDetails,
    },
  })),
  
);

export function emailReducer(state: State | undefined, action: Action) {
  return _emailReducer(state, action);
}
