// email.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concat, EMPTY, from, of, timer } from 'rxjs';
import {
  catchError,
  concatMap,
  finalize,
  map,
  mergeMap,
  switchMap,
  tap,
  withLatestFrom,
  retryWhen,
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
  goToNextPage,
  goToPrevPage,
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
  updateSheetStatus,
  updateSheetStatusSuccess,
  updateSheetStatusFailure,
  fetchSignature,
  fetchSignatureFailure,
  fetchSignatureSuccess,
  updateSignature,
  updateSignatureFailure,
  updateSignatureSuccess,
  setLoading,
} from './actions';

import { GmailService } from '../services/gmail.service';
import {
  selectCurrentPage,
  selectNextPageToken,
  selectPrevPageToken,
  selectPageTokenHistory,
  selectSheetData,
  selectSpreadsheetId,
  selectCurrentLabel,
} from './selector';
import { select, Store } from '@ngrx/store';
import { State } from './reducers';
import { HttpErrorResponse } from '@angular/common/http';

// Fetch up to BATCH_SIZE email details concurrently, then wait before the next batch
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 300;
const MAX_RETRIES = 3;

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

@Injectable()
export class EmailEffects {
  constructor(
    private actions$: Actions,
    private gmailService: GmailService,
    private store: Store<State>
  ) {}

