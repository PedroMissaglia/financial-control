import type { Meta, StoryObj } from '@storybook/react';

import { TransacaoCard } from '@/components/transacao-card';

const meta: Meta<typeof TransacaoCard> = {
  title: 'Domain/TransacaoCard',
  component: TransacaoCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TransacaoCard>;

export const Deposito: Story = {
  args: {
    id: '1',
    tipo: 'deposito',
    valor: 3500,
    data: '2026-06-01',
    descricao: 'Salário',
  },
};

export const Pagamento: Story = {
  args: {
    id: '2',
    tipo: 'pagamento',
    valor: 1200,
    data: '2026-06-02',
    descricao: 'Aluguel',
    compact: true,
  },
};
