import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

import { InactivityWarningModalComponent } from '../../shared/components/inactivity-warning-modal/inactivity-warning-modal.component';
import { InactivityService } from '../../core/services/inactivity.service';
import { AuthService } from '../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadingService } from '../../core/services/loading.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet,
    SidebarComponent,
    InactivityWarningModalComponent,
    ToastComponent,
  ],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private inactivityService = inject(InactivityService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private loadingService = inject(LoadingService);

  loading = this.loadingService.loading;
  showWarning = signal(false);
  secondsRemaining = signal(0);

  ngOnInit(): void {
    this.inactivityService.start();

    this.inactivityService.warning$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
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
