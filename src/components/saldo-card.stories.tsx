import type { Meta, StoryObj } from '@storybook/react';

import { SaldoCard } from '@/components/saldo-card';

const meta: Meta<typeof SaldoCard> = {
  title: 'Domain/SaldoCard',
  component: SaldoCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SaldoCard>;

export const Positivo: Story = {
  args: { saldo: 2560.1 },
};

export const Negativo: Story = {
  args: { saldo: -320.5 },
};
