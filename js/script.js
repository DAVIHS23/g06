// bootstrap js
//var myCarousel = new bootstrap.Carousel(document.querySelector('#topCarousel'));

// d3 js
const apiKey = 'dd5aa8d86c1d4b5fce9ef36da52df818';

d3.csv("data/movies-originalDataset.csv", function (data) {
    console.log("data loaded")

    fillGenreSelections(data);
    fillYearSelections(data);

    createGenreSelectionIncomeTreeMap(data);

    connectGenreSelectionToLinePlot(data);
    connectYearSelectionToScatterPlot(data);
    countGenreAppearances(data);
    d3.csv("data/star_appearances.csv", function (starsData) {
        console.log("stars data loaded");
        createAppearancesBarChart(starsData);
        createScatterPlotGrossRating(data, starsData);
        connectYearSelectionToScatterPlot(data, starsData);
    });
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

let clickedElements = [];

function createGrossIncomeTreeMap(filteredData) {
    clickedElements = []

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
            transformElement(this, d.data);
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

let movieDataCache = {};

function transformElement(element, data) {
    const displayPosterInElement = (element, posterUrl, posterWidth, posterHeight) => {
        const bounds = element.getBBox();

        const scaleX = (bounds.width) / posterWidth;
        const scaleY = (bounds.height) / posterHeight;

        const scale = Math.max(scaleX, scaleY);

        const scaledWidth = posterWidth * scale;
        const scaledHeight = posterHeight * scale;

        const x = bounds.x + (bounds.width - scaledWidth) / 2;
        const y = bounds.y + (bounds.height - scaledHeight) / 2;

        const clipPathId = 'clip-' + Math.random().toString(36).slice(2, 11);

        d3.select(element.parentNode)
            .append('clipPath')
            .attr('id', clipPathId)
            .append('rect')
            .attr('x', bounds.x)
            .attr('y', bounds.y)
            .attr('width', bounds.width)
            .attr('height', bounds.height);

        d3.select(element.parentNode)
            .append('image')
            .attr('xlink:href', posterUrl)
            .attr('x', x)
            .attr('y', y)
            .attr('width', scaledWidth)
            .attr('height', scaledHeight)
            .attr('clip-path', `url(#${clipPathId})`)
            .attr('class', 'movie-poster');
    };
    const removePosterFromElement = (element) => {
        d3.select(element.parentNode).select('.movie-poster').remove();
        clickedElements = clickedElements.filter(el => el !== element);
    };

    const fetchData = (movieTitle) => {
        if (movieDataCache[movieTitle]) {
            console.log('Using cached data from memory for:', movieTitle);
            useMovieData(movieDataCache[movieTitle]);
            return;
        }

        const cachedMovieData = JSON.parse(localStorage.getItem('movieData'));
        if (cachedMovieData && cachedMovieData[movieTitle]) {
            console.log('Using cached data from localStorage for:', movieTitle);
            movieDataCache = cachedMovieData;
            useMovieData(cachedMovieData[movieTitle], element);
            return;
        }

        fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(movieTitle)}`)
            .then(response => response.json())
            .then(data => {
                if (data.results.length > 0) {
                    const movieId = data.results[0].id;

                    return fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`);
                } else {
                    throw new Error('Movie not found');
                }
            })
            .then(response => response.json())
            .then(movieDetails => {

                console.log('Fetched Movie Details:', movieDetails);
                const posterPath = movieDetails.poster_path;
                const posterUrl = `https://image.tmdb.org/t/p/w500${posterPath}`;


                const image = new Image();
                image.src = posterUrl;
                movieDataCache[movieTitle] = movieDetails;
                localStorage.setItem('movieData', JSON.stringify(movieDataCache));

                image.onload = () => {
                    const posterWidth = image.naturalWidth;
                    const posterHeight = image.naturalHeight;

                    displayPosterInElement(element, posterUrl, posterWidth, posterHeight);

                    setTimeout(() => removePosterFromElement(element), 3000);
                };
            })
            .catch(error => console.error('Error:', error));
    };

    const useMovieData = (movieTitle) => { //from here i have duplicate code but its ok for the moment 
        console.log('Using cached data for:', movieTitle);

        const posterPath = movieTitle.poster_path;
        const posterUrl = `https://image.tmdb.org/t/p/w500${posterPath}`;
        const image = new Image();
        image.src = posterUrl;
        image.onload = () => {
            const posterWidth = image.naturalWidth;
            const posterHeight = image.naturalHeight;
            displayPosterInElement(element, posterUrl, posterWidth, posterHeight);
            setTimeout(() => removePosterFromElement(element), 3000);
        };
    }

    const elementIndex = clickedElements.indexOf(element);
    console.log(clickedElements)
    if (elementIndex === -1) {
        clickedElements.push(element);
        const movieTitle = data.title;
        fetchData(movieTitle);
        setTimeout(() => removePosterFromElement(element), 3000);
    }
}

