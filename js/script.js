d3.csv("data/movies-originalDataset.csv", function (data) {
    console.log("data loaded")
    fillGenreSelections(data);

    createGenreSelectionIncomeTreeMap(data);

    connectGenreSelectionToLinePlot(data);
})

function createGenreSelectionIncomeTreeMap(data) {
    select = d3.select("#genreSelectionIncomeTreeMap");
    select.on("change", function () {
        const selectedGenre = this.value;
        console.log("Selected Genre: " + selectedGenre);
        let filteredData = filterDataByGenre(data, [selectedGenre])
        console.log("filtered data: ", filteredData);
        createGrossIncomeTreeMap(filteredData);
    });
    createGrossIncomeTreeMap(data);
}

function createGrossIncomeTreeMap(filteredData) {
    d3.select(".incomeTreeMap").html("");
    console.log("tree map sorted after income");
    const treeMapWidth = 600;
    const treeMapHeight = 400;

    console.log("created svg container - start sorting");
    filteredData.sort((a, b) => b.gross - a.gross);

    filteredData = filteredData.slice(0, 10);
    console.log(filteredData);
    console.log("data filtered - start creating tree")

    const svg = d3.select(".incomeTreeMap")
        .append("svg")
        .attr("width", treeMapWidth)
        .attr("height", treeMapHeight);

    const root = d3.hierarchy({ children: filteredData })
        .sum(d => d.gross);

    const treemap = d3.treemap()
        .size([treeMapWidth, treeMapHeight]);

    const colorScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.gross)])
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

function fillGenreSelections(data) {
    var genres = ["all"]
    data.forEach(d => {
        if (d.genre) {
            d.genre.split(",").forEach(g => {
                g = g.trim();
                if (!genres.includes(g)) {
                    genres.push(g);
                }
            });
        }
    });
    genres.sort();

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

function connectGenreSelectionToLinePlot(data) {
    select = d3.select("#genreSelectionNumberOfMovies");
    select.on("change", function () {
        const selectedGenre = this.value;
        console.log("Selected Genre: " + selectedGenre);
        let filteredData = filterDataByGenre(data, [selectedGenre])
        console.log("filtered data: ", filteredData);
        createLinePlot(filteredData);
    });
    createLinePlot(data);
}

function filterDataByGenre(data, genresAsArray) {
    let filteredData;
    if (genresAsArray === "all") {
        //filteredData = data;
        filteredData = data.slice();
    } else {
        // TODO: look at all genres in array
        filteredData = data.filter(d => d.genre.includes(genresAsArray[0]));
    }
    return filteredData;
}

// Create a function to generate a line plot for the number of data points per year
function createLinePlot(data) {
    d3.select(".numberOfMovies").html("");

    const yearsData = d3.nest()
        .key(d => d.year)
        .rollup(values => values.length)
        .entries(data);

    yearsData.sort((a, b) => d3.ascending(a.key, b.key));

    const margin = { top: 20, right: 20, bottom: 30, left: 50 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = d3.select(".numberOfMovies")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleLinear()
        .domain([d3.min(yearsData, d => +d.key), d3.max(yearsData, d => +d.key)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(yearsData, d => +d.value)])
        .range([height, 0]);

    const line = d3.line()
        .x(d => x(+d.key))
        .y(d => y(+d.value));

    svg.append("path")
        .datum(yearsData)
        .attr("class", "line")
        .attr("d", line);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text("Year");

    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("Number of Data Points");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        //.text(`Number of Data Points for Genre: ${selectedGenre}`);
}
