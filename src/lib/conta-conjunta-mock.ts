import {
  CONTA_CONJUNTA_VAZIA,
  type ContaConjuntaView,
} from '@/data/conta-conjunta';
import type { UsuarioPublico } from '@/data/usuarios';

const STORE_KEY = 'fincontrol:conta-conjunta-store';

interface StoreItem {
  id: string;
  status: 'pendente' | 'ativa';
  convidanteId: string;
  convidanteNome: string;
  convidanteEmail: string;
  convidadoId: string;
  convidadoNome: string;
  convidadoEmail: string;
  criadoEm: string;
}

interface Store {
  itens: StoreItem[];
}

function readStore(): Store {
  if (typeof window === 'undefined') return { itens: [] };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { itens: [] };
    const parsed = JSON.parse(raw) as Store;
    return { itens: Array.isArray(parsed.itens) ? parsed.itens : [] };
  } catch {
    return { itens: [] };
  }
}

function writeStore(store: Store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function findForUser(itens: StoreItem[], usuarioId: string): StoreItem | undefined {
  return itens.find(item => item.convidanteId === usuarioId || item.convidadoId === usuarioId);
}

function toView(item: StoreItem | undefined, usuarioId: string): ContaConjuntaView {
  if (!item) return CONTA_CONJUNTA_VAZIA;

  const souConvidante = item.convidanteId === usuarioId;
  const parceiro = souConvidante
    ? { id: item.convidadoId, nome: item.convidadoNome, email: item.convidadoEmail }
    : { id: item.convidanteId, nome: item.convidanteNome, email: item.convidanteEmail };

  const convite = {
    id: item.id,
    email: item.convidadoEmail,
    criadoEm: item.criadoEm,
  };

  if (item.status === 'ativa') {
    return { status: 'ativa', parceiro, convite: null };
  }

  return {
    status: souConvidante ? 'convite_enviado' : 'convite_recebido',
    parceiro,
    convite,
  };
}

export function mockGetView(usuario: UsuarioPublico): ContaConjuntaView {
  return toView(findForUser(readStore().itens, usuario.id), usuario.id);
}

export function mockConvidar(
  usuario: UsuarioPublico,
  convidado: UsuarioPublico,
): { ok: true; data: ContaConjuntaView } | { ok: false; message: string } {
  if (convidado.id === usuario.id || convidado.email === usuario.email) {
    return { ok: false, message: 'Você não pode convidar a si mesmo' };
  }

  const store = readStore();
  if (findForUser(store.itens, usuario.id)) {
    return { ok: false, message: 'Você já tem uma conta conjunta ou um convite pendente' };
  }
  if (findForUser(store.itens, convidado.id)) {
    return { ok: false, message: 'Esta pessoa já participa de uma conta conjunta ou tem um convite pendente' };
  }

  const item: StoreItem = {
    id: `convite-${Date.now()}`,
    status: 'pendente',
    convidanteId: usuario.id,
    convidanteNome: usuario.nome,
    convidanteEmail: usuario.email,
    convidadoId: convidado.id,
    convidadoNome: convidado.nome,
    convidadoEmail: convidado.email,
    criadoEm: new Date().toISOString(),
  };
  store.itens.push(item);
  writeStore(store);
  return { ok: true, data: toView(item, usuario.id) };
}

export function mockAceitar(usuario: UsuarioPublico, id: string): { ok: true; data: ContaConjuntaView } | { ok: false; message: string } {
  const store = readStore();
  const item = store.itens.find(entry => entry.id === id);
  if (!item || item.status !== 'pendente') return { ok: false, message: 'Convite não encontrado' };
  if (item.convidadoId !== usuario.id) return { ok: false, message: 'Só quem foi convidado pode aceitar' };
  item.status = 'ativa';
  writeStore(store);
  return { ok: true, data: toView(item, usuario.id) };
}

export function mockRecusar(usuario: UsuarioPublico, id: string): { ok: true; data: ContaConjuntaView } | { ok: false; message: string } {
  const store = readStore();
  const item = store.itens.find(entry => entry.id === id);
  if (!item || item.status !== 'pendente') return { ok: false, message: 'Convite não encontrado' };
  if (item.convidadoId !== usuario.id) return { ok: false, message: 'Só quem foi convidado pode recusar' };
  writeStore({ itens: store.itens.filter(entry => entry.id !== id) });
  return { ok: true, data: CONTA_CONJUNTA_VAZIA };
}

export function mockCancelar(usuario: UsuarioPublico, id: string): { ok: true; data: ContaConjuntaView } | { ok: false; message: string } {
  const store = readStore();
  const item = store.itens.find(entry => entry.id === id);
  if (!item || item.status !== 'pendente') return { ok: false, message: 'Convite não encontrado' };
  if (item.convidanteId !== usuario.id) return { ok: false, message: 'Só quem enviou o convite pode cancelar' };
  writeStore({ itens: store.itens.filter(entry => entry.id !== id) });
  return { ok: true, data: CONTA_CONJUNTA_VAZIA };
}

export function mockEncerrar(usuario: UsuarioPublico): { ok: true; data: ContaConjuntaView } | { ok: false; message: string } {
  const store = readStore();
  const item = findForUser(store.itens, usuario.id);
  if (!item || item.status !== 'ativa') return { ok: false, message: 'Você não tem uma conta conjunta ativa' };
  writeStore({ itens: store.itens.filter(entry => entry.id !== item.id) });
  return { ok: true, data: CONTA_CONJUNTA_VAZIA };
}
