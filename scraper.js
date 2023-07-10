const axios = require('axios');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const currentYear = new Date().getFullYear();

// Function to scrape movies from filmweb from a a given platform
const scrapeMovies = async (platform) => {
    try {
        const url = `https://www.filmweb.pl/ranking/vod/${platform}/film/${currentYear}`
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        const movies = [];

        $('.rankingType.rankingType').each((index, element) => {
            if (index < 10) {
                const title = $(element).find('.rankingType__title').text().trim();
                const rating = $(element).find('.rankingType__rate--value').text().trim().replace(',', '.');

                movies.push({ title, platform, rating });
            }
        });

        return movies;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
};

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

// Scrape movies from all platforms
const scrapeAllMovies = async () => {
    const allMovies = [];

    // Create an array of promises for scraping movies
    const promises = platforms.map(platform => {
        return scrapeMovies(platform);
    });

    // Execute all promises concurrently using Promise.all
    const results = await Promise.all(promises);

    // Combine the results into a single array
    results.forEach(movies => {
        allMovies.push(...movies);
    });

    // Deduplicate movies based on title and keep highest rating
    const deduplicatedMovies = {};
    allMovies.forEach(movie => {
        const { title, platform, rating } = movie;
        if (deduplicatedMovies[title]) {
            if (rating > deduplicatedMovies[title].rating) {
                deduplicatedMovies[title].rating = rating;
                deduplicatedMovies[title].platform = platform;
            }
        } else {
            deduplicatedMovies[title] = { title, platform, rating };
        }
    });

    // Convert deduplicated movies object to array and sort by rating in descending order
    const sortedMovies = Object.values(deduplicatedMovies).sort((a, b) => b.rating - a.rating);

    return sortedMovies;
};


// Run the scraping function
scrapeAllMovies()
    .then(movies => {
        console.log(movies);
    })
    .catch(error => {
        console.error('Error:', error);
    });