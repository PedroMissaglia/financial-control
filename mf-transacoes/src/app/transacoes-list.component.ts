import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import {
  formatCurrency,
  formatDateShort,
  isEntrada,
  labelCategoria,
  labelFormaPagamento,
  TIPO_LABELS,
  Transacao,
  type FormaPagamento,
  type TipoTransacao,
} from './models';
import { createPtBrPaginatorIntl } from './paginator-intl.pt-br';
import {
  intervaloCompetencia,
  mesesAteCorrente,
  temFiltrosAtivos,
  type MesLista,
} from './transacoes-meses';
import { TransacoesService } from './transacoes.service';

export interface TransacoesFiltros {
  busca: string;
  tipo: string;
  categoria: string;
  formaPagamento: string;
  dataInicio: string;
  dataFim: string;
  valorMin: number | null;
  valorMax: number | null;
}

export const FILTROS_VAZIOS: TransacoesFiltros = {
  busca: '',
  tipo: '',
  categoria: '',
  formaPagamento: '',
  dataInicio: '',
  dataFim: '',
  valorMin: null,
  valorMax: null,
};

const PAGE_SIZE_OPTIONS = [5, 8, 10, 20] as const;
const DEFAULT_PAGE_SIZE = 8;
const FILTROS_DEBOUNCE_MS = 300;

function normalizarPageSize(value: unknown): number {
  return PAGE_SIZE_OPTIONS.includes(value as (typeof PAGE_SIZE_OPTIONS)[number])
    ? (value as number)
    : DEFAULT_PAGE_SIZE;
}

@Component({
  selector: 'mf-transacoes-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatPaginatorModule,
    MatTableModule,
  ],
  providers: [{ provide: MatPaginatorIntl, useFactory: createPtBrPaginatorIntl }],
  templateUrl: './transacoes-list.component.html',
  styleUrl: './transacoes-list.component.css',
})
export class TransacoesListComponent implements OnChanges, OnDestroy, OnInit {
  @Input() apiUrl = 'http://127.0.0.1:3001';
  @Input() usuarioId = '';
  @Input() accessToken = '';
  @Input() filtros: TransacoesFiltros = FILTROS_VAZIOS;
  @Input() pageSize = DEFAULT_PAGE_SIZE;
  @Input() categoriaLabels: Record<string, string> = {};

  pageSizeAtivo = DEFAULT_PAGE_SIZE;
  page = 1;
  total = 0;
  totalUnfiltered = 0;
  mesAberto: string | null = null;
  meses: MesLista[] = mesesAteCorrente();

  @ViewChild(MatPaginator)
  set paginatorRef(paginator: MatPaginator | undefined) {
    this.paginator = paginator;
    if (!paginator) return;
    paginator.pageSize = this.pageSizeAtivo;
    paginator.pageIndex = Math.max(0, this.page - 1);
    paginator.length = this.total;
    this.cdr.markForCheck();
  }

  private paginator?: MatPaginator;
  private filtrosTimer?: ReturnType<typeof setTimeout>;
  private loadSeq = 0;

  readonly displayedColumns = ['descricao', 'tipo', 'categoria', 'pagamento', 'data', 'valor', 'acoes'] as const;
  readonly pageSizeOptions = [...PAGE_SIZE_OPTIONS];

  dataSource = new MatTableDataSource<Transacao>([]);
  items: Transacao[] = [];
  carregando = false;
  erro: string | null = null;
  private fetchedLabels: Record<string, string> = {};

