import { CommonModule } from "@angular/common";
import { Component, computed, input, output } from "@angular/core";

@Component({
  selector: "app-inactivity-warning-modal",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./inactivity-warning-modal.component.html",
})
export class InactivityWarningModalComponent {
  secondsRemaining = input.required<number>();
  continueSession = output<void>();

  formattedTime = computed(() => {
    const total = this.secondsRemaining();

    const minutes = Math.floor(total / 60);
    const seconds = total % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  });
}
