import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { SidebarComponent } from "../../shared/components/sidebar/sidebar.component";

import { InactivityWarningModalComponent } from "../../shared/components/inactivity-warning-modal/inactivity-warning-modal.component";
import { InactivityService } from "../../core/services/inactivity.service";
import { AuthService } from "../../core/services/auth.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: "app-main-layout",
  imports: [RouterOutlet, SidebarComponent, InactivityWarningModalComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: "./main-layout.component.html",
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  showWarning = signal(false);
  secondsRemaining = signal(0);

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private inactivityService: InactivityService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.inactivityService.start();

    this.inactivityService.warning$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.showWarning.set(value);
    });

    this.inactivityService.secondsRemaining$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.secondsRemaining.set(value);
      });

    this.inactivityService.logout$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.authService.logout());
  }

  continueSession() {
    this.inactivityService.confirmActive();
  }

  ngOnDestroy(): void {
    this.inactivityService.stop();
  }
}
