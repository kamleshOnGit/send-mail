// email.actions.ts
import { createAction, props } from '@ngrx/store';
import { Email, EmailDetails } from '../dataModel/email-details.model';

export const loadEmails = createAction(
  '[Email] Load Emails',
  props<{
    pageToken?: string;
    label: 'inbox' | 'sent' | 'trash' | 'draft';
  }>()
);

export const loadEmailsSuccess = createAction(
  '[Email] Load Emails Success',
  props<{
    emails: Email[];
    currentPage: number;
    totalEmails: number;
    hasNextPage: boolean;
    nextPageToken?: string;
    // Full history of tokens used to reach each page — enables correct "Previous"
    pageTokenHistory: (string | undefined)[];
    label: 'inbox' | 'sent' | 'trash' | 'draft';
  }>()
);

export const loadEmailsFailure = createAction(
  '[Email] Load Emails Failure',
  props<{ error: any }>()
);

// Navigate to the next page — effect resolves the token from store
export const goToNextPage = createAction(
  '[Email] Go To Next Page',
  props<{ label: 'inbox' | 'sent' | 'trash' | 'draft' }>()
);

// Navigate to the previous page — effect resolves the token from store
export const goToPrevPage = createAction(
  '[Email] Go To Prev Page',
  props<{ label: 'inbox' | 'sent' | 'trash' | 'draft' }>()
);

export const updateCurrentPage = createAction(
  '[Email] Update Current Page',
  props<{ currentPage: number }>()
);

export const updateEmailInList = createAction(
  '[Email] Update Email In List',
  props<{ email: Email }>()
);

export const loadEmailDetails = createAction(
  '[Email] Load Email Details',
  props<{ emailId: string }>()
);
export const loadEmailDetailsSuccess = createAction(
  '[EmailDetails] Load Email Details Success',
  props<{ emailDetails: EmailDetails }>()
);
export const loadEmailDetailsFailure = createAction(
  '[Email] Load Email Details Failure',
  props<{ error: any }>()
);

export const saveEmailDetails = createAction(
  '[Email] Save Email Details',
  props<{ emailDetails: EmailDetails }>()
);

export const toggleStar = createAction(
  '[Email List] Toggle Star',
  props<{ emailId: string }>()
);
export const markAsRead = createAction(
  '[Email List] Mark As Read',
  props<{ emailId: string }>()
);
export const markAsUnread = createAction(
  '[Email List] Mark As Unread',
  props<{ emailId: string }>()
);

// Kept for any remaining references — routes directly to loadEmails via effect
export const paginateEmails = createAction(
  '[Email List] Paginate Emails',
  props<{
    direction: 'next' | 'prev';
    label: 'inbox' | 'sent' | 'trash' | 'draft';
  }>()
);

export const loadSheetData = createAction(
  '[Sheet] Load Sheet Data',
  props<{ spreadsheetId: string; sheetRange: string }>()
);

export const loadSheetDataSuccess = createAction(
  '[Sheet] Load Sheet Data Success',
  props<{ rows: string[][] }>()
);

export const loadSheetDataFailure = createAction(
  '[Sheet] Load Sheet Data Failure',
  props<{ error: any }>()
);

// Send email actions
export const sendEmail = createAction(
  '[Email] Send Email',
  props<{
    sender: string;
    recipient: string;
    subject: string;
    body: string;
    signature: string;
    cc?: string;
    bcc?: string;
  }>()
);

export const sendEmailSuccess = createAction(
  '[Email] Send Email Success',
  props<{ sender: string; recipient: string }>()
);

export const sendEmailFailure = createAction(
  '[Email] Send Email Failure',
  props<{ sender: string; recipient: string; error: any }>()
);

export const startLoadingSheetData = createAction(
  '[Email] Start Loading Sheet Data'
);
export const stopLoadingSheetData = createAction(
  '[Email] Stop Loading Sheet Data'
);

export const startSendingEmail = createAction('[Email] Start Sending Email');
export const stopSendingEmail = createAction('[Email] Stop Sending Email');

export const setEmailSendingStatus = createAction(
  '[Email] update email sending status',
  props<{ rowId: string; status: string }>()
);

export const updateSheetStatus = createAction(
  '[Email] Update Sheet Status',
  props<{ rowIndex: number; status: string }>()
);
export const updateSheetStatusSuccess = createAction(
  '[Email] Update Sheet Status Success',
  props<{ rowIndex: number; status: string }>()
);
export const updateSheetStatusFailure = createAction(
  '[Email] Update Sheet Status Failure',
  props<{ rowIndex: number; error: any }>()
);

export const updateSpreadsheetId = createAction(
  '[Sheet] Update Spreadsheet ID',
  props<{ spreadsheetId: string }>()
);
export const updateSpreadsheetIdSuccess = createAction(
  '[Sheet] Update Spreadsheet ID Success'
);
export const updateSpreadsheetIdFailure = createAction(
  '[Sheet] Update Spreadsheet ID Failure',
  props<{ error: any }>()
);

export const fetchSignature = createAction('[Email] Fetch Signature');
export const fetchSignatureSuccess = createAction(
  '[Email] Fetch Signature Success',
  props<{ signature: string }>()
);
export const fetchSignatureFailure = createAction(
  '[Email] Fetch Signature Failure',
  props<{ error: any }>()
);

export const updateSignature = createAction(
  '[Email] Update Signature',
  props<{ sendAsEmail: string; newSignature: string }>()
);
export const updateSignatureSuccess = createAction(
  '[Email] Update Signature Success',
  props<{ newSignature: string }>()
);
export const updateSignatureFailure = createAction(
  '[Email] Update Signature Failure',
  props<{ error: any }>()
);

export const setLoading = createAction(
  '[Email] Set Loading',
  props<{ loading: boolean }>()
);

export const cancelBulkSend = createAction('[Email] Cancel Bulk Send');

export const batchDeleteEmails = createAction(
  '[Email List] Batch Delete Emails',
  props<{ emailIds: string[] }>()
);
export const batchDeleteEmailsSuccess = createAction('[Email List] Batch Delete Emails Success');
export const batchDeleteEmailsFailure = createAction('[Email List] Batch Delete Emails Failure', props<{ error: any }>());

export const batchMarkAsRead = createAction(
  '[Email List] Batch Mark As Read',
  props<{ emailIds: string[] }>()
);
export const batchMarkAsReadSuccess = createAction('[Email List] Batch Mark As Read Success');
export const batchMarkAsReadFailure = createAction('[Email List] Batch Mark As Read Failure', props<{ error: any }>());

export const batchMarkAsUnread = createAction(
  '[Email List] Batch Mark As Unread',
  props<{ emailIds: string[] }>()
);
export const batchMarkAsUnreadSuccess = createAction('[Email List] Batch Mark As Unread Success');
export const batchMarkAsUnreadFailure = createAction('[Email List] Batch Mark As Unread Failure', props<{ error: any }>());

export const batchArchiveEmails = createAction(
  '[Email List] Batch Archive Emails',
  props<{ emailIds: string[] }>()
);
export const batchArchiveEmailsSuccess = createAction('[Email List] Batch Archive Emails Success');
export const batchArchiveEmailsFailure = createAction('[Email List] Batch Archive Emails Failure', props<{ error: any }>());

// Kept for backwards compat — resets token history when switching labels
export const resetNextPrevToken = createAction(
  'Reset next & prev Token',
  props<{
    nextPageToken?: string;
    prevPageToken?: string;
  }>()
);
