import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventFormState } from '../../models/event-form-state.model';

@Component({
  selector: 'app-event-media-pricing',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './event-media-pricing.component.html',
})
export class EventMediaPricingComponent {
  formData = model.required<EventFormState>();
  submitted = input.required<boolean>();

  urlInscricaoError = computed(() =>
    !this.formData().url_inscricao.trim() && this.submitted()
      ? 'Link de inscrição é obrigatório'
      : '',
  );

  patch(partial: Partial<EventFormState>) {
    this.formData.update((f) => ({ ...f, ...partial }));
  }
}