function fillGenreSelections(data) {
    // unnecessary since it is added in HTML
    //var genres = ["all"]
    var genres = []
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
    // unnecessary since it is added in HTML
    //const years = ["all"];
    const years = [];
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
    minRatingDisplay.textContent = "Min in data: " + displayminRating;
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

function connectYearSelectionToScatterPlot(data, stardata) {
    const select = d3.select("#yearSelection");
    select.on("change", function () {
        const selectedYear = this.value;
        console.log("Selected Year: " + selectedYear);
        const filteredData = filterDataByYear(data, selectedYear);


        console.log("filtered data year: ", filteredData);
        createScatterPlotGrossRating(filteredData, stardata);
    });
    createScatterPlotGrossRating(data, stardata);
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


    svg.selectAll("horizontalGrid")
        .data(y.ticks(5))
        .enter()
        .append("line")
        .attr("class", "horizontalGrid")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d));


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
        return { slope: 0, intercept: 0 };
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




function createScatterPlotGrossRating(data, stardata) {
    const filteredData = data.filter(d => !isNaN(+d.gross) && +d.gross > 1);

    const maxGross = d3.max(filteredData, d => +d.gross);

    data.forEach(d => {
        if (+d['Cluster 1'] === 1) d.clusterLabel = 1;
        else if (+d['Cluster 2'] === 1) d.clusterLabel = 2;
        else if (+d['Cluster 3'] === 1) d.clusterLabel = 3;
        else if (+d['Cluster 4'] === 1) d.clusterLabel = 4;
        else d.clusterLabel = null;
    });

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

    const colorScale = d3.scaleOrdinal()
        .domain([1, 2, 3, 4])
        .range(["#0f62fe", "#8a3ffc", "0072c", "#198038"]);

    // --- BRUSHING ---


    const brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("start brush", brushed)
        .on("end", brushEnded);

    svg.append("g")
        .attr("class", "brush")
        .call(brush);

    countGenreAppearances(filteredData);

    function brushed() {
        const selection = d3.event.selection;

        if (selection) {
            const [[x0, y0], [x1, y1]] = selection;
            let selectedMovies = [];

            svg.selectAll("circle")
                .each(function (d) {
                    const cx = xScale(d.gross);
                    const cy = yScale(d.rating);

                    if (x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1) {
                        if (!selectedMovies.some(movie => movie === d)) {
                            selectedMovies.push(d);
                            console.log(selectedMovies)
                        }

                    }
                });

            if (selectedMovies.length > 0) {
                countGenreAppearances(selectedMovies);
            }
        }
    }


    function brushEnded(event) {
        if (!d3.event.selection) {
            countGenreAppearances(filteredData);
        }
    }

    // --- END BRUSHING ---

    svg.on("click", function (event) {
        if (d3.event.target.tagName !== 'circle') {

            if (selectedCircle) {
                selectedCircle.classed("selected", false);
            }
            selectedCircle = null;

            /*tooltip.transition()
                .duration(200)
                .style("opacity", 0);*/

            filterAndDisplayStarsData(stardata);
        }
    });

    let selectedCircle = null;

    svg.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.gross))
        .attr("cy", d => yScale(d.rating))
        .attr("r", 5.5)
        //.style("fill", "#33b1ff")
        .style("fill", d => colorScale(d.clusterLabel))
        .style("opacity", 0.8)


        .on("click", function (event, index) {

            if (selectedCircle) {
                selectedCircle.classed("selected", false);
            }



            selectedCircle = d3.select(this).classed("selected", true);
            const d = filteredData[index];
            const d3Tooltip = tooltip.node();
            const scatterPlotContainer = d3.select(".scatterPlot").node();
            const containerBounds = scatterPlotContainer.getBoundingClientRect();
            const containerX = scatterPlotContainer.offsetLeft;
            const containerY = scatterPlotContainer.offsetTop;
            const scatterPlotRight = scatterPlotContainer.getBoundingClientRect().right;
            const scatterPlotHeight = scatterPlotContainer.getBoundingClientRect().height;
            /*tooltip.transition()
                .duration(200)
                .style("opacity", 0.8);*/

            //Movie details
            updateMovieDetails(d);

            //Lessons Learned: With overlapping points the tooltip calculation based on coordinates does not work
            console.log(containerX, containerY)
            const x = (containerX + (scatterPlotRight * 0.6))
            const y = (containerY + (scatterPlotHeight * 0.001))
            console.log(x, y)

            tooltip.html(`Title: ${d.title}<br>Gross: ${d.gross}<br>Rating: ${d.rating}`)
                .style("left", (x) + "px")
                .style("top", (y) + "px");
            const movieTitle = d.title; 
            const filteredStars = stardata.filter(star => {
                const searchPattern = `'${movieTitle}'`;
                return star.movies.includes(searchPattern);
               
            });
        

            filterAndDisplayStarsData(filteredStars);
        })





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

    svg.selectAll(".horizontalGrid")
        .data(yScale.ticks(5))
        .enter()
        .append("line")
        .attr("class", "horizontalGrid")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d));

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

function filterAndDisplayStarsData(data) {
    console.log(data)
    createAppearancesBarChart(data);
}

