const axios = require('axios');
const cheerio = require('cheerio');

//todo top 10 best rated movies from top 4 streaming platforms from current year

/*
I've decided to hardcode names for the top 4 platforms because these are not changing often or at all. 
It saves us 1 initial request that would have to be completed before others.
To add new platform:
    go to https://www.filmweb.pl/ranking/vod/netflix/film
    click on platform of choice icon
    see how is it named in the URL
e.g prime video is "amazon" in the filmweb URL
*/
const platforms = ["netflix", "hbo_max", "canal_plus_manual", "disney"];

const currentYear = new Date().getFullYear();

// Function to scrape movies from a given URL
const scrapeMovies = async (url, platform) => {
    try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        const movies = [];

        $('.rankingType.hasVod').each((index, element) => {
            if (index < 10) {
                const title = $(element).find('.rankingType__title').text().trim();
                const vodService = platform;
                const rating = $(element).find('.rankingType__rate--value').text().trim().replace(',', '.');

                movies.push({ title, vodService, rating });
            }
        });

        return movies;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
};

// Scrape movies from all URLs
const scrapeAllMovies = async () => {
    const allMovies = [];

    for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        const url = `https://www.filmweb.pl/ranking/vod/${platform}/film/${currentYear}`;

        const movies = await scrapeMovies(url, platform);
        allMovies.push(...movies);
    }

    return allMovies;
};

// Run the scraping function
scrapeAllMovies()
    .then(movies => {
        console.log(movies);
    })
    .catch(error => {
        console.error('Error:', error);
    });