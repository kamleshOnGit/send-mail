// email.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import {
  loadEmails,
  loadEmailsSuccess,
  loadEmailsFailure,
  loadEmailDetails,
  loadEmailDetailsSuccess,
  loadEmailDetailsFailure,
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
}
