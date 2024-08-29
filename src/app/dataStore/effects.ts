// email.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { from, of } from 'rxjs';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';

import {
  loadEmails,
  loadEmailsSuccess,
  loadEmailsFailure,
  loadEmailDetails,
  loadEmailDetailsSuccess,
  loadEmailDetailsFailure,
  saveEmailDetails,
} from './actions';

import { GmailService } from '../services/gmail.service';

@Injectable()
export class EmailEffects {
  constructor(private actions$: Actions, private gmailService: GmailService) {}

  loadEmails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadEmails),
      switchMap(() =>
        this.gmailService.getEmails().pipe(
          map((response: any) =>
            loadEmailsSuccess({ emails: response.messages })
          ),
          catchError((error) => of(loadEmailsFailure({ error })))
        )
      )
    )
  );

  loadEmailDetails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadEmailDetails),
      switchMap(({ emailId }) =>
        this.gmailService.getEmailById(emailId).pipe(
          map((emailDetails) => loadEmailDetailsSuccess({ emailDetails })),
          catchError((error) => of(loadEmailDetailsFailure({ error })))
        )
      )
    )
  );

  loadEmailsSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadEmailsSuccess),
      mergeMap(({ emails }) => {
        const emailIds = emails.map((email) => email.id);
        return from(emailIds).pipe(
          mergeMap((id) =>
            this.gmailService.getEmailById(id).pipe(
              map((email) =>
                saveEmailDetails({
                  emailDetails: {
                    id: email.id,
                    historyId: email.historyId,
                    internalDate: email.internalDate,
                    labelIds: email.labelIds,
                    sizeEstimate: email.sizeEstimate,
                    snippet: email.snippet,
                    threadId: email.threadId,
                    subject: '',
                    payload: email?.payload || undefined,
                    label: '',
                    date: '',
                    isStarred: false,
                  },
                })
              ),
              catchError((error) => {
                console.error('Error fetching email details:', error);
                return of(); // Handle errors appropriately
              })
            )
          )
        );
      })
    )
  );
}
