// Paths to data files
const moveFrequencyPath = "data/move_frequency.json";
const commonSequencesPath = "data/common_sequences.json";
const cfopDistributionPath = "data/cfop_distribution.json";

const tsne_50_solutionsPath = "data/tsne/tsne_50_solutions.csv";
const tsne_250_solutionsPath = "data/tsne/tsne_250_solutions.csv";
const tsne_1000_solutionsPath = "data/tsne/tsne_1000_solutions.csv";

const cubeHeatmapPath = "data/cube_heatmap.json";

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

// Parse cube state
function parseCubeState(state, json=true) {
    const stateData = json ? JSON.parse(state) : state;

    const faces = [];
    const faceData = stateData.slice(0, 54); // Take the first 54 elements
    for (let i = 0; i < 6; i++) {
        faces.push(faceData.slice(i * 9, (i + 1) * 9)); // Extract 9 elements for each face
    }
    return faces;
}

// Render cube visualization in tooltip
function renderCubeVisualization(faces, container) {
    // Clear previous content
    container.html("");

    const faceMap = {
        "U": faces[1], // Upper face
        "L": faces[0], // Left face
        "F": faces[2], // Front face
        "R": faces[4], // Right face
        "B": faces[5], // Back face
        "D": faces[3], // Down face
    };

    const colorMap = {
        0: "red",
        1: "yellow",
        2: "green",
        3: "white",
        4: "orange",
        5: "blue",
    };

    const layout = [
        ["", "U", "", ""],
        ["L", "F", "R", "B"],
        ["", "D", "", ""],
    ];

    const table = container.append("table")
        .style("border-spacing", "5px")
        .style("margin", "auto")
        .style("table-layout", "fixed");

    layout.forEach(row => {
        const tableRow = table.append("tr");
        row.forEach(cell => {
            const tableCell = tableRow.append("td");
            if (cell === "") {
                tableCell.style("width", "60px").style("height", "60px");
            } else {
                const face = faceMap[cell];
                const faceTable = tableCell.append("table")
                    .style("border-spacing", "1px")
                    .style("margin", "auto")
                    .style("table-layout", "fixed");
                
                for (let i = 0; i < 3; i++) {
                    const faceRow = faceTable.append("tr");
                    for (let j = 0; j < 3; j++) {
                        const cellElement = faceRow.append("td")
                            .style("width", "15px")
                            .style("height", "15px")
                            .style("background-color", colorMap[face[i * 3 + j]])
                            .style("border", "1px solid #000");

                        // Add face label in the middle cell
                        if (i === 1 && j === 1) { 
                            cellElement
                                .append("div")
                                .style("text-align", "center")
                                .style("font-size", "10px")
                                .style("font-weight", "bold")
                                .style("color", "black") 
                                .text(cell); 
                        }
                    }
                }
            }
        });
    });
}