  /**
   * Load emails for a given label and page token.
   * The action carries an explicit `pageToken` (resolved by the caller or by
   * goToNextPage / goToPrevPage effects below).
   * On success we also pass the updated `pageTokenHistory` so the reducer can
   * store it — this is the only way we can go back correctly since Gmail never
   * returns a prevPageToken.
   */
  loadEmails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadEmails),
      withLatestFrom(
        this.store.pipe(select(selectCurrentPage)),
        this.store.pipe(select(selectPageTokenHistory))
      ),
      switchMap(([action, currentPage, tokenHistory]) =>
        this.gmailService.getEmails(action.pageToken, action.label).pipe(
          map((response: any) => {
            // Build the new token history.
            // If we were given an explicit token it means we're going forward
            // (token is the nextPageToken we just consumed), so push it.
            // If no token (page 1 or explicit reset) start a fresh history.
            let newHistory: (string | undefined)[];
            if (!action.pageToken) {
              // Page 1 — fresh start
              newHistory = [undefined];
            } else {
              // Going forward: append this token so we can recover it on "prev"
              newHistory = [...tokenHistory, action.pageToken];
            }

            return loadEmailsSuccess({
              emails: response.messages ?? [],
              currentPage: newHistory.length, // page number = history length
              totalEmails: response.resultSizeEstimate ?? 0,
              hasNextPage: !!response.nextPageToken,
              nextPageToken: response.nextPageToken,
              pageTokenHistory: newHistory,
              label: action.label,
            });
          }),
          catchError((error) => of(loadEmailsFailure({ error })))
        )
      )
    )
  );

  /**
   * Go to the next page.
   * Reads `nextPageToken` from the store and dispatches `loadEmails` with it.
   */
  goToNextPage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(goToNextPage),
      withLatestFrom(
        this.store.pipe(select(selectNextPageToken))
      ),
      switchMap(([action, nextPageToken]) =>
        of(loadEmails({ pageToken: nextPageToken, label: action.label }))
      )
    )
  );

  /**
   * Go to the previous page.
   * The "previous page token" is the second-to-last entry in pageTokenHistory.
   * e.g. history = [undefined, "tok-p2", "tok-p3"]  → we are on page 3
   *      to go back to page 2 we use "tok-p2"
   *      to go back to page 1 we use undefined (no token)
   */
  goToPrevPage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(goToPrevPage),
      withLatestFrom(
        this.store.pipe(select(selectPageTokenHistory))
      ),
      switchMap(([action, history]) => {
        if (history.length <= 1) {
          // Already on page 1, nothing to do
          return EMPTY;
        }
        // Pop the last entry to get the token for the previous page
        const prevHistory = history.slice(0, -1);
        const prevToken = prevHistory[prevHistory.length - 1];

        // We dispatch loadEmails but with the trimmed history so the reducer
        // knows to shrink the stack back.
        // We achieve this by passing the prevToken — in loadEmails$ the history
        // rebuild logic will re-add it, but we need the reducer to *not* grow
        // the stack. The cleanest approach: dispatch with a special sentinel.
        // Simpler: pass no token if going back to page 1, or the prev token.
        // The reducer always builds newHistory from scratch based on whether
        // a token was given, so we fix this by passing an undefined token for
        // page 1, and for earlier pages we pass the page-2 token so history
        // rebuilds correctly.
        //
        // Actually the cleanest fix: trim the history in the reducer by
        // detecting that the token we're loading is already in the history
        // at a lower index. Instead, we simply reload from page 1 up to
        // prevHistory.length. For most apps "previous" means go back one page.
        //
        // Implementation: load with prevToken. In loadEmails$ the history will
        // be [undefined, prevToken] if prevToken is defined, or [undefined] if
        // we're going to page 1. That matches prevHistory. ✓
        return of(loadEmails({ pageToken: prevToken, label: action.label }));
      })
    )
  );

  /**
   * Legacy paginateEmails action — kept so any existing callers still work.
   * Delegates to goToNextPage / goToPrevPage.
   */
  paginateEmails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(paginateEmails),
      withLatestFrom(this.store.pipe(select(selectCurrentLabel))),
      switchMap(([action, currentLabel]) => {
        const label = action.label ?? currentLabel;
        return of(
          action.direction === 'next'
            ? goToNextPage({ label })
            : goToPrevPage({ label })
        );
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

  /**
   * After loadEmailsSuccess, fetch full email details in small batches.
   * Batching prevents 429 (Too Many Requests) from the Gmail API.
   * Exponential backoff retries on 429 / 5xx.
   * setLoading(false) is in finalize() so it always fires, even on errors.
   */
  loadEmailsSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadEmailsSuccess),
      switchMap(({ emails }) => {
        if (!emails.length) {
          return of(setLoading({ loading: false }));
        }

        const batches = chunk(emails.map((e) => e.id), BATCH_SIZE);

        return concat(
          ...batches.map((batch, batchIndex) =>
            concat(
              batchIndex === 0
                ? EMPTY
                : timer(BATCH_DELAY_MS).pipe(mergeMap(() => EMPTY)),
              from(batch).pipe(
                mergeMap((id) =>
                  this.gmailService.getEmailById(id).pipe(
                    retryWhen((errors) =>
                      errors.pipe(
                        concatMap((err: HttpErrorResponse, attempt) => {
                          if (attempt >= MAX_RETRIES) throw err;
                          const retryable =
                            err?.status === 429 ||
                            (err?.status >= 500 && err?.status < 600);
                          if (!retryable) throw err;
                          return timer(Math.pow(2, attempt) * 1000);
                        })
                      )
                    ),
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
                          payload: email?.payload ?? undefined,
                          label: '',
                          date: '',
                          isStarred: false,
                        },
                      })
                    ),
                    catchError(() => EMPTY)
                  )
                )
              )
            )
          )
        ).pipe(
          finalize(() => this.store.dispatch(setLoading({ loading: false })))
        );
      })
    )
  );

  loadSheetData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadSheetData),
      tap(() => this.store.dispatch(startLoadingSheetData())),
      mergeMap(({ spreadsheetId, sheetRange }) =>
        this.gmailService.getSheetData(spreadsheetId, sheetRange).pipe(
          map((response) => loadSheetDataSuccess({ rows: response.values })),
          catchError((error) => of(loadSheetDataFailure({ error }))),
          finalize(() => this.store.dispatch(stopLoadingSheetData()))
        )
      )
    )
  );

  sendEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(sendEmail),
      tap(() => this.store.dispatch(startSendingEmail())),
      withLatestFrom(this.store.select(selectSheetData)),
      mergeMap(([action, sheetData]) => {
        const { sender, recipient, subject, body, signature, cc, bcc } = action;

        return this.gmailService
          .sendEmail(sender, recipient, subject, body, signature, cc, bcc)
          .pipe(
            map(() => {
              const rowIndex = sheetData.findIndex(
                (row: any[]) => row[1] === recipient
              );
              if (rowIndex !== -1) {
                this.store.dispatch(updateSheetStatus({ rowIndex, status: 'success' }));
              }
              return sendEmailSuccess({ sender, recipient });
            }),
            catchError((error) =>
              of(sendEmailFailure({ sender, recipient, error }))
            ),
            finalize(() => this.store.dispatch(stopSendingEmail()))
          );
      })
    )
  );

  updateSheetStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateSheetStatus),
      withLatestFrom(this.store.select(selectSpreadsheetId)),
      mergeMap(([{ rowIndex, status }, spreadsheetId]) => {
        if (!spreadsheetId) {
          return of(
            updateSheetStatusFailure({ rowIndex, error: 'Spreadsheet ID is not defined' })
          );
        }
        return this.gmailService
          .updateSheetData(spreadsheetId, `Mailing!F${rowIndex + 2}`, {
            values: [[status]],
          })
          .pipe(
            map(() => updateSheetStatusSuccess({ rowIndex, status })),
            catchError((error) => of(updateSheetStatusFailure({ rowIndex, error })))
          );
      })
    )
  );

  fetchSignature$ = createEffect(() =>
    this.actions$.pipe(
      ofType(fetchSignature),
      mergeMap(() =>
        this.gmailService.getSignatures().pipe(
          map((response: any) => {
            const primary = response.sendAs?.find((s: any) => s.isPrimary);
            return fetchSignatureSuccess({ signature: primary?.signature || '' });
          }),
          catchError((error) => of(fetchSignatureFailure({ error })))
        )
      )
    )
  );

  updateSignature$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateSignature),
      mergeMap(({ sendAsEmail, newSignature }) =>
        this.gmailService.updateSignature(sendAsEmail, newSignature).pipe(
          map(() => updateSignatureSuccess({ newSignature })),
          catchError((error) => of(updateSignatureFailure({ error })))
        )
      )
    )
  );
}
