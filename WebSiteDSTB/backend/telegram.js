const fetch = require('node-fetch');

async function sendTelegramNotification(orderId, customer, items, total, method) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Skip if not configured
  if (!token || !chatId) {
    console.log('Telegram not configured, skipping notification');
    return;
  }

  // Format items list
  const itemsList = items.map(item => 
    `  • ${item.name} x${item.qty} - ${(item.price * item.qty).toLocaleString('vi-VN')}đ`
  ).join('\n');

  // Build message
  const message = `
🎉 *ĐƠN HÀNG MỚI* 🎉

📋 Mã đơn: \`${orderId}\`
👤 Khách hàng: ${customer.name}
📞 SĐT: ${customer.phone}
📍 Địa chỉ: ${customer.address}${customer.province ? `, ${customer.province}` : ''}

🛒 *Sản phẩm:*
${itemsList}

💰 *Tổng tiền: ${total.toLocaleString('vi-VN')}đ*
💳 Thanh toán: ${method === 'COD' ? '💵 COD (Tiền mặt)' : '🏦 Chuyển khoản'}
`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const data = await response.json();
    if (data.ok) {
      console.log('✅ Telegram notification sent for order:', orderId);
    } else {
      console.error('❌ Telegram error:', data.description);
    }
  } catch (error) {
    console.error('❌ Failed to send Telegram notification:', error.message);
  }
}

module.exports = { sendTelegramNotification };
