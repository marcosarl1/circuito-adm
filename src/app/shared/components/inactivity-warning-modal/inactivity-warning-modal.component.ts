
import { Component, computed, input, output, ChangeDetectionStrategy } from "@angular/core";

@Component({
    selector: "app-inactivity-warning-modal",
    imports: [],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: "./inactivity-warning-modal.component.html"
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
