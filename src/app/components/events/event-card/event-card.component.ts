import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-card.component.html'
})
export class EventCardComponent {
  @Input({ required: true }) event: any;
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<string>();

  editEvent() {
    this.edit.emit(this.event);
  }

  deleteEvent() {
    const id = this.getEventId(this.event);
    if (id) {
      this.delete.emit(id);
    }
  }

  getStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      active: 'Ativo',
      inactive: 'Inativo',
      draft: 'Rascunho'
    };

    return labels[status || 'active'] || 'Ativo';
  }

  getStatusClass(status?: string): string {
    const classes: Record<string, string> = {
      active: 'bg-[rgba(33,158,188,0.13)] text-[var(--brand-sky-200)]',
      inactive: 'bg-[rgba(153,27,27,0.2)] text-[#fecaca]',
      draft: 'bg-[rgba(255,183,3,0.2)] text-[var(--brand-amber-500)]'
    };

    return classes[status || 'active'] || classes['active'];
  }

  getEventId(event: any): string {
    return event?.id || event?._id || '';
  }

  getEventTitle(event: any): string {
    return event?.name || event?.nome_evento || 'Evento sem título';
  }

  getEventDescription(event: any): string {
    return (
      event?.description ||
      event?.categorias_premiadas ||
      event?.percurso?.trajeto ||
      event?.site_coleta ||
      'Sem descrição disponível'
    );
  }

  getEventDate(event: any): string {
    return event?.date || event?.data_realizacao || 'Data a definir';
  }

  getEventTime(event: any): string {
    return event?.time || event?.horario || '';
  }

  getEventLocation(event: any): string {
    const city = event?.location || event?.cidade || '';
    const state = event?.state || event?.estado || '';
    return [city, state].filter(Boolean).join(', ') || 'Local a definir';
  }

  getEventOrganizer(event: any): string {
    return event?.organizer || event?.organizador || 'Organizador não informado';
  }

  getEventDistances(event: any): string {
    if (Array.isArray(event?.distancias) && event.distancias.length > 0) {
      return event.distancias.join(' · ');
    }

    if (typeof event?.distancias === 'string' && event.distancias.trim()) {
      return event.distancias;
    }

    return 'Não informado';
  }
}
