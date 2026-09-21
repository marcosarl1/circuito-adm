import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventFormState, KitForm } from '../../models/event-form-state.model';
import {
  fromDatetimeLocal,
  toDateTimeLocal,
} from './event-form-datetime.utils';

@Component({
  selector: 'app-event-route-kits',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './event-route-kits.component.html',
})
export class EventRouteKitsComponent {
  formData = model.required<EventFormState>();
  submitted = input.required<boolean>();

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

  toDateTimeLocal(value: string): string {
    return toDateTimeLocal(value);
  }

  fromDatetimeLocal(value: string): string {
    return fromDatetimeLocal(value);
  }
}
