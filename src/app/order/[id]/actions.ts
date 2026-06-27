"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function cancelOrder(orderId: string, token: string) {
  try {
    // Verifikasi pesanan dan token, serta pastikan status masih pending
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, payment_status")
      .eq("id", orderId)
      .eq("access_token", token)
      .single();

    if (fetchError || !order) {
      return { success: false, message: "Pesanan tidak ditemukan atau tidak valid." };
    }

    if (order.payment_status !== "pending") {
      return { success: false, message: "Hanya pesanan pending yang dapat dibatalkan." };
    }

    // Ubah status jadi expired
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: "expired" })
      .eq("id", orderId);

    if (updateError) {
      console.error("Gagal membatalkan pesanan:", updateError);
      return { success: false, message: "Terjadi kesalahan sistem saat membatalkan pesanan." };
    }

    // Dapatkan inventory_id yang ditahan
    const { data: orderItems } = await supabaseAdmin
      .from("order_items")
      .select("inventory_id")
      .eq("order_id", orderId)
      .not("inventory_id", "is", null);

    const inventoryIds = orderItems?.map(item => item.inventory_id).filter(Boolean) || [];

    // Lepaskan stok (inventory_id) dari order_items
    const { error: releaseError } = await supabaseAdmin
      .from("order_items")
      .update({ inventory_id: null })
      .eq("order_id", orderId)
      .not("inventory_id", "is", null);

    if (releaseError) {
      console.error("Gagal melepas stok:", releaseError);
    }

    // Kembalikan status inventory menjadi Available
    if (inventoryIds.length > 0) {
      const { error: inventoryError } = await supabaseAdmin
        .from("inventory")
        .update({ status: 'Available', reserved_until: null })
        .in("id", inventoryIds);
        
      if (inventoryError) {
        console.error("Gagal update status inventory:", inventoryError);
      }
    }

    revalidatePath(`/order/${orderId}`);
    return { success: true, message: "Pesanan berhasil dibatalkan." };
  } catch (error) {
    console.error("Error cancelling order:", error);
    return { success: false, message: "Terjadi kesalahan sistem." };
  }
}
