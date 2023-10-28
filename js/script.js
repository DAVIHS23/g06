d3.csv("data/movies-originalDataset.csv", function() {
    console.log("data loaded")
    // fill genre drop downs
    genres = []
    data.forEach(d => {
        if (d.genre) {
            d.genre.split(",").forEach(g => {
                if (!genres.includes(g)) {
                    genres.push(g);
                }
            });
        }
    });
    genres.sort();
    console.log("genres: ", genres);
    const genreDropdowns = document.querySelectorAll('.genreSelection');
    genreDropdowns.forEach((dropdown) => {
        genres.forEach((genre) => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            dropdown.appendChild(option);
        });
    });
    // line plot releases per year


})
