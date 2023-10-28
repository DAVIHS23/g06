d3.csv("data/movies-originalDataset.csv", function (data) {
    console.log("data loaded")

    //fillGenreDropdowns(data);
    //createGenreDropdown(data);

    createGenreSelectionIncomeTreeMap(data);

    //////////////////////////////////////////////////
    // line plot releases per year


})

function createGenreSelectionIncomeTreeMap(data) {
    var genres = ["all"]
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

    const select = d3.select("#genreSelectionIncomeTreeMap");
    select.selectAll("option")
        .data(genres)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => (d === "all") ? "All Genres" : d);

    select.on("change", function () {
        const selectedGenre = this.value;
        console.log("Selected Genre: " + selectedGenre);

        let filteredData;
        if (selectedGenre === "all") {
            filteredData = data;
        } else {
            filteredData = data.filter(d => d.genre.includes(selectedGenre));
        }
        d3.select(".incomeTreeMap").html("");
        console.log("filtered data: ", filteredData);
        createGrossIncomeTreeMap(filteredData);
    });

    // Initial treemap creation
    createGrossIncomeTreeMap(data);
}

function fillGenreDropdowns(data) {
    console.log("fill genre drop downs");
    let genres = []
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
}

function createGenreDropdown(data) {
    console.log("create genre drop downs");
    var genres = []
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
}

function createGrossIncomeTreeMap(data) {
    console.log("tree map sorted after income");
    const treeMapWidth = 600;
    const treeMapHeight = 400;

    console.log("created svg container - start sorting");
    data.sort((a, b) => b.gross - a.gross);

    //data = filterDataByGenres(data, [document.getElementById("genreSelectionIncomeTreeMap").value]);

    data = data.slice(0, 10);
    console.log(data);
    console.log("data filtered - start creating tree")

    const svg = d3.select(".incomeTreeMap")
        .append("svg")
        .attr("width", treeMapWidth)
        .attr("height", treeMapHeight);

    const root = d3.hierarchy({ children: data })
        .sum(d => d.gross);

    const treemap = d3.treemap()
        .size([treeMapWidth, treeMapHeight]);

    const colorScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.gross)])
        .range(["#c0d6e4", "#195e17"]);

    const treemapData = treemap(root);

    svg.selectAll("rect")
        .data(treemapData.leaves())
        .enter()
        .append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .style("stroke", "black")
        .style("fill", d => colorScale(d.data.gross));;

    svg.selectAll("text")
        .data(treemapData.leaves())
        .enter()
        .append("text")
        .attr("x", d => (d.x0 + d.x1) / 2)
        .attr("y", d => (d.y0 + d.y1) / 2)
        .text(d => `${d.data.title} (${d.data.gross}M USD)`)
        .attr("dy", "0.35em")
        .style("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "white");
}

function filterDataByGenres(data, genresAsArray) {
    console.log("genre filter: " + genresAsArray);
    if (genresAsArray.length > 0) {
        data = data.filter(d => {
            if (d.genre) {
                const genres = d.genre.split(",");
                for (let i = 0; i < genres.length; i++) {
                    if (genresAsArray.includes(genres[i])) {
                        return true;
                    }
                }
            }
            return false;
        });
    }
    return data
}