  constructor(
    private readonly service: TransacoesService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get filtrosAtivos(): boolean {
    return temFiltrosAtivos(this.filtros);
  }

  get mostraLista(): boolean {
    return this.filtrosAtivos || this.mesAberto != null;
  }

  ngOnInit(): void {
    this.pageSizeAtivo = normalizarPageSize(this.pageSize);
    window.addEventListener('fincontrol:transacoes-changed', this.onTransacoesChanged);
    window.addEventListener('fincontrol:categorias-changed', this.onCategoriasChanged);
    this.meses = mesesAteCorrente();
    void this.carregarLabels();
    void this.carregar();
  }

  ngOnDestroy(): void {
    window.removeEventListener('fincontrol:transacoes-changed', this.onTransacoesChanged);
    window.removeEventListener('fincontrol:categorias-changed', this.onCategoriasChanged);
    if (this.filtrosTimer) clearTimeout(this.filtrosTimer);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filtros'] && !changes['filtros'].firstChange) {
      this.mesAberto = null;
      this.limparLista();
      this.scheduleCarregar(true);
    }

    if (changes['pageSize'] && !changes['pageSize'].firstChange) {
      const size = normalizarPageSize(this.pageSize);
      if (this.pageSizeAtivo !== size) {
        this.pageSizeAtivo = size;
        this.page = 1;
        void this.carregar();
      }
    }

    if (
      (changes['apiUrl'] && !changes['apiUrl'].firstChange)
      || (changes['usuarioId'] && !changes['usuarioId'].firstChange)
      || (changes['accessToken'] && !changes['accessToken'].firstChange)
    ) {
      void this.carregar();
      void this.carregarLabels();
    }

    if (changes['categoriaLabels'] && !changes['categoriaLabels'].firstChange) {
      this.cdr.markForCheck();
    }
  }

  async carregar(): Promise<void> {
    if (!this.usuarioId) {
      this.items = [];
      this.total = 0;
      this.totalUnfiltered = 0;
      this.dataSource.data = [];
      this.emitMeta();
      this.syncPaginator();
      return;
    }

    if (!this.mostraLista) {
      await this.carregarMeta();
      return;
    }

    const seq = ++this.loadSeq;
    this.carregando = true;
    this.erro = null;
    this.cdr.detectChanges();

    try {
      const result = await this.service.listar(this.apiUrl, this.usuarioId, this.accessToken, {
        page: this.page,
        pageSize: this.pageSizeAtivo,
        filtros: this.filtrosDaLista(),
      });

      if (seq !== this.loadSeq) return;

      if (result.items.length === 0 && this.page > 1 && result.total > 0) {
        this.page = Math.max(1, Math.ceil(result.total / this.pageSizeAtivo));
        await this.carregar();
        return;
      }

      this.items = result.items;
      this.total = result.total;
      this.totalUnfiltered = result.totalUnfiltered;
      this.page = result.page || this.page;
      this.dataSource.data = result.items;
      this.emitMeta();
      this.syncPaginator();
    } catch {
      if (seq !== this.loadSeq) return;
      this.erro = 'Não foi possível carregar as transações.';
      this.items = [];
      this.total = 0;
      this.dataSource.data = [];
      this.emitMeta();
      this.syncPaginator();
    } finally {
      if (seq === this.loadSeq) {
        this.carregando = false;
        this.cdr.detectChanges();
      }
    }
  }

  alternarMes(competencia: string): void {
    if (this.mesAberto === competencia) {
      this.mesAberto = null;
      this.limparLista();
      this.cdr.markForCheck();
      return;
    }

    this.mesAberto = competencia;
    this.page = 1;
    this.limparLista();
    void this.carregar();
  }

  trackByCompetencia(_index: number, mes: MesLista): string {
    return mes.competencia;
  }

  panelId(competencia: string): string {
    return `mes-panel-${competencia}`;
  }

  navegar(href: string): void {
    window.dispatchEvent(new CustomEvent('fincontrol:navigate', { detail: { href } }));
  }

  confirmarExclusao(transacao: Transacao): void {
    window.dispatchEvent(
      new CustomEvent('fincontrol:delete-transacao', {
        detail: { id: transacao.id, descricao: transacao.descricao },
      }),
    );
  }

  tipoLabel(tipo: Transacao['tipo']): string {
    return TIPO_LABELS[tipo];
  }

