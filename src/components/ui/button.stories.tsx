import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'success'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Confirmar' },
};

export const Outline: Story = {
  args: { children: 'Cancelar', variant: 'outline' },
};

export const Destructive: Story = {
  args: { children: 'Excluir', variant: 'destructive' },
};

export const Success: Story = {
  args: { children: 'Depositar', variant: 'success' },
};
