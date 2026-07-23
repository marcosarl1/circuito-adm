import {
  Component,
  model,
  input,
  output,
  viewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventFormState, KitForm } from '../../models/event-form-state.model';

@Component({
  selector: 'app-event-form-modal',
  imports: [FormsModule],
  templateUrl: './event-form-modal.component.html',
  host: {
    '(keydown.escape)': 'cancel.emit()',
  },
})
export class EventFormModalComponent {
  formData = model.required<EventFormState>();
  loading = input(false);
  editingId = input<string | null>(null);

  save = output<void>();
  cancel = output<void>();
  addKit = output<void>();
  removeKit = output<number>();

  private firstField = viewChild<ElementRef<HTMLInputElement>>('firstField');

  ngAfterViewInit() {
    this.firstField()?.nativeElement.focus();
  }

  patch(partial: Partial<EventFormState>) {
    this.formData.update((f) => ({ ...f, ...partial }));
  }

  updatePercurso(field: keyof EventFormState['percurso'], value: string) {
    this.formData.update((f) => ({
      ...f,
      percurso: { ...f.percurso, [field]: value },
    }));
  }

  updateKit(index: number, field: keyof KitForm, value: string) {
    this.formData.update((f) => ({
      ...f,
      kits: f.kits.map((kit, i) =>
        i === index ? { ...kit, [field]: value } : kit,
      ),
    }));
  }

  toDateTimeLocal(value: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  fromDatetimeLocal(value: string): string {
    if (!value) return '';
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toISOString();
  }
}
