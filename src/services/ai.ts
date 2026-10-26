// Chatbot is paused by user decision until backend enforces ACCEPTED contact access.
export async function sendAiMessage(): Promise<never> {
  throw new Error('Tư vấn AI đang tạm dừng để cập nhật quyền truy cập thông tin liên hệ.');
}
