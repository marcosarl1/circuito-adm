import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { EventCardComponent } from '../../components/events/event-card/event-card.component';
import { EventFormModalComponent } from '../../components/events/event-form-modal/event-form-modal.component';

interface KitForm {
  nome: string;
  itensText: string;
  local_retirada: string;
  data_retirada: string;
}

interface EventFormData {
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
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, EventCardComponent, EventFormModalComponent],
  templateUrl: './events.component.html'
})
export class EventsComponent implements OnInit {
  events: any[] = [];
  filteredEvents: any[] = [];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  searchTerm = '';
  successMessage = '';
  errorMessage = '';

  formData: EventFormData = this.createEmptyForm();

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadEvents();
  }

  /**
   * Carregar eventos da API
   */
  loadEvents() {
    this.loading = true;
    this.apiService.getEvents().subscribe({
      next: (data) => {
        this.events = data.events || data || [];
        this.filterEvents();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erro ao carregar eventos: ' + error.message;
        this.loading = false;
        setTimeout(() => (this.errorMessage = ''), 5000);
      }
    });
  }

  /**
   * Filtrar eventos por termo de busca
   */
  filterEvents() {
    if (!this.searchTerm) {
      this.filteredEvents = this.events;
    } else {
      this.filteredEvents = this.events.filter(
        (event) =>
          this.getEventTitle(event).toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          this.getEventDescription(event).toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          this.getEventLocation(event).toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          this.getEventOrganizer(event).toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  /**
   * Abrir formulário para novo evento
   */
  openCreateForm() {
    this.resetForm();
    this.showForm = true;
    this.editingId = null;
  }

  syncBucket() {
    this.loading = true;
    this.apiService.syncBucket().subscribe({
      next: () => {
        this.successMessage = 'Sincronização realizada com sucesso!';
        setTimeout(() => (this.successMessage = ''), 5000);
        this.loading = false;
        this.loadEvents();
      },
      error: (error) => {
        this.errorMessage = `Erro ao sincronizar: ${error.message}`;
        this.loading = false;
        setTimeout(() => (this.errorMessage = ''), 5000);
      }
    });
  }

  /**
   * Editar evento existente
   */
  editEvent(event: any) {
    this.formData = this.mapEventToForm(event);
    this.editingId = this.getEventId(event);
    this.showForm = true;
  }

  /**
   * Salvar evento (criar ou atualizar)
   */
  saveEvent() {
    if (!this.validateForm()) {
      this.errorMessage = 'Por favor, preencha todos os campos obrigatórios';
      setTimeout(() => (this.errorMessage = ''), 5000);
      return;
    }

    this.loading = true;
    const payload = this.buildPayload();

    const action = this.editingId
      ? this.apiService.updateEvent(this.editingId, payload)
      : this.apiService.createEvent(payload);

    action.subscribe({
      next: () => {
        const msg = this.editingId ? 'atualizado' : 'criado';
        this.successMessage = `Evento ${msg} com sucesso!`;
        setTimeout(() => (this.successMessage = ''), 5000);
        this.resetForm();
        this.showForm = false;
        this.loadEvents();
      },
      error: (error) => {
        this.errorMessage = `Erro ao salvar evento: ${error.message}`;
        this.loading = false;
        setTimeout(() => (this.errorMessage = ''), 5000);
      }
    });
  }

  /**
   * Deletar evento
   */
  deleteEvent(id: string) {
    if (!confirm('Tem certeza que deseja deletar este evento?')) {
      return;
    }

    this.loading = true;
    this.apiService.deleteEvent(id).subscribe({
      next: () => {
        this.successMessage = 'Evento deletado com sucesso!';
        setTimeout(() => (this.successMessage = ''), 5000);
        this.loadEvents();
      },
      error: (error) => {
        this.errorMessage = `Erro ao deletar evento: ${error.message}`;
        this.loading = false;
        setTimeout(() => (this.errorMessage = ''), 5000);
      }
    });
  }

  /**
   * Cancelar edição
   */
  cancelEdit() {
    this.resetForm();
    this.showForm = false;
  }

  /**
   * Validar formulário
   */
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

  /**
   * Resetar formulário
   */
  private resetForm() {
    this.formData = this.createEmptyForm();
  }

  onSearch() {
    this.filterEvents();
  }

  getStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      active: 'Ativo',
      inactive: 'Inativo',
      draft: 'Rascunho'
    };

    return labels[status || 'active'] || 'Ativo';
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

    if (Array.isArray(event?.distanciasFormatadas) && event.distanciasFormatadas.length > 0) {
      return event.distanciasFormatadas.join(' · ');
    }

    return 'Distâncias não informadas';
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

  private createEmptyKit(): KitForm {
    return {
      nome: '',
      itensText: '',
      local_retirada: '',
      data_retirada: ''
    };
  }

  private createEmptyForm(): EventFormData {
    return {
      nome_evento: '',
      data_realizacao: '',
      cidade: '',
      estado: '',
      organizador: '',
      site_coleta: '',
      data_coleta: new Date().toISOString(),
      distanciasText: '',
      horario: '',
      url_inscricao: '',
      url_imagem: '',
      categoriasText: '',
      link_edital: '',
      categorias_premiadas: '',
      preco: '',
      precosEntriesText: '',
      patrocinado: false,
      percurso: {
        local_largada: '',
        trajeto: ''
      },
      kits: [this.createEmptyKit()],
      camposProtegidosText: '',
      listaPrecosText: ''
    };
  }

  private mapEventToForm(event: any): EventFormData {
    const kits = Array.isArray(event?.kits) && event.kits.length > 0 ? event.kits : [null];

    return {
      nome_evento: event?.nome_evento || event?.name || '',
      data_realizacao: event?.data_realizacao || event?.date || '',
      cidade: event?.cidade || event?.location || '',
      estado: event?.estado || '',
      organizador: event?.organizador || event?.organizer || '',
      site_coleta: event?.site_coleta || '',
      data_coleta: event?.data_coleta || new Date().toISOString(),
      distanciasText: this.toMultilineText(event?.distancias),
      horario: event?.horario || event?.time || '',
      url_inscricao: event?.url_inscricao || '',
      url_imagem: event?.url_imagem || '',
      categoriasText: this.toMultilineText(event?.categorias),
      link_edital: event?.link_edital || '',
      categorias_premiadas: event?.categorias_premiadas || event?.description || '',
      preco: event?.preco || '',
      precosEntriesText: this.toMultilineText(event?.precos_entries),
      patrocinado: Boolean(event?.patrocinado),
      percurso: {
        local_largada: event?.percurso?.local_largada || '',
        trajeto: event?.percurso?.trajeto || ''
      },
      kits: kits.map((kit: any) => ({
        nome: kit?.nome || '',
        itensText: this.toMultilineText(kit?.itens),
        local_retirada: kit?.local_retirada || '',
        data_retirada: kit?.data_retirada || ''
      })),
      camposProtegidosText: this.toMultilineText(event?.campos_protegidos),
      listaPrecosText: this.toMultilineText(event?.lista_precos)
    };
  }

  private buildPayload() {
    return {
      nome_evento: this.formData.nome_evento,
      data_realizacao: this.formData.data_realizacao,
      cidade: this.formData.cidade,
      estado: this.formData.estado,
      organizador: this.formData.organizador,
      site_coleta: this.formData.site_coleta,
      data_coleta: this.formData.data_coleta,
      distancias: this.splitMultilineText(this.formData.distanciasText),
      horario: this.formData.horario?.match(/^\d{2}:\d{2}$/) ? this.formData.horario : null,
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
        trajeto: this.formData.percurso.trajeto
      },
      kits: this.formData.kits.map((kit) => ({
        nome: kit.nome,
        itens: this.splitMultilineText(kit.itensText),
        local_retirada: kit.local_retirada,
        data_retirada: kit.data_retirada || new Date().toISOString()
      })),
      campos_protegidos: this.splitMultilineText(this.formData.camposProtegidosText),
      lista_precos: this.splitMultilineText(this.formData.listaPrecosText),
    };
  }

  private toMultilineText(value: unknown): string {
    if (!Array.isArray(value)) {
      return typeof value === 'string' ? value : '';
    }

    return value.filter(Boolean).join('\n');
  }

  private splitMultilineText(value: string): string[] {
    return value
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
}
