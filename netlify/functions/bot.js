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

    // Добавляем проверку статуса ответа
    if (response.status !== 200) {
      throw new Error(`API вернул статус ${response.status}`);
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API Error:', error.response?.data || error.message);
    return "Извините, возникла ошибка при обработке запроса";
  }
}

exports.handler = async (event) => {
  try {
    console.log('Raw input:', event.body); // Логируем сырые данные

    // Проверяем наличие тела запроса
    if (!event.body) {
      console.error('Пустое тело запроса');
      return { statusCode: 400 };
    }

    const requestBody = JSON.parse(event.body);
    
    // Проверяем структуру запроса
    if (!requestBody.message) {
      console.error('Неверная структура запроса:', requestBody);
      return { statusCode: 400 };
    }

    const { message } = requestBody;
    const chatId = message.chat.id;

    // Обработка команды /start
    if (message.text === '/start') {
      await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: 'Добро пожаловать! Я работаю на Netlify 🚀 Задайте ваш вопрос:'
      });
      return { statusCode: 200 };
    }

    // Проверяем наличие текста сообщения
    if (!message.text) {
      console.log('Сообщение без текста:', message);
      return { statusCode: 200 }; // Игнорируем
    }

    // Основная логика
    const botResponse = await askDeepSeek(message.text);
    
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