// email.actions.ts
import { createAction, props } from '@ngrx/store';
import { Email, EmailDetails } from '../dataModel/email-details.model';


export const loadEmails = createAction('[Email] Load Emails');
export const loadEmailsSuccess = createAction(
  '[Email] Load Emails Success',
  props<{ emails: Email[] }>()
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

 