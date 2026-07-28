import { inject, NgZone, OnDestroy, Service, signal } from '@angular/core';
import {
  fromEvent,
  merge,
  Subject,
  Subscription,
  take,
  throttleTime,
  timer,
} from 'rxjs';

const WARNING_AFTER_MS = 25 * 60 * 1000; // 25min
const LOGOUT_AFTER_MS = 30 * 60 * 1000; // 30min
const COUNTDOWN_SECONDS = (LOGOUT_AFTER_MS - WARNING_AFTER_MS) / 1000; // 5min

@Service()
export class InactivityService implements OnDestroy {
  private readonly ngZone = inject(NgZone);

  private readonly warningSubject = new Subject<boolean>();
  private readonly logoutSubject = new Subject<void>();
  private readonly secondsRemainingSubject = new Subject<number>();

  readonly warning$ = this.warningSubject.asObservable();
  readonly logout$ = this.logoutSubject.asObservable();
  readonly secondsRemaining$ = this.secondsRemainingSubject.asObservable();

  private warningTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private logoutTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private countdownSub: Subscription | null = null;
  private activitySub: Subscription | null = null;
  private warningActive = signal(false);

  start(): void {
    this.stop();

    this.ngZone.runOutsideAngular(() => {
      this.activitySub = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'click'),
        fromEvent(document, 'scroll', { passive: true }),
      )
        .pipe(throttleTime(1000))
        .subscribe(() => this.onActivity());

      this.scheduleTimers();
    });
  }

  stop(): void {
    this.activitySub?.unsubscribe();
    this.clearTimers();
    this.countdownSub?.unsubscribe();
    this.warningActive.set(false);
  }

  confirmActive(): void {
    this.warningActive.set(false);
    this.countdownSub?.unsubscribe();
    this.ngZone.run(() => this.warningSubject.next(false));
    this.ngZone.runOutsideAngular(() => this.scheduleTimers());
  }

  private onActivity(): void {
    if (this.warningActive()) return;
    this.scheduleTimers();
  }

  private scheduleTimers(): void {
    this.clearTimers();

    this.warningTimeoutId = setTimeout(
      () => this.triggerWarning(),
      WARNING_AFTER_MS,
    );
    this.logoutTimeoutId = setTimeout(
      () => this.triggerLogout(),
      LOGOUT_AFTER_MS,
    );
  }

  private triggerWarning(): void {
    this.warningActive.set(true);

    this.ngZone.run((): void => {
      this.warningSubject.next(true);
    });

    let remaining = COUNTDOWN_SECONDS;
    this.ngZone.run(() => this.secondsRemainingSubject.next(remaining));

    this.countdownSub = timer(1000, 1000)
      .pipe(take(COUNTDOWN_SECONDS))
      .subscribe(() => {
        remaining -= 1;
        this.ngZone.run(() =>
          this.secondsRemainingSubject.next(Math.max(remaining, 0)),
        );
      });
  }

  private triggerLogout(): void {
    this.countdownSub?.unsubscribe();
    this.ngZone.run(() => {
      this.warningSubject.next(false);
      this.logoutSubject.next();
    });
  }

  private clearTimers() {
    if (this.warningTimeoutId) clearTimeout(this.warningTimeoutId);
    if (this.logoutTimeoutId) clearTimeout(this.logoutTimeoutId);
    this.warningTimeoutId = null;
    this.logoutTimeoutId = null;
  }

  ngOnDestroy() {
    this.stop();
  }
}
