
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-event-form-modal',
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './event-form-modal.component.html'
})
export class EventFormModalComponent {
  @Input({ required: true }) formData: any;
  @Input() loading = false;
  @Input() editingId: string | null = null;
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() addKit = new EventEmitter<void>();
  @Output() removeKit = new EventEmitter<number>();

  trackByIndex(index: number) {
    return index;
  }
}
