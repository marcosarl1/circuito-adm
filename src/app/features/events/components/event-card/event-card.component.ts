import { CommonModule } from "@angular/common";
import { Component, Input, Output, EventEmitter } from "@angular/core";
import { Event } from "../../../../shared/models/event.model";

@Component({
  selector: "app-event-card",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./event-card.component.html",
})
export class EventCardComponent {
  @Input({ required: true }) event!: Event;
  @Output() edit = new EventEmitter<Event>();
  @Output() delete = new EventEmitter<string>();

  editEvent() {
    this.edit.emit(this.event);
  }

  deleteEvent() {
    this.delete.emit(this.event._id);
  }

  getEventTitle(): string {
    return this.event.nome_evento || "Evento sem título";
  }

  getEventDescription(): string {
    return (
      this.event.categorias_premiadas ||
      this.event?.percurso?.trajeto ||
      this.event?.site_coleta ||
      "Sem descrição disponível"
    );
  }

  getEventDate(): string {
    return this.event.data_realizacao || "Data a definir";
  }

  getEventTime(): string {
    return this.event.horario || "";
  }

  getEventLocation(): string {
    return [this.event.cidade, this.event.estado].filter(Boolean).join(", ") || "Local a definir";
  }

  getEventOrganizer(): string {
    return this.event.organizador || "Organizador não informado";
  }

  getEventDistances(): string {
    return this.event.distancias?.length
      ? this.event.distancias.join(", ")
      : "Distâncias não informadas";
  }
}