  tipoBadgeClass(tipo: TipoTransacao): string {
    return `fc-badge fc-badge-tipo-${tipo}`;
  }

  pagBadgeClass(forma: FormaPagamento): string {
    return `fc-badge fc-badge-pag-${forma}`;
  }

  categoriaLabel(categoria: Transacao['categoria']): string {
    return labelCategoria(categoria, { ...this.fetchedLabels, ...this.categoriaLabels });
  }

  formaLabel(value: Transacao['formaPagamento']): string {
    return labelFormaPagamento(value);
  }

  entrada(tipo: Transacao['tipo']): boolean {
    return isEntrada(tipo);
  }

  moeda(valor: number): string {
    return formatCurrency(valor);
  }

  dataCurta(data: string): string {
    return formatDateShort(data);
  }

  onPaginatorChange(event: PageEvent): void {
    const nextSize = normalizarPageSize(event.pageSize);
    if (nextSize !== this.pageSizeAtivo) {
      this.pageSizeAtivo = nextSize;
      this.page = 1;
      window.dispatchEvent(
        new CustomEvent('fincontrol:transacoes-page-size', { detail: { pageSize: nextSize } }),
      );
    } else {
      this.page = event.pageIndex + 1;
    }

    void this.carregar();
  }

  private limparLista(): void {
    this.loadSeq += 1;
    this.items = [];
    this.total = 0;
    this.dataSource.data = [];
    this.erro = null;
    this.carregando = false;
    this.syncPaginator();
  }

  private filtrosDaLista(): TransacoesFiltros {
    if (!this.filtrosAtivos && this.mesAberto) {
      const intervalo = intervaloCompetencia(this.mesAberto);
      return { ...FILTROS_VAZIOS, dataInicio: intervalo.dataInicio, dataFim: intervalo.dataFim };
    }
    return this.filtros ?? FILTROS_VAZIOS;
  }

  private async carregarMeta(): Promise<void> {
    const seq = ++this.loadSeq;
    this.items = [];
    this.total = 0;
    this.dataSource.data = [];
    this.erro = null;
    this.syncPaginator();

    try {
      const result = await this.service.listar(this.apiUrl, this.usuarioId, this.accessToken, {
        page: 1,
        pageSize: 1,
        filtros: FILTROS_VAZIOS,
      });
      if (seq !== this.loadSeq) return;
      this.totalUnfiltered = result.totalUnfiltered;
      this.emitMeta();
    } catch {
      if (seq !== this.loadSeq) return;
      this.emitMeta();
    } finally {
      if (seq === this.loadSeq) this.cdr.detectChanges();
    }
  }

  private async carregarLabels(): Promise<void> {
    if (!this.usuarioId) {
      this.fetchedLabels = {};
      return;
    }

    try {
      this.fetchedLabels = await this.service.listarCategoriaLabels(
        this.apiUrl,
        this.usuarioId,
        this.accessToken,
      );
      this.cdr.markForCheck();
    } catch {
      this.fetchedLabels = {};
    }
  }

  private scheduleCarregar(resetPage: boolean): void {
    if (this.filtrosTimer) clearTimeout(this.filtrosTimer);
    this.filtrosTimer = setTimeout(() => {
      if (resetPage) this.page = 1;
      void this.carregar();
    }, FILTROS_DEBOUNCE_MS);
  }

  private syncPaginator(): void {
    if (!this.paginator) return;
    this.paginator.length = this.total;
    this.paginator.pageSize = this.pageSizeAtivo;
    this.paginator.pageIndex = Math.max(0, this.page - 1);
  }

  private emitMeta(): void {
    window.dispatchEvent(
      new CustomEvent('fincontrol:transacoes-page-meta', {
        detail: { total: this.total, totalUnfiltered: this.totalUnfiltered },
      }),
    );
  }

  private readonly onTransacoesChanged = (): void => {
    void this.carregar();
  };

  private readonly onCategoriasChanged = (): void => {
    void this.carregarLabels();
  };
}