// Fetch and visualize data
Promise.all([
    d3.json(moveFrequencyPath),
    d3.json(commonSequencesPath),
    d3.json(cfopDistributionPath),
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

// Instantiate tSNE visualization with 50 solution data
d3.csv(tsne_50_solutionsPath).then(data => {
    let minSolvedness = d3.min(data, d => +d.solvedness);
    const tsneData = data.map(d => ({
        x: +d.x,
        y: +d.y,
        solvedness: +d.solvedness,
        norm_solvedness: (+d.solvedness - minSolvedness) / (1 - minSolvedness),
        phase: d.state.split(",")[d.state.split(",").length - 1][1],
        faces: parseCubeState(d.state)
    }));
    renderTSNE("#tsne-plot-svg", tsneData, "50", "solvedness");
});

// Listen for when new t-SNE data is selected
d3.select("#tsne-select").on("change", function () {
    const selectedValue = this.value;
    let tsnePath = "";
    if (selectedValue === "50") {
        tsnePath = tsne_50_solutionsPath;
    } else if (selectedValue === "250") {
        tsnePath = tsne_250_solutionsPath;
    } else if (selectedValue === "1000") {
        tsnePath = tsne_1000_solutionsPath;
    }

    // Get currently selected coloring
    const selectedColoring = d3.select("#coloring-select").node().value;

    // Get the currently selected visualization type
    const visualizationType = d3.select("#visualization-select").node().value;

    d3.csv(tsnePath).then(data => {
        let minSolvedness = d3.min(data, d => +d.solvedness);
        const tsneData = data.map(d => ({
            x: +d.x,
            y: +d.y,
            solvedness: +d.solvedness,
            norm_solvedness: (+d.solvedness - minSolvedness) / (1 - minSolvedness),
            phase: d.state.split(",")[d.state.split(",").length - 1][1],
            faces: parseCubeState(d.state)
        }));
        if(visualizationType === "scatterplot") {
            renderTSNE("#tsne-plot-svg", tsneData, selectedValue, selectedColoring);
        } else if (visualizationType === "voronoi") {
            renderTSNEVoronoi("#tsne-plot-svg", tsneData, selectedValue, selectedColoring);
        }
    });
});

// Listen for when new coloring is selected
d3.select("#coloring-select").on("change", function () {
    selectedColoring = this.value;

    // Get currently selected t-SNE data
    const selectedValue = d3.select("#tsne-select").node().value;
    let tsnePath = "";
    if (selectedValue === "50") {
        tsnePath = tsne_50_solutionsPath;
    } else if (selectedValue === "250") {
        tsnePath = tsne_250_solutionsPath;
    } else if (selectedValue === "1000") {
        tsnePath = tsne_1000_solutionsPath;
    }   
    
    // Get the currently selected visualization type
    const visualizationType = d3.select("#visualization-select").node().value;

    d3.csv(tsnePath).then(data => {
        let minSolvedness = d3.min(data, d => +d.solvedness);
        const tsneData = data.map(d => ({
            x: +d.x,
            y: +d.y,
            solvedness: +d.solvedness,
            norm_solvedness: (+d.solvedness - minSolvedness) / (1 - minSolvedness),
            phase: d.state.split(",")[d.state.split(",").length - 1][1],
            faces: parseCubeState(d.state)
        }));
        if(visualizationType === "scatterplot") {
            renderTSNE("#tsne-plot-svg", tsneData, selectedValue, selectedColoring);
        } else if (visualizationType === "voronoi") {
            renderTSNEVoronoi("#tsne-plot-svg", tsneData, selectedValue, selectedColoring);
        }
    });
});

// Listen for when tSNE visualization is changed (scatterplot, voronoi)
d3.select("#visualization-select").on("change", function () {
    let selectedVisiualization = this.value;
    
    // Get currently selected t-SNE data
    let selectedValue = d3.select("#tsne-select").node().value;
    let tsnePath = "";
    if (selectedValue === "50") {
        tsnePath = tsne_50_solutionsPath;
    } else if (selectedValue === "250") {
        tsnePath = tsne_250_solutionsPath;
    } else if (selectedValue === "1000") {
        tsnePath = tsne_1000_solutionsPath;
    }   

    let selectedColoring = d3.select("#coloring-select").node().value;

    d3.csv(tsnePath).then(data => {
        let minSolvedness = d3.min(data, d => +d.solvedness);
        const tsneData = data.map(d => ({
            x: +d.x,
            y: +d.y,
            solvedness: +d.solvedness,
            norm_solvedness: (+d.solvedness - minSolvedness) / (1 - minSolvedness),
            phase: d.state.split(",")[d.state.split(",").length - 1][1],
            faces: parseCubeState(d.state)
        }));
        if(selectedVisiualization === "scatterplot") {
            renderTSNE("#tsne-plot-svg", tsneData, selectedValue, selectedColoring);
        } else if (selectedVisiualization === "voronoi") {
            renderTSNEVoronoi("#tsne-plot-svg", tsneData, selectedValue, selectedColoring);
        }
    });
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

function renderTSNE(selector, data, n_solutions, coloring="solvedness") {
    const colorScheme = [
        "#e36a5d", "#6590a6", "#85c17c", "#e6cf61", "#d69b5c", "#f4e4b8",
        "#a86464", "#7ab3c4", "#5e7f93", "#c8b456", "#b8795a", "#f7e6ca",
        "#c085c0", "#7ba2b3", "#71b367", "#f0b63f", "#ea8c5a", "#f3dcb0"
    ];

    d3.select(selector).selectAll("*").remove();

    const svgWidth = 1200;
    const svgHeight = 600;

    // Create scatterplot with t-SNE data
    const margin = { top: 30, right: 100, bottom: 30, left: 100 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3.select(selector).append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.x))
        .nice()
        .range([margin.left, width]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.y))
        .nice()
        .range([height, margin.top]);

    svg.append("g")

    // Add circles
    const solvednessColorScale = d3.scaleLinear()
        .domain([0, 1])
        .range(["#202640","#e36a5d"]); 

    const phaseColorScheme = [
        "#202640",
        "#98ACB8",
        "#CC938B",
        "#9AC190",
        "#CDA884",
    // "#F6F3E0"
    ];

    svg.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", d => {
            let size = 0;
            if (d.solvedness === 1) size += 3;
                
            if (n_solutions === "50") {
                size += 5;
            } else if (n_solutions === "250") {
                size += 4;
            } else if (n_solutions === "1000") {
                size += 3;
            }
            return size;
        })
        .attr("fill", d => {
            if (d.solvedness === 1 || d.phase === "5") return "#e6cf61";
            if (coloring === "solvedness") {
                return solvednessColorScale(d.norm_solvedness);
            } else if (coloring === "phase") {
                return phaseColorScheme[+d.phase];
            }
        })
        .attr("z-index", d => {
            if (d.solvedness === 1 || d.phase === "5") {
                return -10;
            } else {
                return 0;
            }
        })
        .on("mouseover", (event, d) => {
            if (d.phase === "0") {
                phase = "Scrambled";
            } else if (d.phase === "1") {
                phase = "Cross";
            } else if (d.phase === "2") {
                phase = "F2L";
            } else if (d.phase === "3") {
                phase = "OLL";
            } else if (d.phase === "4") {
                phase = "PLL";
            } else if (d.phase === "5") {
                phase = "Solved";
            }
            tooltip.html(`Solvedness: ${(d.solvedness*100).toFixed(2)}%<br>Phase: ${phase}`)
                .style("visibility", "visible");
            const container = tooltip.append("div");
            renderCubeVisualization(d.faces, container);
        })
        .on("mousemove", (event) => {
            tooltip.style("top", `${event.pageY - 30}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
        });

    // Add X-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("font-family", "Figtree");

    // Add Y-axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-family", "Figtree");

    // Add X-axis label
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", height + margin.top + 20)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label")
        .text("t-SNE X");

    // Add Y-axis label
    svg.append("text")
        .attr("x", -(height / 2 + margin.top))
        .attr("y", margin.right - 50)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("class", "axis-label")
        .text("t-SNE Y");

    // Add title
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("class", "title")
        .text(`t-SNE Visualization of ${n_solutions} Solutions (${data.length} unique states)`);

    // Add color legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, ${margin.top})`);

    legend.append("text")
        .attr("x", 40)
        .attr("y", 20)
        .attr("text-anchor", "start")
        .text("Solved");

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 10)
        .attr("width", 30)
        .attr("height", 12)
        .attr("fill", "#e6cf61");

    if(coloring === "solvedness") {
        const legendGradient = svg.append("g")
            .attr("transform", `translate(${width + 20}, ${margin.top + 50})`);

        const gradient = legendGradient.append("defs")
            .append("linearGradient")
            .attr("id", "color-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#e36a5d");

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#202640");

        legendGradient.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 30)
            .attr("height", 300)
            .attr("fill", "url(#color-gradient)");

        legendGradient.append("text")
            .attr("x", 40)
            .attr("y", 150)
            .attr("text-anchor", "start")
            .text("Solvedness");
        
        legendGradient.append("text")
            .attr("x", 40)
            .attr("y", 300)
            .attr("text-anchor", "start")
            .attr("font-size", "18px")
            .text("0%");

        legendGradient.append("text")
            .attr("x", 40)
            .attr("y", 10)
            .attr("text-anchor", "start")
            .attr("font-size", "18px")
            .text("100%");
    } else if (coloring === "phase") {
        const phaseLegend = svg.append("g")
            .attr("transform", `translate(${width + 20}, ${margin.top + 40})`);

        const phaseColorScheme = [
            "#202640",
            "#98ACB8",
            "#CC938B",
            "#9AC190",
            "#CDA884",
        ];

        phaseColorScheme.forEach((color, i) => {
            phaseLegend.append("rect")
                .attr("x", 0)
                .attr("y", i * 30)
                .attr("width", 30)
                .attr("height", 12)
                .attr("fill", color);
            
            if (i === 0) {
                phase = "Scrambled";
            } else if (i === 1) {
                phase = "Cross";
            } else if (i === 2) {
                phase = "F2L";
            } else if (i === 3) {
                phase = "OLL";
            } else if (i === 4) {
                phase = "PLL";
            } else if (i === 5) {
                phase = "Solved";
            }

            phaseLegend.append("text")
                .attr("x", 40)
                .attr("y", i * 30 + 10)
                .attr("text-anchor", "start")
                .text(`${phase}`);
        });
    }
}

