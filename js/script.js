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

function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0, //parseFloat(text.attr("dy")),
            tspan = text.text(null)
                .append("tspan")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                    .text(word);
            }
        }
    });
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
        .attr("viewBox", `0 0 ${treeMapWidth} ${treeMapHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("max-width", "100%")
        .style("height", "auto");
    const root = d3.hierarchy({ children: filteredData })
        .sum(d => d.gross);

    const treemap = d3.treemap()
        .size([treeMapWidth, treeMapHeight]);

    const colorScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.gross)])
        .range(["#e5f6ff", "#003a6d"]);

    const treemapData = treemap(root);
    const clickedElements = [];

    svg.selectAll("rect")
        .data(treemapData.leaves())
        .enter()
        .append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .style("stroke", "#e5f6ff")
        .style("fill", d => colorScale(d.data.gross))
        .on("click", function (d) {
            const isClicked = clickedElements.includes(d.data);
            if (isClicked) {
                console.log("Element already clicked:", d.data);
            } else {
                clickedElements.push(d.data);
                console.log("Clicked on an element:", d.data);
            }
        });



    svg.selectAll("text")
        .data(treemapData.leaves())
        .enter()
        .append("text")
        .attr("x", d => (d.x0 + d.x1) / 2)
        .attr("y", d => (d.y0 + d.y1) / 2)
        .text(d => `${d.data.title} (${d.data.gross}M USD)`)
        .call(wrap, 100)
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
        const selectedYear = this.value;
        console.log("Selected Year: " + selectedYear);
        const filteredData = filterDataByYear(data, selectedYear);


        console.log("filtered data year: ", filteredData);
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

function filterDataByYear(data, selectedYear) {
    let filteredData;
    console.log("Selected year: ", selectedYear);

    if (selectedYear === "all" || isNaN(selectedYear)) {
        console.log("Invalid year or 'all' selected");
        filteredData = data.slice();
    } else {

        filteredData = data.filter(d => d.year === selectedYear);
    }
    console.log("Data after filtering year: ", data);
    console.log("Filtered data year: ", filteredData);
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
        .attr("stroke", "#00539a")
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

    // Append horizontal grid lines
    svg.selectAll("horizontalGrid")
        .data(y.ticks(5))
        .enter()
        .append("line")
        .attr("class", "horizontalGrid")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d));

    // Append vertical grid lines
    svg.selectAll("verticalGrid")
        .data(x.ticks(5))
        .enter()
        .append("line")
        .attr("class", "verticalGrid")
        .attr("x1", d => x(d))
        .attr("x2", d => x(d))
        .attr("y1", 0)
        .attr("y2", height);

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
        .attr("stroke", "#00539a")
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

    svg.selectAll("horizontalGrid")
        .data(y.ticks(5))
        .enter()
        .append("line")
        .attr("class", "horizontalGrid")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d));

    // Append vertical grid lines
    svg.selectAll("verticalGrid")
        .data(x.ticks(5))
        .enter()
        .append("line")
        .attr("class", "verticalGrid")
        .attr("x1", d => x(d))
        .attr("x2", d => x(d))
        .attr("y1", 0)
        .attr("y2", height);

}


function calculateLinearRegression(data) {
    const validData = data.filter(d => !isNaN(+d.gross) && !isNaN(+d.rating));
    if (validData.length < 2) {
        return { slope: 0, intercept: 0 }; // Return a default value if there isn't enough valid data.
    }

    const n = validData.length;
    const sumX = validData.reduce((acc, d) => acc + +d.gross, 0);
    const sumY = validData.reduce((acc, d) => acc + +d.rating, 0);
    const sumXY = validData.reduce((acc, d) => acc + (+d.gross * +d.rating), 0);
    const sumX2 = validData.reduce((acc, d) => acc + (+d.gross * +d.gross), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}




function createScatterPlotGrossRating(data) {
    const filteredData = data.filter(d => !isNaN(+d.gross) && +d.gross > 1);

    const maxGross = d3.max(filteredData, d => +d.gross);

    const trendlineData = calculateLinearRegression(filteredData);

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
        .domain([0, maxGross])
        .range([0, width]);

    const minYRating = d3.min(filteredData, d => d.rating);
    //const maxYRating = d3.max(filteredData, d => d.rating);

    const yDomainLowerLimit = Math.max(minYRating - 0.5, 0);
    // const yDomainUpperLimit = Math.min(maxYRating + 0.5, 10);

    const yScale = d3.scaleLinear()
        .domain([yDomainLowerLimit, 10])
        .range([height, 0]);


    const tooltip = d3.select(".scatterPlot")
        .append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ddd")
        .style("padding", "5px")
        .style("opacity", 0);

    svg.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.gross))
        .attr("cy", d => yScale(d.rating))
        .attr("r", 5.5)
        .style("fill", "#33b1ff")
        .style("opacity", 0.8)


        .on("mouseover", function (event, index) {
            const d = filteredData[index];
            const d3Tooltip = tooltip.node();
            const scatterPlotContainer = d3.select(".scatterPlot").node();
            const containerBounds = scatterPlotContainer.getBoundingClientRect();
            const containerX = scatterPlotContainer.offsetLeft;
            const containerY = scatterPlotContainer.offsetTop;
            const scatterPlotRight = scatterPlotContainer.getBoundingClientRect().right;
            const scatterPlotHeight = scatterPlotContainer.getBoundingClientRect().height;
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.8);

            //Lessons Learned: With overlapping points the tooltip calculation based on coordinates does not work
            console.log(containerX, containerY)
            const x = (containerX + (scatterPlotRight * 0.9))
            const y = (containerY + (scatterPlotHeight * 0.05))
            console.log(x, y)

            tooltip.html(`Title: ${d.title}<br>Gross: ${d.gross}<br>Rating: ${d.rating}`)
                .style("left", (x) + "px")
                .style("top", (y) + "px");
        })

        .on("mouseout", () => {
            tooltip.transition()
                .duration(0)
                .style("opacity", 0);
        });

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


    const trendline = svg.append("line")
        .attr("x1", xScale(0))
        .attr("y1", yScale(trendlineData.intercept))
        .attr("x2", xScale(maxGross))
        .attr("y2", yScale(maxGross * trendlineData.slope + trendlineData.intercept))
        .attr("stroke", "#00539a")
        .attr("stroke-width", 2);

    // Append horizontal grid lines
    svg.selectAll(".horizontalGrid")
        .data(yScale.ticks(5))
        .enter()
        .append("line")
        .attr("class", "horizontalGrid")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d));

    // Append vertical grid lines
    svg.selectAll(".verticalGrid")
        .data(xScale.ticks(5))
        .enter()
        .append("line")
        .attr("class", "verticalGrid")
        .attr("x1", d => xScale(d))
        .attr("x2", d => xScale(d))
        .attr("y1", 0)
        .attr("y2", height);




}






