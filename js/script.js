d3.csv("data/movies-originalDataset.csv", function (data) {
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
    // Add an event listener to the genre dropdown
    const genreDropdown = document.getElementById('genreSelectionIncomeTreeView');

    genreDropdown.addEventListener("change", (event) => {
        const selectedGenre = event.target.value; // Get the selected genre
        d3.select("svg").remove(); // Remove any existing line plot
        if (selectedGenre) {
            createLinePlot(data, selectedGenre); // Update the line plot with the selected genre
        }
    });




})


// Create a function to generate a line plot for the number of data points per year
function createLinePlot(data, selectedGenre) {
 
    console.log("Selected Genre: ", selectedGenre);
    let filteredData;
        if (selectedGenre === "all") {
            filteredData = data;
        } else {
            filteredData = data.filter(d => d.genre.includes(selectedGenre));
        }
    


    const yearsData = d3.nest()
        .key(d => d.year)
        .rollup(values => values.length)
        .entries(filteredData);

    // Sort the data by year
    yearsData.sort((a, b) => d3.ascending(a.key, b.key));

    const margin = { top: 20, right: 20, bottom: 30, left: 50 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // Append an SVG element to your HTML to create the line plot
    const svg = d3.select("body")
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

    // Add labels and title
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
        .text(`Number of Data Points for Genre: ${selectedGenre}`);
}


