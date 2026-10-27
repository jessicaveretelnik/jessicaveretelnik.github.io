// Test-only durable order recording. Not connected to HTTP routes or fulfillment.
// db must be a dedicated PostgreSQL client with query(sql, params) on ONE connection.
export async function recordVerifiedTestEvent(db, verified) {
  if (!verified?.verified || verified.fulfilled !== false ||
      !/^evt_[A-Za-z0-9_]+$/.test(verified.eventId ?? "") ||
      typeof verified.eventType !== "string" ||
      (verified.checkoutSessionId && !/^cs_test_[A-Za-z0-9_]+$/.test(verified.checkoutSessionId))) {
    throw Error("Verified test event required");
  }
  await db.query("BEGIN");
  try {
    const event = await db.query(
      `INSERT INTO stripe_test_events(event_id,event_type,session_id,payment_status)
       VALUES($1,$2,$3,$4) ON CONFLICT(event_id) DO NOTHING RETURNING event_id`,
      [verified.eventId,verified.eventType,verified.checkoutSessionId,verified.paymentStatus]
    );
    if (event.rowCount === 0) {
      await db.query("COMMIT");
      return {duplicate:true,recorded:false};
    }
    if (verified.eventType === "checkout.session.completed" &&
        verified.checkoutSessionId && verified.paymentStatus === "paid") {
      await db.query(
        `INSERT INTO stripe_test_orders(session_id,event_id,payment_status,status)
         VALUES($1,$2,$3,'test_received') ON CONFLICT(session_id) DO NOTHING`,
        [verified.checkoutSessionId,verified.eventId,verified.paymentStatus]
      );
    }
    await db.query("COMMIT");
    return {duplicate:false,recorded:true};
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}
