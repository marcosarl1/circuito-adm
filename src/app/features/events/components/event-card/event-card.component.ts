import { Component, input, output } from '@angular/core';
import { Event } from '../../../../shared/models/event.model';

@Component({
  selector: 'app-event-card',
  imports: [],
  templateUrl: './event-card.component.html',
})
export class EventCardComponent {
  event = input.required<Event>();
  edit = output<Event>();
  delete = output<string>();

  editEvent() {
    this.edit.emit(this.event());
  }

  deleteEvent() {
    this.delete.emit(this.event()._id);
  }

  getEventTitle(): string {
    return this.event().nome_evento || 'Evento sem título';
  }

  getEventDescription(): string {
    return (
      this.event().categorias_premiadas ||
      this.event()?.percurso?.trajeto ||
      this.event()?.site_coleta ||
      'Sem descrição disponível'
    );
  }

  getEventDate(): string {
    return this.event().data_realizacao || 'Data a definir';
  }

  getEventTime(): string {
    const horario = this.event().horario?.trim();

    if (!horario) return '';
    if (this.isPlaceHolderTime(horario)) return 'A definir';
    return horario;
  }

  private isPlaceHolderTime(value: string): boolean {
    const placeholders = [
      'horário de largada não encontrado',
      'em breve',
      'a definir',
      'não informado',
    ];
    return placeholders.includes(value.toLowerCase());
  }

  getEventLocation(): string {
    return (
      [this.event().cidade, this.event().estado].filter(Boolean).join(', ') ||
      'Local a definir'
    );
  }

  getEventOrganizer(): string {
    return this.event().organizador || 'Organizador não informado';
  }

  getEventDistances(): string {
    return this.event().distancias?.length
      ? this.event().distancias.join(', ')
      : 'Distâncias não informadas';
  }
}