function renderTSNEVoronoi(selector, data, n_solutions, coloring) {
    // Same as above, but instead of rendering a scatterplot of circles, render a Voronoi diagram
    // with each cell colored according to the coloring parameter

    d3.select(selector).selectAll("*").remove();

    const svgWidth = 1200;
    const svgHeight = 600;

    // Create scatterplot with t-SNE data
    const margin = { top: 30, right: 100, bottom: 30, left: 100 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3.select(selector).append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.x))
        .nice()
        .range([margin.left, width]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.y))
        .nice()
        .range([height, margin.top]);

    // Add Voronoi diagram
    const voronoi = d3.Delaunay.from(data.map(d => [xScale(d.x), yScale(d.y)])).voronoi([margin.left, margin.top, width, height]);

    // Pair the Voronoi cells with the data
    const voronoiData = voronoi.cellPolygons().map((polygon, i) => ({ polygon, data: data[i] }));

    // Define color scales
    const solvednessColorScale = d3.scaleLinear()
        .domain([0, 1])
        .range(["#202640", "#e36a5d"]);

    const phaseColorScheme = [
        "#202640",
        "#98ACB8",
        "#CC938B",
        "#9AC190",
        "#CDA884",
    ];

    // Add Voronoi cells
    svg.append("g")
        .selectAll("path")
        .data(voronoiData)
        .join("path")
        .attr("d", d => d ? `M${d.polygon.join("L")}Z` : null)
        .attr("fill", d => {
            if (d.data.solvedness === 1 || d.data.phase === "5") return "#e6cf61";
            if (coloring === "solvedness") {
                return solvednessColorScale(d.data.norm_solvedness);
            } else if (coloring === "phase") {
                return phaseColorScheme[+d.data.phase];
            }
        })
        .attr("stroke", d => {
            if (d.data.solvedness === 1 || d.data.phase === "5") return "#e6cf61";
            if (coloring === "solvedness") {
                return solvednessColorScale(d.data.norm_solvedness);
            } else if (coloring === "phase") {
                return phaseColorScheme[+d.data.phase];
            }
        })
        .attr("stroke-width", 1)
        .on("mouseover", (event, d) => {
            if (d.data.phase === "0") {
                phase = "Scrambled";
            } else if (d.data.phase === "1") {
                phase = "Cross";
            } else if (d.data.phase === "2") {
                phase = "F2L";
            } else if (d.data.phase === "3") {
                phase = "OLL";
            } else if (d.data.phase === "4") {
                phase = "PLL";
            } else if (d.data.phase === "5") {
                phase = "Solved";
            }
            tooltip.html(`Solvedness: ${(d.data.solvedness*100).toFixed(2)}%<br>Phase: ${phase}`)
                .style("visibility", "visible");
            const container = tooltip.append("div");
            renderCubeVisualization(d.data.faces, container);
        })
        .on("mousemove", (event) => {
            tooltip.style("top", `${event.pageY - 30}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
        });
   

    // Add X-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("font-family", "Figtree");

    // Add Y-axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-family", "Figtree");

    // Add X-axis label
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", height + margin.top + 20)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label")
        .text("t-SNE X");

    // Add Y-axis label
    svg.append("text")
        .attr("x", -(height / 2 + margin.top))
        .attr("y", margin.right - 50)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("class", "axis-label")
        .text("t-SNE Y");

    // Add title
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("class", "title")
        .text(`t-SNE Visualization of ${n_solutions} Solutions (${data.length} unique states)`);

    // Add color legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, ${margin.top})`);

    legend.append("text")
        .attr("x", 40)
        .attr("y", 20)
        .attr("text-anchor", "start")
        .text("Solved");

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 10)
        .attr("width", 30)
        .attr("height", 12)
        .attr("fill", "#e6cf61");

    if(coloring === "solvedness") {
        const legendGradient = svg.append("g")
            .attr("transform", `translate(${width + 20}, ${margin.top + 50})`);

        const gradient = legendGradient.append("defs")
            .append("linearGradient")
            .attr("id", "color-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#e36a5d");

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#202640");

        legendGradient.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 30)
            .attr("height", 300)
            .attr("fill", "url(#color-gradient)");

        legendGradient.append("text")
            .attr("x", 40)
            .attr("y", 150)
            .attr("text-anchor", "start")
            .text("Solvedness");
        
        legendGradient.append("text")
            .attr("x", 40)
            .attr("y", 300)
            .attr("text-anchor", "start")
            .attr("font-size", "18px")
            .text("0%");

        legendGradient.append("text")
            .attr("x", 40)
            .attr("y", 10)
            .attr("text-anchor", "start")
            .attr("font-size", "18px")
            .text("100%");
    } else if (coloring === "phase") {
        const phaseLegend = svg.append("g")
            .attr("transform", `translate(${width + 20}, ${margin.top + 40})`);

        const phaseColorScheme = [
            "#202640",
            "#98ACB8",
            "#CC938B",
            "#9AC190",
            "#CDA884",
        ];

        phaseColorScheme.forEach((color, i) => {
            phaseLegend.append("rect")
                .attr("x", 0)
                .attr("y", i * 30)
                .attr("width", 30)
                .attr("height", 12)
                .attr("fill", color);
            
            if (i === 0) {
                phase = "Scrambled";
            } else if (i === 1) {
                phase = "Cross";
            } else if (i === 2) {
                phase = "F2L";
            } else if (i === 3) {
                phase = "OLL";
            } else if (i === 4) {
                phase = "PLL";
            } else if (i === 5) {
                phase = "Solved";
            }

            phaseLegend.append("text")
                .attr("x", 40)
                .attr("y", i * 30 + 10)
                .attr("text-anchor", "start")
                .text(`${phase}`);
        });
    }
}

