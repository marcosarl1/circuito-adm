import { IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { Event as CircuitoEvent } from '../../../../shared/models/event.model';

@Component({
  selector: 'app-event-card',
  imports: [NgOptimizedImage],
  templateUrl: './event-card.component.html',
  providers: [
    {
      provide: IMAGE_LOADER,
      useValue: (config: ImageLoaderConfig) => config.src,
    },
  ],
})
export class EventCardComponent {
  event = input.required<CircuitoEvent>();
  priority = input(false);
  edit = output<CircuitoEvent>();
  delete = output<string>();

  onImgError(e: globalThis.Event): void {
    const target = e.target as HTMLElement | null;
    if (target) target.style.display = 'none';
  }

  editEvent() {
    this.edit.emit(this.event());
  }

  deleteEvent() {
    this.delete.emit(this.event()._id);
  }

  title = computed(() => this.event().nome_evento || 'Evento sem título');

  description = computed(
    () =>
      this.event().categorias_premiadas ||
      this.event()?.percurso?.trajeto ||
      this.event()?.site_coleta ||
      'Sem descrição disponível',
  );

  date = computed(() => this.event().data_realizacao || 'Data a definir');

  time = computed(() => {
    const horario = this.event().horario?.trim();

    if (!horario) return '';
    if (this.isPlaceHolderTime(horario)) return 'A definir';
    return horario;
  });

  private isPlaceHolderTime(value: string): boolean {
    const placeholders = [
      'horário de largada não encontrado',
      'em breve',
      'a definir',
      'não informado',
    ];
    return placeholders.includes(value.toLowerCase());
  }

  location = computed(
    () =>
      [this.event().cidade, this.event().estado].filter(Boolean).join(', ') ||
      'Local a definir',
  );

  organizer = computed(
    () => this.event().organizador || 'Organizador não informado',
  );

  distances = computed(() =>
    this.event().distancias?.length
      ? this.event().distancias.join(', ')
      : 'Distâncias não informadas',
  );
}
