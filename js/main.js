// Paths to data files
const moveFrequencyPath = "data/move_frequency.json";
const commonSequencesPath = "data/common_sequences.json";
const cfopDistributionPath = "data/cfop_distribution.json";
const moveDescription = [
    { move: "F", description: "Rotate the front face 90° clockwise" },
    { move: "R", description: "Rotate the right face 90° clockwise" },
    { move: "U", description: "Rotate the upper face 90° clockwise" },
    { move: "L", description: "Rotate the left face 90° clockwise" },
    { move: "B", description: "Rotate the back face 90° clockwise" },
    { move: "D", description: "Rotate the down face 90° clockwise" },
    { move: "F'", description: "Rotate the front face 90° counterclockwise" },
    { move: "R'", description: "Rotate the right face 90° counterclockwise" },
    { move: "U'", description: "Rotate the upper face 90° counterclockwise" },
    { move: "L'", description: "Rotate the left face 90° counterclockwise" },
    { move: "B'", description: "Rotate the back face 90° counterclockwise" },
    { move: "D'", description: "Rotate the down face 90° counterclockwise" },
    { move: "F2", description: "Rotate the front face 180°" },
    { move: "R2", description: "Rotate the right face 180°" },
    { move: "U2", description: "Rotate the upper face 180°" },
    { move: "L2", description: "Rotate the left face 180°" },
    { move: "B2", description: "Rotate the back face 180°" },
    { move: "D2", description: "Rotate the down face 180°" }
];
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "5px 10px")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("font-size", "12px")
    .style("visibility", "hidden");


// Fetch and visualize data
Promise.all([
    d3.json(moveFrequencyPath),
    d3.json(commonSequencesPath),
    d3.json(cfopDistributionPath)
]).then(([moveFrequencyData, commonSequencesData, cfopDistributionData]) => {
    // Load data for the first training file (`training.0`)
    const moveFrequency = moveFrequencyData["training.0"] || {};
    const commonSequences = commonSequencesData["training.0"] || {};
    const cfopDistribution = cfopDistributionData["training.0"] || {};
    // Render move notation images
    renderMoveNotation("#move-images-section");

    // Render charts
    renderBarChart("#move-frequency-svg", moveFrequency, "Move", "Count");
    renderBarChart("#common-sequences-svg", transformSequenceData(commonSequences), "Sequence", "Count", true);
    renderStackedBarChart("#cfop-phase-svg", cfopDistribution);
    renderCFOPImages("#cfop-images")
});


// Render move notation images
function renderMoveNotation(selector) {
    const container = d3.select(selector).append("div").attr("class", "move-grid");

    container.selectAll(".move-block")
        .data(moveDescription)
        .join("div")
        .attr("class", "move-block")
        .on("mouseover", (event, d) => {
            tooltip.html(`<strong>${d.move}</strong>: ${d.description}`)
                .style("visibility", "visible");
        })
        .on("mousemove", (event) => {
            tooltip.style("top", `${event.pageY - 30}px`).style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
        })
        .html(d => `
            <img src="assets/moves/${d.move}.png" alt="${d.move}">
            <p>${d.move}</p>
        `);
}

// Transform sequence data into a format suitable for rendering
function transformSequenceData(data) {
    const transformed = {};
    data.forEach(({ sequence, count }) => {
        transformed[sequence.join(" ")] = count;
    });
    return transformed;
}

