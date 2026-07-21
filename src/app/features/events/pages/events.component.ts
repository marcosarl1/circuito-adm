import { Component, inject, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { EventsService } from "../services/events.service";
import { EventCardComponent } from "../components/event-card/event-card.component";
import { EventFormModalComponent } from "../components/event-form-modal/event-form-modal.component";
import { Event, EventCreatePayload, EventKit } from "../../../shared/models/event.model";
import { finalize } from "rxjs";
import { ApiKeyCancelledError } from "../../../core/http/api-key-cancelled.error";

interface KitForm {
  nome: string;
  itensText: string;
  local_retirada: string;
  data_retirada: string;
}

interface EventFormState {
  nome_evento: string;
  data_realizacao: string;
  cidade: string;
  estado: string;
  organizador: string;
  site_coleta: string;
  data_coleta: string;
  distanciasText: string;
  horario: string;
  url_inscricao: string;
  url_imagem: string;
  categoriasText: string;
  link_edital: string;
  categorias_premiadas: string;
  preco: string;
  precosEntriesText: string;
  patrocinado: boolean;
  percurso: {
    local_largada: string;
    trajeto: string;
  };
  kits: KitForm[];
  camposProtegidosText: string;
  listaPrecosText: string;
}

@Component({
    selector: "app-events",
    imports: [FormsModule, EventCardComponent, EventFormModalComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: "./events.component.html"
})
export class EventsComponent implements OnInit {
  private eventsService = inject(EventsService);

  events: Event[] = [];
  filteredEvents: Event[] = [];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  searchTerm = "";
  successMessage = "";
  errorMessage = "";

  formData: EventFormState = this.createEmptyForm();

  ngOnInit() {
    this.loadEvents();
  }

  currentPage = 1;
  pageSize = 9;
  hasNextPage = true;

  loadEvents() {
    this.loading = true;
    this.eventsService
      .getEvents(this.currentPage, this.pageSize)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => {
          this.events = data || [];
          this.hasNextPage = this.events.length === this.pageSize;
          this.filterEvents();
        },
        error: (error) => {
          this.errorMessage = "Erro ao carregar eventos: " + error.message;
          setTimeout(() => (this.errorMessage = ""), 5000);
        },
      });
  }

  nextPage() {
    if (!this.hasNextPage) return;
    this.currentPage++;
    this.loadEvents();
  }

  previousPage() {
    if (this.currentPage <= 1) return;
    this.currentPage--;
    this.loadEvents();
  }

  filterEvents() {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.filteredEvents = this.events;
      return;
    }

    this.filteredEvents = this.events.filter(
      (event) =>
        event.nome_evento.toLowerCase().includes(term) ||
        event.categorias_premiadas.toLowerCase().includes(term) ||
        event.cidade.toLowerCase().includes(term) ||
        event.estado.toLowerCase().includes(term) ||
        event.organizador.toLowerCase().includes(term),
    );
  }

  openCreateForm() {
    this.resetForm();
    this.showForm = true;
    this.editingId = null;
  }

  syncBucket() {
    this.loading = true;
    this.eventsService
      .syncBucket()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.successMessage = "Sincronização realizada com sucesso!";
          setTimeout(() => (this.successMessage = ""), 5000);
          this.loading = false;
          this.loadEvents();
        },
        error: (error) => {
          if (error instanceof ApiKeyCancelledError) return;
          this.errorMessage = `Erro ao sincronizar: ${error.message}`;
          setTimeout(() => (this.errorMessage = ""), 5000);
        },
      });
  }

  editEvent(event: Event) {
    this.formData = this.mapEventToForm(event);
    this.editingId = event._id;
    this.showForm = true;
  }

  saveEvent() {
    if (!this.validateForm()) {
      this.errorMessage = "Por favor, preencha todos os campos obrigatórios";
      setTimeout(() => (this.errorMessage = ""), 5000);
      return;
    }

    this.loading = true;
    const payload = this.buildPayload();

    const action = this.editingId
      ? this.eventsService.updateEvent(this.editingId, payload)
      : this.eventsService.createEvent(payload);

    action.pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        const msg = this.editingId ? "atualizado" : "criado";
        this.successMessage = `Evento ${msg} com sucesso!`;
        setTimeout(() => (this.successMessage = ""), 5000);
        this.resetForm();
        this.showForm = false;
        this.loadEvents();
      },
      error: (error) => {
        if (error instanceof ApiKeyCancelledError) return;
        this.errorMessage = `Erro ao salvar evento: ${error.message}`;
        this.loading = false;
        setTimeout(() => (this.errorMessage = ""), 5000);
      },
    });
  }

  deleteEvent(id: string) {
    if (!confirm("Tem certeza que deseja deletar este evento?")) {
      return;
    }

    this.loading = true;
    this.eventsService
      .deleteEvent(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.successMessage = "Evento deletado com sucesso!";
          setTimeout(() => (this.successMessage = ""), 5000);
          this.loadEvents();
        },
        error: (error) => {
          if (error instanceof ApiKeyCancelledError) return;
          this.errorMessage = `Erro ao deletar evento: ${error.message}`;
          this.loading = false;
          setTimeout(() => (this.errorMessage = ""), 5000);
        },
      });
  }

  cancelEdit() {
    this.resetForm();
    this.showForm = false;
  }

  onSearch() {
    this.filterEvents();
  }

  getStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      active: "Ativo",
      inactive: "Inativo",
      draft: "Rascunho",
    };

    return labels[status || "active"] || "Ativo";
  }

  getEventId(event: Event): string {
    return event._id;
  }

  getEventTitle(event: Event): string {
    return event.nome_evento || "Evento sem título";
  }

  getEventDescription(event: Event): string {
    return (
      event.categorias_premiadas ||
      event.percurso?.trajeto ||
      event.site_coleta ||
      "Sem descrição disponível"
    );
  }

  getEventDate(event: Event): string {
    return event.data_realizacao || "Data a definir";
  }

  getEventTime(event: Event): string {
    return event.horario || "";
  }

  getEventLocation(event: Event): string {
    return [event.cidade, event.estado].filter(Boolean).join(", ") || "Local a definir";
  }

  getEventOrganizer(event: Event): string {
    return event.organizador || "Organizador não informado";
  }

  getEventDistances(event: Event): string {
    return event.distancias?.length ? event.distancias.join(" · ") : "Distâncias não informadas";
  }

  addKit() {
    this.formData.kits.push(this.createEmptyKit());
  }

  removeKit(index: number) {
    if (this.formData.kits.length === 1) {
      this.formData.kits[0] = this.createEmptyKit();
      return;
    }

    this.formData.kits.splice(index, 1);
  }

  get formattedDataColeta(): string {
    return this.formData.data_coleta;
  }

  private validateForm(): boolean {
    return !!(
      this.formData.nome_evento &&
      this.formData.data_realizacao &&
      this.formData.cidade &&
      this.formData.estado &&
      this.formData.organizador &&
      this.formData.url_inscricao
    );
  }

  private resetForm() {
    this.formData = this.createEmptyForm();
  }

  private createEmptyKit(): KitForm {
    return {
      nome: "",
      itensText: "",
      local_retirada: "",
      data_retirada: "",
    };
  }

  private createEmptyForm(): EventFormState {
    return {
      nome_evento: "",
      data_realizacao: "",
      cidade: "",
      estado: "",
      organizador: "",
      site_coleta: "",
      data_coleta: new Date().toISOString(),
      distanciasText: "",
      horario: "",
      url_inscricao: "",
      url_imagem: "",
      categoriasText: "",
      link_edital: "",
      categorias_premiadas: "",
      preco: "",
      precosEntriesText: "",
      patrocinado: false,
      percurso: {
        local_largada: "",
        trajeto: "",
      },
      kits: [this.createEmptyKit()],
      camposProtegidosText: "",
      listaPrecosText: "",
    };
  }

  private mapEventToForm(event: Event): EventFormState {
    const kits = event.kits?.length ? event.kits : [];

    return {
      nome_evento: event.nome_evento,
      data_realizacao: event.data_realizacao,
      cidade: event.cidade,
      estado: event.estado,
      organizador: event.organizador,
      site_coleta: event.site_coleta,
      data_coleta: event.data_coleta || new Date().toISOString(),
      distanciasText: this.toMultilineText(event.distancias),
      horario: event.horario,
      url_inscricao: event.url_inscricao,
      url_imagem: event.url_imagem,
      categoriasText: this.toMultilineText(event.categorias),
      link_edital: event.link_edital,
      categorias_premiadas: event.categorias_premiadas,
      preco: event.preco,
      precosEntriesText: this.toMultilineText(event.precos_entries),
      patrocinado: Boolean(event.patrocinado),
      percurso: {
        local_largada: event.percurso?.local_largada || "",
        trajeto: event.percurso?.trajeto || "",
      },
      kits: kits.length
        ? kits.map((kit: EventKit) => ({
            nome: kit.nome,
            itensText: this.toMultilineText(kit.itens),
            local_retirada: kit.local_retirada ?? "",
            data_retirada: kit.data_retirada ?? "",
          }))
        : [this.createEmptyKit()],
      camposProtegidosText: this.toMultilineText(event.campos_protegidos),
      listaPrecosText: this.toMultilineText(event.lista_precos),
    };
  }

  private buildPayload(): EventCreatePayload {
    const payload: EventCreatePayload = {
      nome_evento: this.formData.nome_evento,
      data_realizacao: this.formData.data_realizacao,
      cidade: this.formData.cidade,
      estado: this.formData.estado,
      organizador: this.formData.organizador,
      site_coleta: this.formData.site_coleta,
      data_coleta: this.formData.data_coleta,
      distancias: this.splitMultilineText(this.formData.distanciasText),
      url_inscricao: this.formData.url_inscricao,
      url_imagem: this.formData.url_imagem,
      categorias: this.splitMultilineText(this.formData.categoriasText),
      link_edital: this.formData.link_edital,
      categorias_premiadas: this.formData.categorias_premiadas,
      preco: this.formData.preco,
      precos_entries: this.splitMultilineText(this.formData.precosEntriesText),
      patrocinado: this.formData.patrocinado,
      percurso: {
        local_largada: this.formData.percurso.local_largada,
        trajeto: this.formData.percurso.trajeto,
      },
      kits: this.formData.kits.map((kit) => ({
        nome: kit.nome,
        itens: this.splitMultilineText(kit.itensText),
        local_retirada: kit.local_retirada,
        data_retirada: this.isValidDate(kit.data_retirada)
          ? kit.data_retirada
          : new Date().toISOString(),
      })),
      campos_protegidos: this.splitMultilineText(this.formData.camposProtegidosText),
      lista_precos: this.splitMultilineText(this.formData.listaPrecosText),
    };
    if (this.formData.horario?.match(/^\d{2}:\d{2}$/)) {
      payload.horario = this.formData.horario;
    }

    return payload;
  }

  private isValidDate(value: string): boolean {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private toMultilineText(value: string[] | undefined): string {
    return value?.filter(Boolean).join("\n") ?? "";
  }

  private splitMultilineText(value: string): string[] {
    return value
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
}
