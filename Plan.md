# BlueComputer — Implementation Plan

## Product direction

BlueComputer is a premium Indonesian computer-commerce storefront for curated hardware and accessories. The initial release focuses on a high-confidence brand experience, an authentic catalog and a secure purchase flow. PC Builder is deliberately deferred until a reliable compatibility model exists.

## Technical baseline

- Next.js, TypeScript, App Router, Tailwind CSS and Framer Motion.
- Supabase Auth, Postgres, Storage and RLS; Vercel for deployment.
- Midtrans Snap Sandbox, with server-only token generation and idempotent payment notification handling.
- A complete light and dark visual system, with accessibility and reduced-motion fallbacks.

## MVP

1. Editorial homepage, curated catalog, search/filter, product details, cart and checkout.
2. Email authentication, profile and delivery-address onboarding.
3. Owner, employee and buyer roles enforced in database policies and server routes.
4. Owner/employee product, stock and order workflows; buyer order history.
5. Midtrans Snap order creation, payment status workflow and webhook verification.

## Security decisions

- Users must authenticate before checkout.
- No card information is stored by BlueComputer; Snap collects payment details.
- Browser code only receives public Supabase values and the Midtrans client key.
- Service-role and Midtrans server keys remain server-only.
- RLS protects buyer-owned rows; role lookup is not based on editable user metadata.
- Orders are created with the service-role client because buyers have no insert policy on `orders`; ownership is still checked before an order is resumed.
- The checkout route recalculates product prices, stock and shipping from trusted server data before creating a Snap token.
- The webhook verifies the SHA512 signature, stores each provider event once, and only decrements stock on the first transition to paid.
- Stock is validated when the order is created but is not reserved until payment settles; a production release should add reservation or re-check before fulfilment.
- `decrement_order_stock(uuid)` is a security-definer function that is not executable by `anon` or `authenticated`.

## Implementation status

- Buyer account area: `/akun`, `/akun/profil`, `/akun/alamat`, `/akun/pesanan`, `/akun/pesanan/[orderNumber]`.
- Staff workspace: `/admin`, `/admin/order`, `/admin/produk`; owner-only role management at `/admin/pengguna`.
- Checkout: authenticated gate, saved or inline address, server-side validation, order creation, Snap token, and resume-payment flow.
- Payments: signature-verified webhook, idempotent `payment_events`, status mapping, and stock finalisation.
- Data: declarative schema in `supabase/schemas/bluecomputer.sql`, fixture-aligned seed in `supabase/seed.sql`.
- Remaining external validation: live Supabase migration/RLS, Midtrans Sandbox credentials, public webhook delivery, and Vercel deployment.

## Deferred: PC Builder

The first release only exposes an upcoming-state entry point. A future phase may start with goal-based guided builds, then add component rules for socket, chipset, form factor, PSU wattage, case clearance and cooling.

## Completion checks

- Responsive at 375px, 768px and 1440px.
- Keyboard and visible-focus support; reduced motion disables decorative movement.
- Server recalculates price/stock, checkout retries are bounded, and webhooks cannot double-process.
- Build, lint and TypeScript validation pass before Vercel deployment.
