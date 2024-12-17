const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 3000;

// Habilitar CORS
app.use(cors());
app.use(express.json()); // Parsear JSON

// Ruta para scraping
app.post('/scrape', async (req, res) => {
    const { url } = req.body;

    if (!url) return res.status(400).json({ error: 'URL no proporcionada' });

    const isValidAmazonUrl = (url) => {
        try {
            const validUrl = new URL(url);
            return validUrl.hostname.includes('amazon');
        } catch {
            return false;
        }
    };

    if (!isValidAmazonUrl(url)) {
        return res.status(400).json({ error: 'URL inválida o no es de Amazon' });
    }

    try {
        console.log(`Scraping de: ${url}`);
        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
            },
            timeout: 10000,
        });

        const $ = cheerio.load(html);

        // Obtener precio
        const priceElement = $('.a-price .a-price-whole').first();
        const price = priceElement.length ? priceElement.text().trim() : 'No disponible';

        // Obtener opciones de colores
        const colorOptions = [];
        $('div[data-csa-c-type="widget"] ul li').each((index, element) => {
            const $li = $(element);
            const title = $li.attr('title');
            const span = $li.find('span.a-button-unavailable');

            // Verificar si el span tiene la clase "a-button-unavailable"
            const isUnavailable = span.length > 0 && span.hasClass('a-button-unavailable');

            if (title) {
                colorOptions.push({
                    name: title.trim(),
                    available: !isUnavailable, // true si está disponible, false si no
                });
            }
        });

        // Enviar respuesta con datos obtenidos
        res.json({
            price,
            colors: colorOptions,
        });
    } catch (error) {
        console.error('Error en scraping:', error.message);
        res.status(500).json({ error: 'Error al realizar el scraping.' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
