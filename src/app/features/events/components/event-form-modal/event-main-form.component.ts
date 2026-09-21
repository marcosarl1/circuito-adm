import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ESTADOS_BRASILEIROS } from '../../../../shared/constants/ufs.constants';
import {
  ComboboxComponent,
  ComboboxOption,
} from '../../../../shared/components/combobox/combobox.component';
import { EventFormState } from '../../models/event-form-state.model';
import {
  fromDatetimeLocal,
  toDateTimeLocal,
} from './event-form-datetime.utils';

@Component({
  selector: 'app-event-main-form',
  standalone: true,
  imports: [FormsModule, ComboboxComponent],
  templateUrl: './event-main-form.component.html',
})
export class EventMainFormComponent {
  formData = model.required<EventFormState>();
  submitted = input.required<boolean>();

  nomeError = computed(() =>
    !this.formData().nome_evento.trim() && this.submitted() ? 'Nome é obrigatório' : '',
  );
  dataError = computed(() =>
    !this.formData().data_realizacao.trim() && this.submitted() ? 'Data é obrigatória' : '',
  );
  cidadeError = computed(() =>
    !this.formData().cidade.trim() && this.submitted() ? 'Cidade é obrigatória' : '',
  );
  estadoError = computed(() =>
    !this.formData().estado.trim() && this.submitted() ? 'Estado é obrigatório' : '',
  );
  organizadorError = computed(() =>
    !this.formData().organizador.trim() && this.submitted() ? 'Organizador é obrigatório' : '',
  );

  readonly stateOptions: ComboboxOption[] = ESTADOS_BRASILEIROS.map((uf) => ({
    value: uf.sigla,
    label: uf.nome,
    prefix: uf.sigla,
  }));

  readonly sponsoredOptions: ComboboxOption[] = [
    { value: 'true', label: 'Sim' },
    { value: 'false', label: 'Não' },
  ];

  patch(partial: Partial<EventFormState>) {
    this.formData.update((f) => ({ ...f, ...partial }));
  }

  toDateTimeLocal(value: string): string {
    return toDateTimeLocal(value);
  }

  fromDatetimeLocal(value: string): string {
    return fromDatetimeLocal(value);
  }
}
