/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPromotions from '../components/AdminPromotions';
import { ToastProvider } from '../contexts/ToastContext';
import * as contentService from '../services/contentService';

// Mock contentService methods used by AdminPromotions
vi.mock('../services/contentService', () => {
  const basePromo = {
    id: 'p1',
    title: 'Promo Test',
    description: 'Desc',
    price: '80',
    order_index: 0,
    original_price: '120',
    badge: 'Premium',
    icon: 'Sparkles',
    service_item_ids: [],
  };
  return {
    getPromotions: vi.fn().mockResolvedValue([basePromo]),
    getServiceItems: vi.fn().mockResolvedValue([]),
    updatePromotion: vi.fn().mockImplementation(async (_id: string, patch: any) => ({
      ...basePromo,
      ...patch,
    })),
    deletePromotion: vi.fn().mockResolvedValue(undefined),
    createPromotion: vi.fn(),
  };
});

// we don't want real withTimeout to interfere (timeouts). just passthrough.
vi.mock('../api/supa', async (orig) => {
  const mod: any = await (orig as any)();
  return {
    ...mod,
    withTimeout: (p: Promise<any>) => p as any,
  };
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe('AdminPromotions', () => {
  beforeEach(() => {
    // confirm -> true for deletion (jsdom injecte `window.confirm`)
    (globalThis as any).confirm = vi.fn(() => true);
  });

  it('saves a promotion when clicking Enregistrer', async () => {
    const onClose = vi.fn();
    renderWithProviders(<AdminPromotions onClose={onClose} />);
    // Crée l'utilisateur après le render et force l'usage du document jsdom
    const user = userEvent.setup({ document });

    // wait for list to load
    const saveButton = await screen.findByRole('button', { name: /Enregistrer/i });

    // change title
    const titleInput = screen.getByLabelText(/Titre/i) as HTMLInputElement;
    await user.clear(titleInput);
    await user.type(titleInput, 'Promo mise à jour');

    await user.click(saveButton);

    expect(contentService.updatePromotion).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ title: 'Promo mise à jour' })
    );
  });

  it('deletes a promotion when confirming Supprimer', async () => {
    const onClose = vi.fn();
    renderWithProviders(<AdminPromotions onClose={onClose} />);
    const user = userEvent.setup({ document });

    const delButton = await screen.findByRole('button', { name: /Supprimer/i });
    await user.click(delButton);

  expect(contentService.deletePromotion).toHaveBeenCalledWith('p1');

    await waitFor(() => {
      expect(screen.queryByText('Promo Test')).not.toBeInTheDocument();
    });
  });
});