// Render bar chart
function renderBarChart(selector, data, xLabel, yLabel, isSequence = false) {
    d3.select(selector).selectAll("*").remove();
    const svgWidth = 600; 
    const svgHeight = 400;

    const margin = { top: 20, right: 30, bottom: 80, left: 100 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3.select(selector).append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(Object.keys(data))
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(Object.values(data))])
        .nice()
        .range([height, 0]);

    // Define bar colors
    const barColor = isSequence ? "#617c8d" : "#5b8d4f";

    chart.append("g")
        .selectAll("rect")
        .data(Object.entries(data))
        .join("rect")
        .attr("x", d => xScale(d[0]))
        .attr("y", d => yScale(d[1]))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d[1]))
        .attr("rx", 3) 
        .attr("ry", 3) 
        .attr("fill", barColor)
        .on("mouseover", (event, d) => {
            const moveInfo = moveDescription.find(m => m.move === d[0]);
            const description = moveInfo && moveInfo.description ? `: ${moveInfo.description}` : "";
            tooltip.html(`<strong>${d[0]}</strong>${description}<br>Count: ${d[1]}`)
                .style("visibility", "visible");
        })
        .on("mousemove", (event) => {
            tooltip.style("top", `${event.pageY - 30}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
    });
    

    // Add Y-axis
    chart.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d3.format(".2e")))
        .selectAll("text")
        .style("font-family", "Figtree");

    // Add X-axis
    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", isSequence ? "rotate(-45)" : null)
        .style("text-anchor", isSequence ? "end" : "middle")
        .style("font-family", "Figtree");

    // Add X-axis label
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", height + margin.top + 50)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label")
        .text(xLabel);

    // Add Y-axis label
    svg.append("text")
        .attr("x", -(height / 2 + margin.top))
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("class", "axis-label")
        .text(yLabel);
}

// Render stacked bar chart
function renderStackedBarChart(selector, data) {
    d3.select(selector).selectAll("*").remove();

    const svgWidth = 600;
    const svgHeight = 500;

    const margin = { top: 20, right: 150, bottom: 80, left: 100 }; // Adjust margin for legend
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3.select(selector).append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const keys = Object.keys(data[Object.keys(data)[0]]);
    const xKeys = Object.keys(data);
    const customXLabels = {
        "cross": "Cross",
        "f2l": "F2L",
        "oll": "OLL",
        "pll": "PLL"
    };

    const xScale = d3.scaleBand()
        .domain(xKeys)
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(Object.values(data), d => d3.sum(Object.values(d)))])
        .nice()
        .range([height, 0]);

    const colorScheme = [
        "#e36a5d", "#6590a6", "#85c17c", "#e6cf61", "#d69b5c", "#f4e4b8",
        "#a86464", "#7ab3c4", "#5e7f93", "#c8b456", "#b8795a", "#f7e6ca",
        "#c085c0", "#7ba2b3", "#71b367", "#f0b63f", "#ea8c5a", "#f3dcb0"
    ];
    const colorScale = d3.scaleOrdinal().domain(keys).range(colorScheme);

    const stack = d3.stack().keys(keys)(Object.values(data));

    // Add bars with tooltip
    chart.selectAll("g")
        .data(stack)
        .join("g")
        .attr("fill", d => colorScale(d.key))
        .each(function (layer, i) {
            d3.select(this).selectAll("rect")
                .data(layer)
                .join("rect")
                .attr("x", (_, index) => xScale(Object.keys(data)[index]))
                .attr("y", d => yScale(d[1]))
                .attr("height", d => yScale(d[0]) - yScale(d[1]))
                .attr("width", xScale.bandwidth())
                .on("mouseover", function (event, d) {
                    const key = layer.key; // Access key directly from layer
                    tooltip.html(`<strong>${key}</strong>: ${d[1] - d[0]}`)
                        .style("visibility", "visible");
                })
                .on("mousemove", (event) => {
                    tooltip.style("top", `${event.pageY - 30}px`)
                        .style("left", `${event.pageX + 10}px`);
                })
                .on("mouseout", () => {
                    tooltip.style("visibility", "hidden");
                });
        });


    // Add Y-axis
    chart.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d3.format(".2e")))
        .selectAll("text")
        .style("font-family", "Figtree");

    // Add X-axis with custom labels
    const customXAxis = d3.axisBottom(xScale).tickFormat(d => customXLabels[d] || d);

    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(customXAxis)
        .selectAll("text")
        .style("text-anchor", "middle")
        .style("font-family", "Figtree")
        .style("font-size", "12px");

    // Add X-axis label
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", height + margin.top + 50)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label")
        .text("Phase");

    // Add Y-axis label
    svg.append("text")
        .attr("x", -(height / 2 + margin.top))
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("class", "axis-label")
        .text("Count");

    // Add legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width + margin.right}, ${margin.top})`);

    keys.forEach((key, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        legendRow.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", colorScale(key))
            .attr("rx", 2)
            .attr("ry", 2);

        legendRow.append("text")
            .attr("x", 20)
            .attr("y", 10)
            .attr("text-anchor", "start")
            .style("font-family", "Figtree")
            .style("font-size", "12px")
            .text(key);
    });
}

function renderCFOPImages(selector) {
    const cfopSteps = [
        {
            step: "Step 1. Cross",
            description: "Solve a cross onto one of the sides of the cube; most commonly the white side.",
            images: [
                { src: "assets/phases/cross-1.png" },
                { src: "assets/phases/cross-2.png" }
            ]
        },
        {
            step: "Step 2. F2L (First Two Layers)",
            description: "Solve the first two layers by pairing and inserting corner and edge pieces simultaneously.",
            images: [
                { src: "assets/phases/f2l-1.png" },
                { src: "assets/phases/f2l-2.png" },
                { src: "assets/phases/f2l-3.png" }
            ]
        },
        {
            step: "Step 3. OLL (Orientation of the Last Layer)",
            description: "Orient the last layer edges and corners.",
            images: [
                { src: "assets/phases/oll-1.png" },
                { src: "assets/phases/oll-2.png" }
            ]
        },
        {
            step: "Step 4. PLL (Permutation of the Last Layer)",
            description: "Solve the last layer edges and corners.",
            images: [
                { src: "assets/phases/pll-1.png" },
                { src: "assets/phases/pll-2.png" }
            ]
        }
    ];

    const container = d3.select(selector).append("div").attr("class", "cfop-images");

    cfopSteps.forEach((step) => {
        const stepContainer = container.append("div").attr("class", "phase-step");
        stepContainer.append("h5").text(step.step);

        const imageContainer = stepContainer.append("div").attr("class", "step-images");
        step.images.forEach((img, index) => {
            imageContainer.append("img")
                .attr("src", img.src)
                .attr("alt", img.alt)
                .on("mouseover", (event) => {
                    tooltip.html(`${step.description}`)
                        .style("visibility", "visible");
                })
                .on("mousemove", (event) => {
                    tooltip
                        .style("top", `${event.pageY - 30}px`)
                        .style("left", `${event.pageX + 10}px`);
                })
                .on("mouseout", () => {
                    tooltip.style("visibility", "hidden");
                });

            if (index < step.images.length - 1) {
                imageContainer.append("span")
                    .text("→")
                    .attr("class", "arrow");
            }
        });
    });
}