// Cube heatmap
d3.json(cubeHeatmapPath).then((data) => {
    // combine the data for all phases


    allData = Array(54).fill(0);
    for (let phase in data) {
        allData = allData.map((val, i) => val + data[phase][i]);
    }


    // Render the cube heatmap
    renderHeatmap("#move-heatmap-svg", allData);
})

// Event listeners for the move heatmap checkboxes
// These determine which phases to count in the heatmap creation
d3.selectAll(".move-checkbox").on("change", function () {
    const checkedBoxes = d3.selectAll(".move-checkbox").nodes().filter(d => d.checked);
    const selectedPhases = checkedBoxes.map(d => d.value);

    // console.log(selectedPhases);

    // convert selected phases to numbers: "cross" -> 1, "f2l" -> 2, etc.
    const selectedPhasesNumbers = selectedPhases.map(phase => {
        if (phase === "cross") return 1;
        if (phase === "f2l") return 2;
        if (phase === "oll") return 3;
        if (phase === "pll") return 4;
    });

    // console.log(selectedPhasesNumbers)

    d3.json(cubeHeatmapPath).then((data) => {
        let allData = Array(54).fill(0)
        selectedPhasesNumbers.forEach(phase => {
            allData = allData.map((val, i) => val + data[phase][i]);
        });
        renderHeatmap("#move-heatmap-svg", allData);
    })
});

