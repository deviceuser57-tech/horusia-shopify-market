import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, createStorefrontCheckout } from '@/lib/shopify';
import { supabase } from '@/integrations/supabase/client';

export interface LocalCartItem {
  productId: string;
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
  quantity: number;
}

export type PaymentGateway = 'PAYMOB' | 'STRIPE';

interface CartStore {
  items: CartItem[];
  localItems: LocalCartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  isLoading: boolean;

  addItem: (item: CartItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  setCartId: (cartId: string) => void;
  setCheckoutUrl: (url: string) => void;
  setLoading: (loading: boolean) => void;
  createCheckout: () => Promise<void>;

  addLocalItem: (item: Omit<LocalCartItem, 'quantity'> & { quantity?: number }) => void;
  updateLocalQuantity: (productId: string, quantity: number) => void;
  removeLocalItem: (productId: string) => void;
  clearLocalItems: () => void;
  checkoutLocal: (gateway?: PaymentGateway) => Promise<string | null>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      localItems: [],
      cartId: null,
      checkoutUrl: null,
      isLoading: false,

      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find(i => i.variantId === item.variantId);

        if (existingItem) {
          set({
            items: items.map(i =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          });
        } else {
          set({ items: [...items, item] });
        }
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        set({
          items: get().items.map(item =>
            item.variantId === variantId ? { ...item, quantity } : item
          )
        });
      },

      removeItem: (variantId) => {
        set({
          items: get().items.filter(item => item.variantId !== variantId)
        });
      },

      clearCart: () => {
        set({ items: [], localItems: [], cartId: null, checkoutUrl: null });
      },

      setCartId: (cartId) => set({ cartId }),
      setCheckoutUrl: (checkoutUrl) => set({ checkoutUrl }),
      setLoading: (isLoading) => set({ isLoading }),

      createCheckout: async () => {
        const { items, setLoading, setCheckoutUrl } = get();
        if (items.length === 0) return;

        setLoading(true);
        try {
          const checkoutUrl = await createStorefrontCheckout(items);
          setCheckoutUrl(checkoutUrl);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Failed to create checkout:', error);
          }
        } finally {
          setLoading(false);
        }
      },

      addLocalItem: (item) => {
        const { localItems } = get();
        const qty = item.quantity ?? 1;
        const existing = localItems.find(i => i.productId === item.productId);
        if (existing) {
          set({
            localItems: localItems.map(i =>
              i.productId === item.productId ? { ...i, quantity: i.quantity + qty } : i
            ),
          });
        } else {
          set({ localItems: [...localItems, { ...item, quantity: qty }] });
        }
      },

      updateLocalQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeLocalItem(productId);
          return;
        }
        set({
          localItems: get().localItems.map(i =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        });
      },

      removeLocalItem: (productId) => {
        set({ localItems: get().localItems.filter(i => i.productId !== productId) });
      },

      clearLocalItems: () => set({ localItems: [] }),

      checkoutLocal: async (gateway = 'PAYMOB') => {
        const { localItems, setLoading, setCheckoutUrl } = get();
        if (localItems.length === 0) return null;

        setLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke('create-checkout', {
            body: {
              paymentGateway: gateway,
              items: localItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
            },
          });
          if (error || !data?.checkoutUrl) {
            throw new Error(error?.message || data?.error || 'Checkout creation failed');
          }
          setCheckoutUrl(data.checkoutUrl);
          return data.checkoutUrl as string;
        } finally {
          setLoading(false);
        }
      },
    }),
    {
      name: 'shopify-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
