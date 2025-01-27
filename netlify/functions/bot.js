const axios = require('axios');

async function askDeepSeek(prompt) {
  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API Error:', error.response?.data || error.message);
    return "Извините, возникла ошибка при обработке запроса";
  }
}

exports.handler = async (event) => {
  try {
    const { message } = JSON.parse(event.body);
    const userMessage = message.text;
    const chatId = message.chat.id;

    // Обработка команды /start
    if (userMessage === '/start') {
      await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: 'Добро пожаловать! Я работаю на Netlify 🚀 Задайте ваш вопрос:'
      });
      return { statusCode: 200 };
    }

    // Основная логика
    const botResponse = await askDeepSeek(userMessage);
    
    await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: botResponse,
      parse_mode: "Markdown"
    });

    return { statusCode: 200 };
  } catch (error) {
    console.error('Handler Error:', error);
    return { statusCode: 500 };
  }
};