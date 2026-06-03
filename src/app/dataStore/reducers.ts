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
  updateCurrentPage,
  paginateEmails,
  loadSheetData,
  loadSheetDataFailure,
  loadSheetDataSuccess,
  sendEmail,
  sendEmailFailure,
  sendEmailSuccess,
  startLoadingSheetData,
  startSendingEmail,
  stopLoadingSheetData,
  stopSendingEmail,
  setEmailSendingStatus,
  updateSheetStatusSuccess,
  updateSheetStatusFailure,
  updateSpreadsheetId,
  updateSpreadsheetIdFailure,
  updateSpreadsheetIdSuccess,
  fetchSignature,
  fetchSignatureFailure,
  fetchSignatureSuccess,
  updateSignature,
  updateSignatureFailure,
  updateSignatureSuccess,
  resetNextPrevToken,
  setLoading,
  cancelBulkSend,
  goToNextPage,
  goToPrevPage,
} from './actions';
import { Email, EmailDetails } from '../dataModel/email-details.model';

export interface State {
  emails: Email[];
  emailDetails: { [key: string]: EmailDetails };
  error: any;
  loading: boolean;
  loadingSheetData: boolean;
  sendingEmail: boolean;
  sheetData: string[][];
  spreadsheetId: string;
  emailSendingStatus: { [key: string]: string };
  pagination: {
    currentPage: number;
    pageSize: number;
    totalEmails: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPageToken?: string;
    // Stack of tokens used to reach each page.
    // Index 0 = undefined (first page has no token).
    // Index 1 = token used to reach page 2, etc.
    // Pressing "Previous" pops the last token off the stack.
    pageTokenHistory: (string | undefined)[];
  };
  // Which label (inbox/sent/…) is currently loaded in `emails`
  currentLabel: 'inbox' | 'sent' | 'trash' | 'draft';
}

export const initialState: State = {
  emails: [],
  emailDetails: {},
  error: null,
  loading: false,
  loadingSheetData: false,
  sendingEmail: false,
  sheetData: [],
  spreadsheetId: '',
  emailSendingStatus: {},
  currentLabel: 'inbox',
  pagination: {
    currentPage: 1,
    pageSize: 50,
    totalEmails: 0,
    hasNextPage: false,
    hasPrevPage: false,
    nextPageToken: undefined,
    pageTokenHistory: [undefined], // page 1 has no token
  },
};

const _emailReducer = createReducer(
  initialState,

  on(loadEmails, (state) => ({ ...state, loading: true })),

  on(
    loadEmailsSuccess,
    (state, { emails, currentPage, totalEmails, hasNextPage, nextPageToken, pageTokenHistory, label }) => ({
      ...state,
      emails,
      currentLabel: label,
      pagination: {
        ...state.pagination,
        currentPage,
        totalEmails,
        hasNextPage,
        hasPrevPage: currentPage > 1,
        nextPageToken,
        pageTokenHistory,
      },
    })
  ),

  on(updateCurrentPage, (state, { currentPage }) => ({
    ...state,
    pagination: { ...state.pagination, currentPage },
  })),

  // paginateEmails kept for backwards compat — effect handles navigation now
  on(paginateEmails, (state) => ({ ...state })),
  on(goToNextPage, (state) => ({ ...state, loading: true })),
  on(goToPrevPage, (state) => ({ ...state, loading: true })),

  on(loadEmailsFailure, (state, { error }) => ({ ...state, error, loading: false })),
  on(loadEmailDetails, (state) => ({ ...state, loading: true })),
  on(loadEmailDetailsSuccess, (state, { emailDetails }) => ({
    ...state,
    emailDetails: { ...state.emailDetails, [emailDetails.id]: emailDetails },
    loading: false,
  })),
  on(loadEmailDetailsFailure, (state, { error }) => ({ ...state, error, loading: false })),
  on(saveEmailDetails, (state, { emailDetails }) => ({
    ...state,
    emailDetails: { ...state.emailDetails, [emailDetails.id]: emailDetails },
    emails: state.emails.map((email) =>
      email.id === emailDetails.id
        ? { ...email, ...emailDetails, subject: emailDetails.snippet }
        : email
    ),
  })),
  on(updateEmailInList, (state, { email }) => ({
    ...state,
    emails: state.emails.map((e) => (e.id === email.id ? { ...e, ...email } : e)),
  })),

  // Sheet Data
  on(loadSheetData, (state) => ({ ...state, loading: true, error: null })),
  on(loadSheetDataSuccess, (state, { rows }) => ({
    ...state,
    loading: false,
    sheetData: rows,
    emailSendingStatus: {},
  })),
  on(loadSheetDataFailure, (state, { error }) => ({ ...state, loading: false, error })),

  // Email Sending
  on(sendEmail, (state, { recipient }) => ({
    ...state,
    emailSendingStatus: { ...state.emailSendingStatus, [recipient]: 'sending' },
  })),
  on(sendEmailSuccess, (state, { recipient }) => ({
    ...state,
    sendingEmail: false,
    emailSendingStatus: { ...state.emailSendingStatus, [recipient]: 'success' },
  })),
  on(sendEmailFailure, (state, { recipient, error }) => ({
    ...state,
    sendingEmail: false,
    emailSendingStatus: { ...state.emailSendingStatus, [recipient]: 'error' },
    error,
  })),

  on(startLoadingSheetData, (state) => ({ ...state, loadingSheetData: true })),
  on(stopLoadingSheetData, (state) => ({ ...state, loadingSheetData: false })),
  on(startSendingEmail, (state) => ({ ...state, sendingEmail: true })),
  on(stopSendingEmail, (state) => ({ ...state, sendingEmail: false })),

  on(setEmailSendingStatus, (state, { rowId, status }) => ({
    ...state,
    emailSendingStatus: { ...state.emailSendingStatus, [rowId]: status },
  })),

  on(cancelBulkSend, (state) => ({ ...state, sendingEmail: false })),

  on(updateSheetStatusSuccess, (state, { rowIndex, status }) => ({
    ...state,
    emailSendingStatus: { ...state.emailSendingStatus, [rowIndex]: status },
  })),
  on(updateSheetStatusFailure, (state) => ({ ...state })),

  on(updateSpreadsheetId, (state, { spreadsheetId }) => ({ ...state, spreadsheetId })),
  on(updateSpreadsheetIdSuccess, (state) => ({ ...state })),
  on(updateSpreadsheetIdFailure, (state, { error }) => ({ ...state, error })),

  on(fetchSignature, (state) => ({ ...state, loading: true })),
  on(fetchSignatureSuccess, (state, { signature }) => ({
    ...state,
    signature,
    loading: false,
    error: null,
  })),
  on(fetchSignatureFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(updateSignature, (state) => ({ ...state, loading: true })),
  on(updateSignatureSuccess, (state, { newSignature }) => ({
    ...state,
    signature: newSignature,
    loading: false,
    error: null,
  })),
  on(updateSignatureFailure, (state, { error }) => ({ ...state, loading: false, error })),

  // Reset pagination completely — used when switching between inbox/sent/etc.
  on(resetNextPrevToken, (state) => ({
    ...state,
    pagination: {
      ...state.pagination,
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false,
      nextPageToken: undefined,
      pageTokenHistory: [undefined],
    },
  })),

  on(setLoading, (state, { loading }) => ({ ...state, loading }))
);

export function emailReducer(state: State | undefined, action: Action) {
  return _emailReducer(state, action);
}
