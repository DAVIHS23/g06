// bootstrap js
//var myCarousel = new bootstrap.Carousel(document.querySelector('#topCarousel'));

// d3 js
d3.csv("data/movies-originalDataset.csv", function (data) {
    console.log("data loaded")
    fillGenreSelections(data);
    fillYearSelections(data);

    createGenreSelectionIncomeTreeMap(data);

    connectGenreSelectionToLinePlot(data);
    connectYearSelectionToScatterPlot(data);
    createScatterPlotGrossRating(data);
    
    
})

function createGenreSelectionIncomeTreeMap(data) {
    select = d3.select("#genreSelectionIncomeTreeMap");
    select.on("change", function () {
        const selectedGenre = this.value;
        console.log("Selected Genre: " + selectedGenre);
        let filteredData = filterDataByGenre(data, [selectedGenre])
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

function fillYearSelections(data) {
    const years = ["all"];
    data.forEach((d) => {
        if (d.year) {
            const year = d.year.toString();
            if (!years.includes(year)) {
                years.push(year);
            }
        }
    });
    years.sort();

    const yearDropdowns = document.querySelectorAll('.yearSelection');
    yearDropdowns.forEach((dropdown) => {
        years.forEach((year) => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            dropdown.appendChild(option);
        });
    });
}



function initializeSliders(data) {
    const ratingSlider = document.getElementById('ratingSlider');
    let displayminRating = d3.min(data, d => d.rating);
    let displaymaxRating = d3.max(data, d => d.rating);
    let initialSliderValues = [displayminRating, displaymaxRating];
    minRatingDisplay.textContent = "Min: " + displayminRating;
    maxRatingDisplay.textContent = "Max: " + displaymaxRating;
    if (ratingSlider.noUiSlider) {
        ratingSlider.noUiSlider.destroy();
    }
    noUiSlider.create(ratingSlider, {
        start: initialSliderValues,
        connect: true,
        step: 1,
        range: {
            min: 1,
            max: 10
        }
    });



    const ratingRange = document.getElementById('ratingRange');
    ratingSlider.noUiSlider.on('update', function (values, handle) {
        ratingRange.innerText = values.join(' - ');
        const minRating = parseInt(values[0]);
        const maxRating = parseInt(values[1]);
        const filteredData = data.filter(d => d.rating >= minRating && d.rating <= maxRating);
        createLinePlot(filteredData);
        createLinePlotGross(filteredData);
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
        createLinePlotGross(filteredData);
        initializeSliders(filteredData);
    });

    createLinePlot(data);
    createLinePlotGross(data);
    initializeSliders(data);

}

function connectYearSelectionToScatterPlot(data) {
    const select = d3.select("#yearSelection");
    select.on("change", function () {
        const selectedYear = +this.value;
        console.log("Selected Year: " + selectedYear);
        
        const filteredData = data.filter(d => +d.year === selectedYear)

        console.log("filtered data: ", filteredData);
        createScatterPlotGrossRating(filteredData);
    });

    createScatterPlotGrossRating(data);
}



function filterDataByGenre(data, genresAsArray) {
    let filteredData;
    console.log("genres as array: ", genresAsArray);
    // TODO: check if any value in array is "all"
    if (genresAsArray[0] === "all") {
        console.log("all genres selected")
        filteredData = data.slice();
    } else {
        // TODO: look at all genres in array
        filteredData = data.filter(d => d.genre.includes(genresAsArray[0]));
    }
    console.log("data after filtering: ", data)
    console.log("filtered data: ", filteredData)
    return filteredData;
}

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
        .attr("d", line)
        .attr("stroke", "green")
        .attr("fill", "none");

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
        .text("Realses");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
    //.text(`Number of Data Points for Genre: ${selectedGenre}`);
}

function createLinePlotGross(data) {
    d3.select(".incomePerYear").html("");

    const yearsData = d3.nest()
        .key(d => d.year)
        .rollup(values => d3.mean(values, d => d.gross)) 
        .entries(data);

    console.log(yearsData);

    yearsData.sort((a, b) => d3.ascending(a.key, b.key));

    const margin = { top: 20, right: 20, bottom: 30, left: 50 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = d3.select(".incomePerYear")
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
        .attr("d", line)
        .attr("stroke", "green")
        .attr("fill", "none");

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
        .text("Average Gross");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px");
}

function createScatterPlotGrossRating(data) {
    // Filter the data to include only data points from the year 2000 and valid "gross" values
    const filteredData = data.filter(d =>!isNaN(+d.gross) && +d.gross > 1);

    // Find the maximum "gross" value in the filtered data
    const maxGross = d3.max(filteredData, d => +d.gross);

    d3.select(".scatterPlot").html("");

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(".scatterPlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain([0, maxGross]) // Set the x-axis domain to the maximum "gross" value
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.rating)])
        .range([height, 0]);

    svg.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.gross))
        .attr("cy", d => yScale(d.rating))
        .attr("r", 5);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 35)
        .text("Gross");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -30)
        .text("Rating");
}




