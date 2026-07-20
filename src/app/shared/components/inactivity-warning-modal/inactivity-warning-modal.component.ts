import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: "app-inactivity-warning-modal",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./inactivity-warning-modal.component.html",
})
export class InactivityWarningModalComponent {
  @Input() secondsRemaining = 0;
  @Output() continueSession = new EventEmitter<void>();

  get formattedTime(): string {
    const minutes = Math.floor(this.secondsRemaining / 60);
    const seconds = this.secondsRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}
