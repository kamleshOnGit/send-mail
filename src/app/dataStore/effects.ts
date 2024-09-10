// email.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { from, of } from 'rxjs';
import {
  catchError,
  finalize,
  map,
  mergeMap,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import {
  loadEmails,
  loadEmailsSuccess,
  loadEmailsFailure,
  loadEmailDetails,
  loadEmailDetailsSuccess,
  loadEmailDetailsFailure,
  saveEmailDetails,
  paginateEmails,
  loadSheetData,
  sendEmail,
  loadSheetDataSuccess,
  loadSheetDataFailure,
  sendEmailSuccess,
  sendEmailFailure,
  startLoadingSheetData,
  stopLoadingSheetData,
  startSendingEmail,
  stopSendingEmail,
} from './actions';

import { GmailService } from '../services/gmail.service';
import {
  getCurrentPage,
  selectCurrentPage,
  selectNextPageToken,
  selectPrevPageToken,
} from './selector';
import { select, Store } from '@ngrx/store';
import { State } from './reducers';

@Injectable()
export class EmailEffects {
  constructor(
    private actions$: Actions,
    private gmailService: GmailService,
    private store: Store<State>
  ) {}
  loadEmails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadEmails),
      withLatestFrom(
        this.store.pipe(select(selectNextPageToken)),
        this.store.pipe(select(selectPrevPageToken))
      ),
      switchMap(([action, nextPageToken, prevPageToken]) => {
        const pageToken =
          action.pageToken ??
          (action.currentPage > 1 ? prevPageToken : nextPageToken);

        return this.gmailService.getEmails(pageToken).pipe(
          map((response: any) => {
            const emails = response.messages;
            const totalEmails = response.resultSizeEstimate;
            const hasNextPage = !!response.nextPageToken;
            const hasPrevPage = !!response.prevPageToken;

            return loadEmailsSuccess({
              emails,
              currentPage: action.currentPage,
              totalEmails,
              hasNextPage,
              hasPrevPage,
              nextPageToken: response.nextPageToken,
              prevPageToken: response.prevPageToken,
            });
          }),
          catchError((error) => of(loadEmailsFailure({ error })))
        );
      })
    )
  );

  paginateEmails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(paginateEmails),
      withLatestFrom(
        this.store.pipe(select(selectCurrentPage)),
        this.store.pipe(select(selectNextPageToken)),
        this.store.pipe(select(selectPrevPageToken))
      ),
      switchMap(([action, currentPage, nextPageToken, prevPageToken]) => {
        const pageToken =
          action.direction === 'next' ? nextPageToken : prevPageToken;

        return of(loadEmails({ currentPage, pageToken }));
      })
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
  // Effect to load sheet data
  loadSheetData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadSheetData),
      tap(() => this.store.dispatch(startLoadingSheetData())), // Start loader
      mergeMap(({ spreadsheetId, sheetRange }) =>
        this.gmailService.getSheetData(spreadsheetId, sheetRange).pipe(
          map((response) => loadSheetDataSuccess({ rows: response.values })),
          catchError((error) => of(loadSheetDataFailure({ error }))),
          finalize(() => this.store.dispatch(stopLoadingSheetData())) // Stop loader
        )
      )
    )
  );

  // Effect to send emails
  sendEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(sendEmail),
      tap(() => this.store.dispatch(startSendingEmail())), // Start loader
      mergeMap(({ sender, recipient, subject, body }) =>
        this.gmailService.sendEmail(sender, recipient, subject, body).pipe(
          map(() => sendEmailSuccess({ sender, recipient })),
          catchError((error) =>
            of(sendEmailFailure({ sender, recipient, error }))
          ),
        finalize(() => this.store.dispatch(stopSendingEmail())) // Stop loader
        )
      )
    )
  );
}
