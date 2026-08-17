import type { Meta, StoryObj } from '@storybook/react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Saldo em conta</CardTitle>
        <CardDescription>Resumo financeiro do mês</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="fc-card-metric">R$ 2.560,10</p>
      </CardContent>
    </Card>
  ),
};
