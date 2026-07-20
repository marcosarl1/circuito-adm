import { Injectable, NgZone, OnDestroy } from "@angular/core";
import { fromEvent, merge, Subject, Subscription, throttleTime, timer } from "rxjs";

const WARNING_AFTER_MS = 25 * 60 * 1000; // 25min
const LOGOUT_AFTER_MS = 30 * 60 * 1000; // 30min
const COUNTDOWN_SECONDS = (LOGOUT_AFTER_MS - WARNING_AFTER_MS) / 1000; // 5min

@Injectable({
  providedIn: "root",
})
export class InactivityService implements OnDestroy {
  private warningSubject = new Subject<boolean>();
  private logoutSubject = new Subject<void>();
  private secondsRemainingSubject = new Subject<number>();

  warning$ = this.warningSubject.asObservable();
  logout$ = this.logoutSubject.asObservable();
  secondsRemaining$ = this.secondsRemainingSubject.asObservable();

  private warningTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private logoutTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private countdownSub: Subscription | null = null;
  private activitySub: Subscription | null = null;
  private warningActive = false;

  constructor(private ngZone: NgZone) {}

  start() {
    this.stop();

    this.ngZone.runOutsideAngular(() => {
      this.activitySub = merge(
        fromEvent(document, "mousemove"),
        fromEvent(document, "keydown"),
        fromEvent(document, "click"),
        fromEvent(document, "scroll", { passive: true }),
      )
        .pipe(throttleTime(1000))
        .subscribe(() => this.onActivity);

      this.scheduleTimers();
    });
  }

  stop() {
    this.activitySub?.unsubscribe();
    this.clearTimers();
    this.countdownSub?.unsubscribe();
    this.warningActive = false;
  }

  confirmActive() {
    this.warningActive = false;
    this.countdownSub?.unsubscribe();
    this.ngZone.run(() => this.warningSubject.next(false));
    this.ngZone.runOutsideAngular(() => this.scheduleTimers());
  }

  private onActivity() {
    if (this.warningActive) return;
    this.scheduleTimers();
  }

  private scheduleTimers() {
    this.clearTimers();

    this.warningTimeoutId = setTimeout(() => this.triggerWarning(), WARNING_AFTER_MS);
    this.logoutTimeoutId = setTimeout(() => this.triggerLogout(), LOGOUT_AFTER_MS);
  }

  private triggerWarning() {
    this.warningActive = true;

    this.ngZone.run(() => {
      this.warningSubject.next(true);
    });

    let remaining = COUNTDOWN_SECONDS;
    this.ngZone.run(() => this.secondsRemainingSubject.next(remaining));

    this.countdownSub = timer(1000, 1000).subscribe(() => {
      remaining -= 1;
      this.ngZone.run(() => this.secondsRemainingSubject.next(Math.max(remaining, 0)));
    });
  }

  private triggerLogout() {
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
