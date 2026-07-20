import { Component, OnDestroy, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { SidebarComponent } from "../../shared/components/sidebar/sidebar.component";
import { CommonModule } from "@angular/common";
import { InactivityWarningModalComponent } from "../../shared/components/inactivity-warning-modal/inactivity-warning-modal.component";
import { Subscription } from "rxjs";
import { InactivityService } from "../../core/services/inactivity.service";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-main-layout",
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent, InactivityWarningModalComponent],
  templateUrl: "./main-layout.component.html",
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  showWarning = false;
  secondsRemaining = 0;

  private subs = new Subscription();

  constructor(
    private inactivityService: InactivityService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.inactivityService.start();
    this.subs.add(
      this.inactivityService.warning$.subscribe((visible) => (this.showWarning = visible)),
    );
    this.subs.add(
      this.inactivityService.secondsRemaining$.subscribe((s) => (this.secondsRemaining = s)),
    );
    this.subs.add(this.inactivityService.logout$.subscribe(() => this.authService.logout()));
  }

  continueSession() {
    this.inactivityService.confirmActive();
  }

  ngOnDestroy(): void {
    this.inactivityService.stop();
    this.subs.unsubscribe();
  }
}
