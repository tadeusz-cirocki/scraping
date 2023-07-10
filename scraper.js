const axios = require('axios');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Function to scrape top rated movies from filmweb from a a given platform from a given year
const scrapeMovies = async (platform, year) => {
    try {
        const url = `https://www.filmweb.pl/ranking/vod/${platform}/film/${year}`
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

// Scrape movies from given platforms and year
const scrapeAllMovies = async (platforms, year) => {
    const allMovies = [];

    // Execute promises concurrently
    const results = await Promise.all(platforms.map(platform => scrapeMovies(platform, year)));

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
const currentYear = new Date().getFullYear();   // can be changed here for e.g. 2020

scrapeAllMovies(platforms, currentYear)
    .then(movies => {
        const csvWriter = createCsvWriter({
            path: 'movies.csv',
            header: [
                { id: 'title', title: 'Title' },
                { id: 'platform', title: 'VOD Service Name' },
                { id: 'rating', title: 'Rating' }
            ]
        });

        return csvWriter.writeRecords(movies);
    })
    .then(() => {
        console.log('CSV file has been written successfully');
    })
    .catch(error => {
        console.error('Error:', error);
    });