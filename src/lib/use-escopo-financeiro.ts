'use client';

import { useEffect, useMemo } from 'react';

import { type VisaoFinanceira, primeiroNome } from '@/data/conta-conjunta';
import { notifyVisaoChanged } from '@/lib/mf-events';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setVisao } from '@/store/slices/conta-conjunta-slice';

export function useEscopoFinanceiro() {
  const dispatch = useAppDispatch();
  const usuario = useAppSelector(state => state.auth.usuario);
  const status = useAppSelector(state => state.contaConjunta.status);
  const parceiro = useAppSelector(state => state.contaConjunta.parceiro);
  const convite = useAppSelector(state => state.contaConjunta.convite);
  const visaoStored = useAppSelector(state => state.contaConjunta.visao);
  const parceiroMeta = useAppSelector(state => state.contaConjunta.parceiroMeta);
  const loading = useAppSelector(state => state.contaConjunta.loading);
  const metaEconomia = useAppSelector(state => state.dashboard.metaEconomia);
  const alertaGastos = useAppSelector(state => state.dashboard.alertaGastos);

  const ativa = status === 'ativa' && Boolean(parceiro);
  const visao: VisaoFinanceira = ativa ? visaoStored : 'eu';

  const usuarioIds = useMemo(() => {
    if (!usuario?.id) return [];
    if (!ativa || !parceiro) return [usuario.id];
    if (visao === 'parceiro') return [parceiro.id];
    if (visao === 'conjunto') return [usuario.id, parceiro.id];
    return [usuario.id];
  }, [ativa, parceiro, usuario?.id, visao]);

  const usuarioIdEscrita = visao === 'parceiro' && parceiro ? parceiro.id : usuario?.id;

  const donoLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    if (usuario?.id) labels[usuario.id] = 'Você';
    if (parceiro) labels[parceiro.id] = primeiroNome(parceiro.nome);
    return labels;
  }, [parceiro, usuario?.id]);

  const metaEconomiaEfetiva =
    visao === 'parceiro' && parceiroMeta
      ? parceiroMeta.metaEconomia
      : visao === 'conjunto' && parceiroMeta
        ? metaEconomia + parceiroMeta.metaEconomia
        : metaEconomia;

  const alertaGastosEfetivo =
    visao === 'parceiro' && parceiroMeta
      ? parceiroMeta.alertaGastos
      : visao === 'conjunto' && parceiroMeta
        ? alertaGastos + parceiroMeta.alertaGastos
        : alertaGastos;

  useEffect(() => {
    notifyVisaoChanged({ visao, usuarioIds });
  }, [visao, usuarioIds]);

  return {
    visao,
    setVisao: (next: VisaoFinanceira) => dispatch(setVisao(next)),
    status,
    parceiro,
    convite,
    loading,
    ativa,
    usuarioIds,
    usuarioIdEscrita,
    donoLabels,
    metaEconomiaEfetiva,
    alertaGastosEfetivo,
    parceiroMeta,
  };
}
