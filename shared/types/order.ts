import { z } from 'zod'

export const CURRENCIES = ['USD', 'EUR', 'GBP'] as const
export const PAYMENT_METHODS = ['card', 'paypal', 'apple_pay', 'bank_transfer'] as const
export const COUNTRIES = ['US', 'GB', 'DE', 'FR', 'NG', 'RO', 'CA', 'AU', 'BR', 'IN'] as const

export const OrderSchema = z.object({
  orderId: z.string(),
  createdAt: z.coerce.date(),
  amountCents: z.number().int().nonnegative(),
  currency: z.enum(CURRENCIES),
  billingCountry: z.enum(COUNTRIES),
  shippingCountry: z.enum(COUNTRIES),
  ipCountry: z.enum(COUNTRIES),
  paymentMethod: z.enum(PAYMENT_METHODS),
  accountAgeDays: z.number().int().nonnegative(),
  priorChargebacks: z.number().int().nonnegative(),
  itemCount: z.number().int().positive(),
  customerEmail: z.string().email(),
})

export type Order = z.infer<typeof OrderSchema>

/** Field registry the rule builder, intent agent, and Mongo compiler all share
 * as their single source of truth for what's a valid field to reference, what
 * type it is, and (for enums) what values it can take. Nothing downstream
 * trusts a field name that isn't in this list. */
export const ORDER_FIELDS = {
  amountCents: { label: 'Order amount (cents)', type: 'number' },
  currency: { label: 'Currency', type: 'enum', values: CURRENCIES },
  billingCountry: { label: 'Billing country', type: 'enum', values: COUNTRIES },
  shippingCountry: { label: 'Shipping country', type: 'enum', values: COUNTRIES },
  ipCountry: { label: 'IP country', type: 'enum', values: COUNTRIES },
  paymentMethod: { label: 'Payment method', type: 'enum', values: PAYMENT_METHODS },
  accountAgeDays: { label: 'Account age (days)', type: 'number' },
  priorChargebacks: { label: 'Prior chargebacks', type: 'number' },
  itemCount: { label: 'Item count', type: 'number' },
} as const

export type OrderField = keyof typeof ORDER_FIELDS
export const ORDER_FIELD_NAMES = Object.keys(ORDER_FIELDS) as OrderField[]
