import { Component, model, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventFormState, KitForm } from '../../models/event-form-state.model';

@Component({
  selector: 'app-event-form-modal',
  imports: [FormsModule],
  templateUrl: './event-form-modal.component.html',
})
export class EventFormModalComponent {
  formData = model.required<EventFormState>();
  loading = input(false);
  editingId = input<string | null>(null);

  save = output<void>();
  cancel = output<void>();
  addKit = output<void>();
  removeKit = output<number>();

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
}
