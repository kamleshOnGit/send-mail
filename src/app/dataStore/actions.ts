// email.actions.ts
import { createAction, props } from '@ngrx/store';
import { Email, EmailDetails } from '../dataModel/email-details.model';

export const loadEmails = createAction(
  '[Email] Load Emails',
  props<{ currentPage: number; pageToken?: string }>()
);

export const updateCurrentPage = createAction(
  '[Email] Update Current Page',
  props<{ currentPage: number }>()
);

export const loadEmailsSuccess = createAction(
  '[Email] Load Emails Success',
  props<{
    emails: Email[];
    currentPage: number;
    totalEmails: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPageToken?: string;
    prevPageToken?: string;
  }>()
);
export const updateEmailInList = createAction(
  '[Email] Update Email In List',
  props<{ email: Email }>()
);
export const loadEmailsFailure = createAction(
  '[Email] Load Emails Failure',
  props<{ error: any }>()
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
export const paginateEmails = createAction(
  '[Email List] Paginate Emails',
  props<{ direction: 'next' | 'prev' }>()
);
