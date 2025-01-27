const axios = require('axios');

// Функция для отправки запроса к GPT-4o Mini
async function askGpt4oMini(prompt) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions', // URL API GPT-4o Mini
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GPT4O_MINI_API_KEY}`, // API-ключ GPT-4o Mini
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status !== 200) {
      throw new Error(`API вернул статус ${response.status}`);
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('GPT-4o Mini API Error:', error.response?.data || error.message);
    return "Извините, возникла ошибка при обработке запроса";
  }
}

// Основной обработчик событий
exports.handler = async (event) => {
  try {
    console.log('Raw input:', event.body); // Логирование сырых данных

    if (!event.body) {
      console.error('Пустое тело запроса');
      return { statusCode: 400 };
    }

    const requestBody = JSON.parse(event.body);
    const { message, my_chat_member } = requestBody;

    if (message) {
      const chatId = message.chat.id;

      // Обработка команды /start
      if (message.text === '/start') {
        await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
          chat_id: chatId,
          text: 'Добро пожаловать в Breakout AI! Что-то нужно? 🚀 '
        });
        return { statusCode: 200 };
      }

      // Проверка наличия текста сообщения
      if (!message.text) {
        console.log('Сообщение без текста:', message);
        return { statusCode: 200 }; // Игнорирование
      }

      // Основная логика
      const botResponse = await askGpt4oMini(message.text);

      await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: botResponse,
        parse_mode: "Markdown"
      });

    } else if (my_chat_member) {
      // Обработка обновлений типа my_chat_member
      console.log('Обновление my_chat_member:', my_chat_member);
      // Здесь можно добавить дополнительную логику обработки, если необходимо
    } else {
      console.error('Неподдерживаемый тип обновления:', requestBody);
    }

    return { statusCode: 200 };
  } catch (error) {
    console.error('Handler Error:', error);
    return { statusCode: 500 };
  }
};
