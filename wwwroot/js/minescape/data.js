export const fetchMultipleUrls = async (urls) => {
    try {
        const fetchPromises = urls.map(url => fetch(url));
        const responses = await Promise.all(fetchPromises);
        const jsonPromises = responses.map(response => response.json());
        const data = await Promise.all(jsonPromises);

        const result = {};
        urls.forEach((url, index) => {
            const key = url.split("/")[2].split(".")[0];
            result[key] = data[index];
        });

        return result;
    } catch (error) {
        console.error('Error fetching URLs:', error);
        throw error;
    }
};

const urls = [
    `../Data/anagrams.json`,
    `../Data/beacons.json`,
    `../Data/chests.json`,
    `../Data/hotcold.json`
];

const data = await fetchMultipleUrls(urls);

export default data;