function renderHeatmap(selector, data) {
    // Heatmap should show the cube layout and color each square according to the number of times it was changed

    d3.select(selector).selectAll("*").remove();

    const svgWidth = 400;
    const svgHeight = 300;

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3.select(selector).append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    const maxCount = d3.max(data);

    let faces = parseCubeState(data, false);

    const faceMap = {
        "U": faces[1], // Upper face
        "L": faces[0], // Left face
        "F": faces[2], // Front face
        "R": faces[4], // Right face
        "B": faces[5], // Back face
        "D": faces[3], // Down face
    };

    const face2id = {
        "U": 1,
        "L": 0,
        "F": 2,
        "R": 4,
        "B": 5,
        "D": 3,
    }

    const colorMap = {
        0: "red",
        1: "yellow",
        2: "green",
        3: "white",
        4: "orange",
        5: "blue",
    };

    const layout = [
        ["", "U", "", ""],
        ["L", "F", "R", "B"],
        ["", "D", "", ""],
    ];

    const table = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add black background beneath the cube visualization
    table.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "black")
        .attr("rx", 10)  
        .attr("ry", 10);

    layout.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell !== "") {
                const face = faceMap[cell];
                const faceCol = colorMap[face2id[cell]];
                const faceGroup = table.append("g")
                    .attr("transform", `translate(${30 + colIndex * 75},${15 + rowIndex * 75})`);

                face.forEach((value, index) => {
                    const x = (index % 3) * 25;
                    const y = Math.floor(index / 3) * 25;
                    const opacity = value / maxCount;

                    let curr_class = index === 4 ? "center" : "noncenter";

                    if(value === 0) {
                        faceGroup.append("rect")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("width", 25)
                            .attr("height", 25)
                            .attr("fill", null)
                            .attr("opacity", "100")
                            .attr("stroke", faceCol)
                            .style("stroke-dasharray", ("3, 3"))
                            .classed(curr_class, true);        
                    } else {
                        faceGroup.append("rect")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("width", 25)
                            .attr("height", 25)
                            .attr("fill", faceCol)
                            .attr("opacity", opacity)
                            .attr("stroke", null)
                            .classed(curr_class, true)    
                            .attr("data-value", value);
                    }   
                });
            }
        });
    });

    // Tooltip
    let totalSum = d3.sum(data);
    table.selectAll(".noncenter")
        .on("mouseover", (event, d) => {
            const color = event.target.getAttribute("fill");
            const opacity = event.target.getAttribute("opacity");
            let countN = event.target.getAttribute("data-value");
            const count = d3.format(",")(countN);
            const percentage = countN > 0 ? d3.format(".2%")(countN / totalSum) : "0%";
            const text = `Count: ${count}<br>Percentage: ${percentage}`;
            tooltip.html(text)
                .style("visibility", "visible");
        })
        .on("mousemove", (event) => {
            tooltip.style("top", `${event.pageY - 30}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
        });

}

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}