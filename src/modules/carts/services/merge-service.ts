import { CartStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

/**
 * Phase 1 stub: merges an anonymous DB cart into the user's active cart.
 * Client localStorage (`inv2026-cart`) remains the source of truth for visitors
 * until the full server cart phase lands. This endpoint is idempotent and safe
 * when no anonymous cart rows exist.
 */
export async function mergeAnonymousCartIntoUserCart(input: {
  anonymousId: string;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const anonymousCart = await tx.cart.findFirst({
      where: {
        anonymousId: input.anonymousId,
        status: { in: [CartStatus.ACTIVE, CartStatus.INACTIVE, CartStatus.ABANDONED] },
      },
      include: { items: true },
    });

    if (!anonymousCart) {
      return { merged: false, cartId: null as string | null };
    }

    let userCart = await tx.cart.findFirst({
      where: { userId: input.userId, status: CartStatus.ACTIVE },
    });

    if (!userCart) {
      userCart = await tx.cart.create({
        data: {
          userId: input.userId,
          status: CartStatus.ACTIVE,
          source: 'merge',
        },
      });
    }

    for (const item of anonymousCart.items) {
      await tx.cartItem.upsert({
        where: {
          cartId_productId_variantId_size_color: {
            cartId: userCart.id,
            productId: item.productId,
            variantId: item.variantId ?? '',
            size: item.size ?? '',
            color: item.color ?? '',
          },
        },
        create: {
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId ?? '',
          size: item.size ?? '',
          color: item.color ?? '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          priceStatus: item.priceStatus,
        },
        update: {
          quantity: { increment: item.quantity },
        },
      });
    }

    await tx.cart.update({
      where: { id: anonymousCart.id },
      data: {
        status: CartStatus.CONVERTED,
        convertedAt: new Date(),
      },
    });

    return { merged: true, cartId: userCart.id };
  });
}
