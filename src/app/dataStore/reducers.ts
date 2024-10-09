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
} from './actions';
import { Email, EmailDetails } from '../dataModel/email-details.model';

export interface State {
  emails: Email[];
  emailDetails: { [key: string]: EmailDetails };
  error: any;
  loading: boolean;
  loadingSheetData: boolean; // New loading state for fetching sheet data
  sendingEmail: boolean; // New loading state for sending emails
  sheetData: string[][]; // Added to store sheet data rows
  spreadsheetId: string; //
  emailSendingStatus: { [key: string]: string }; // Added to store the status of each email sent (success or failure)
  pagination: {
    currentPage: number;
    pageSize: number;
    totalEmails: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPageToken?: string;
    prevPageToken?: string;
  };
}

export const initialState: State = {
  emails: [],
  emailDetails: {},
  error: null,
  loading: false,
  loadingSheetData: false, // Default to false
  sendingEmail: false, // Default to false
  sheetData: [], // Initialize empty sheet data
  spreadsheetId: '' ,
  emailSendingStatus: {}, // Initialize an empty email status object
  pagination: {
    currentPage: 1,
    pageSize: 50,
    totalEmails: 0,
    hasNextPage: false,
    hasPrevPage: false,
    nextPageToken: undefined,
    prevPageToken: undefined,
  },
};

const _emailReducer = createReducer(
  initialState,
  on(loadEmails, (state) => ({ ...state, loading: true })),
  on(
    loadEmailsSuccess,
    (
      state,
      {
        emails,
        currentPage,
        totalEmails,
        hasNextPage,
        hasPrevPage,
        nextPageToken,
        prevPageToken,
      }
    ) => ({
      ...state,
      emails,
      pagination: {
        ...state.pagination,
        currentPage,
        totalEmails,
        hasNextPage,
        hasPrevPage,
        nextPageToken,
        prevPageToken,
      },
      loading: false,
    })
  ),
  on(updateCurrentPage, (state, { currentPage }) => ({
    ...state,
    pagination: {
      ...state.pagination,
      currentPage,
    },
  })),

  on(paginateEmails, (state, { direction }) => {
    const newPage =
      direction === 'next'
        ? state.pagination.currentPage + 1
        : state.pagination.currentPage - 1;

    return {
      ...state,
      pagination: {
        ...state.pagination,
        currentPage: newPage,
      },
    };
  }),
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
  })),
  // Sheet Data Loading Reducers
  on(loadSheetData, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(loadSheetDataSuccess, (state, { rows }) => ({
    ...state,
    loading: false,
    sheetData: rows, // Store fetched sheet data
  })),
  on(loadSheetDataFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Email Sending Reducers
  on(sendEmail, (state, { sender, recipient }) => ({
    ...state,
    emailSendingStatus: {
      ...state.emailSendingStatus,
      [recipient]: 'sending', // Track sending status
    },
  })),
  on(sendEmailSuccess, (state, { sender, recipient }) => ({
    ...state,
    sendingEmail: false,
    emailSendingStatus: {
      ...state.emailSendingStatus,
      [recipient]: 'success',
    },
  })),
  on(sendEmailFailure, (state, { sender, recipient, error }) => ({
    ...state,
    sendingEmail: false,
    emailSendingStatus: {
      ...state.emailSendingStatus,
      [recipient]: 'error',
    },
    error,
  })),
  on(startLoadingSheetData, (state) => ({
    ...state,
    loadingSheetData: true,
  })),
  on(stopLoadingSheetData, (state) => ({
    ...state,
    loadingSheetData: false,
  })),
  on(startSendingEmail, (state) => ({
    ...state,
    sendingEmail: true,
  })),
  on(stopSendingEmail, (state) => ({
    ...state,
    sendingEmail: false,
  })),
  on(setEmailSendingStatus, (state, { rowId, status }) => ({
    ...state,
    emailSendingStatus: {
      ...state.emailSendingStatus,
      [rowId]: status,
    },
  })),
  on(updateSheetStatusSuccess, (state, { rowIndex, status }) => ({
    ...state,
    emailSendingStatus: {
      ...state.emailSendingStatus,
      [rowIndex]: status, // Update the status in the state
    },
    sheetUpdateError: null, // Clear any previous error
  })),
  on(updateSheetStatusFailure, (state, { rowIndex, error }) => ({
    ...state,
    sheetUpdateError: error, // Store the error in case of failure
  })),
  on(updateSpreadsheetId, (state, { spreadsheetId }) => ({
    ...state,
    spreadsheetId: spreadsheetId,
  })),
  // Optional: Handle success and failure if needed
  on(updateSpreadsheetIdSuccess, (state) => ({
    ...state,
  })),
  on(updateSpreadsheetIdFailure, (state, { error }) => ({
    ...state,
    error,
  })),
  on(fetchSignature, (state) => ({
    ...state,
    loading: true,
  })),
  on(fetchSignatureSuccess, (state, { signature }) => ({
    ...state,
    signature,
    loading: false,
    error: null,
  })),
  on(fetchSignatureFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(updateSignature, (state) => ({
    ...state,
    loading: true,
  })),
  on(updateSignatureSuccess, (state, { newSignature }) => ({
    ...state,
    signature: newSignature,
    loading: false,
    error: null,
  })),
  on(updateSignatureFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(resetNextPrevToken, (state, { nextPageToken, prevPageToken }) => ({
    ...state, // Spread the existing state to keep other properties
    pagination: {
      ...state.pagination, // Spread existing pagination object
      nextPageToken: nextPageToken || undefined, // Handle resetting nextPageToken
      prevPageToken: prevPageToken || undefined, // Handle resetting prevPageToken
    },
  }))
);


export function emailReducer(state: State | undefined, action: Action) {
  return _emailReducer(state, action);
}