function createAppearancesBarChart(data) {

    d3.select(".barChart").selectAll("svg").remove();


    data.forEach(function (d) {
        d.appearances = +d.appearances;
    });


    var topStars = data.sort(function (a, b) {
        return b.appearances - a.appearances;
    }).slice(0, 10);


    var margin = { top: 30, right: 30, bottom: 70, left: 60 },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;


    var svg = d3.select(".barChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    var x = d3.scaleBand()
        .range([0, width])
        .domain(topStars.map(d => d.stars))
        .padding(0.2);
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    var y = d3.scaleLinear()
        .domain([0, d3.max(topStars, d => d.appearances)])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    svg.selectAll("mybar")
        .data(topStars)
        .enter()
        .append("rect")
        .attr("x", d => x(d.stars))
        .attr("y", d => y(d.appearances))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.appearances))
        .attr("fill", "#69b3a2");
}

function countGenreAppearances(data) {
    const combinationCounts = {};
    data.forEach(movie => {
        let genres = movie.genre.split(', ');
        genres.sort();
        const combinationKey = genres.join(', ');
        if (combinationKey in combinationCounts) {
            combinationCounts[combinationKey]++;
        } else {
            combinationCounts[combinationKey] = 1;
        }
    });
    const combinationCountsArray = Object.keys(combinationCounts).map(key => {
        return { combination: key, count: combinationCounts[key] };
    });
    console.log(combinationCountsArray);
    createGenreCombinationBarChart(combinationCountsArray);
}

function createGenreCombinationBarChart(data) {
    var topCombinations = data.sort(function (a, b) {
        return b.count - a.count;
    }).slice(0, 10);

    var margin = { top: 30, right: 30, bottom: 70, left: 60 },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var svg = d3.select(".barChartGenre").select("svg");
    var g;
    if (svg.empty()) {
        svg = d3.select(".barChartGenre")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
        g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    } else {
        g = svg.select("g");
    }

    var x = d3.scaleBand()
        .range([0, width])
        .domain(topCombinations.map(function (d) { return d.combination; }))
        .padding(0.2);

    var y = d3.scaleLinear()
        .domain([0, d3.max(topCombinations, function (d) { return d.count; })])
        .range([height, 0]);

    var xAxis = g.selectAll(".x-axis").data([0]);
    var newXAxis = xAxis.enter().append("g").attr("class", "x-axis");
    xAxis.merge(newXAxis)
        .attr("transform", `translate(0,${height})`)
        .transition()
        .duration(500)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    var yAxis = g.selectAll(".y-axis").data([0]);
    var newYAxis = yAxis.enter().append("g").attr("class", "y-axis");
    yAxis.merge(newYAxis)
        .transition()
        .duration(500)
        .call(d3.axisLeft(y));

    var bars = g.selectAll("rect")
        .data(topCombinations, function (d) { return d.combination; });

    bars.enter().append("rect")
        .merge(bars)
        .transition()
        .duration(500)
        .attr("x", function (d) { return x(d.combination); })
        .attr("y", function (d) { return y(d.count); })
        .attr("width", x.bandwidth())
        .attr("height", function (d) { return height - y(d.count); })
        .attr("fill", "#69b3a2");

    bars.exit().remove();
}



async function updateMovieDetails(movie) {
    var details = d3.select('#movieDetails');
    details.html('');

    details.append('h2').text(movie.title + " ("+movie.year+")");
    details.append('p').text('Rating: ' + movie.rating);
    details.append('p').text('Genre: ' + movie.genre);
    details.append('p').text('Cast: ');

    let actorsContainer = details.append('div').attr('class', 'actors-container');



    if (typeof movie.stars === 'string') {
        movie.stars = movie.stars.replace(/^\['|'\]$/g, '').split("', '");
    }



    if (movie.stars && movie.stars.length > 0) {
        for (const star of movie.stars) {
        
            
            try {
                const actorPicture = await getActorPictures([star]);
                console.log(actorPicture)
                    if (actorPicture.pictureUrl) {
                        let actorDiv = actorsContainer.append('div').attr('class', 'actor');
                        actorDiv.append('img')
                            .attr('src', actorPicture.pictureUrl)
                            .attr('alt', `Picture of ${actorPicture.name}`)
                            .attr('width', 100);
                        actorDiv.append('h4').text(actorPicture.name);

                    }
                
            } catch (error) {
                console.error('Error fetching actor pictures:', error);
            }
        }
    } else {
        details.append('p').text('No actor information available.');
    }


}

async function searchActorByName(actorName) {
    const response = await fetch(`https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(actorName)}`);
    const data = await response.json();

    if (data.results.length > 0) {
        const actorId = data.results[0].id;
        const profilePath = data.results[0].profile_path;
        return { actorId, profilePath };
    } else {
        return { actorId: null, profilePath: null };
    }
}

async function getActorPictures(actorName) {
    const { actorId, profilePath } = await searchActorByName(actorName);

    let pictureUrl = null;
    if (profilePath) {
        pictureUrl = `https://image.tmdb.org/t/p/w500${profilePath}`;
    }

    return { name: actorName, pictureUrl };
}
