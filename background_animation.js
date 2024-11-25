// animation config
let is_animating = true;
let square_opacity = 0.5;
let move_speed = 1;
let repeat_delay = 1500;

let timeoutId = null;

// Globals
let grid = [];
let background_animation_div;
let rounded_square_svg_file;
let width;
let height;
let grid_width;
let grid_height;
let squareSize;
let style;
let default_bezier = "cubic-bezier(0.77, 0.03, 0.27, 0.99)";
let edge_bezier = "cubic-bezier(.83,-0.01,.18,.99)";

function setupAnimation() {

    background_animation_div = document.getElementById("background-animation");
    rounded_square_svg_file = "rounded_square.svg";

    // Move the div to the top left 
    background_animation_div.style.position = "fixed";
    background_animation_div.style.top = "0";
    background_animation_div.style.left = "0";
    
    // Create a grid of rounded squares in the background
    width = window.innerWidth;
    height = window.innerHeight;

    grid_width = Math.round(width / 50);
    grid_height = Math.round(height / 50);
    grid = [];

    squareSize = Math.min(width/grid_width, height/grid_height) * 0.9;

    // Create square CSS class
    style = document.createElement("style");
    style.innerHTML = `
        .rounded_square {
            width: ${squareSize}px;
            height: ${squareSize}px;
            opacity: ${square_opacity};
            padding: 0px;
            z-index: -9;
            margin: 1px;
            position: absolute;
            transform: translate(0, 0);
            transition: transform ${move_speed}s cubic-bezier(0.77, 0.03, 0.27, 0.99);
        }
    `;
    document.head.appendChild(style);

    let color_filters = [
        "brightness(0) saturate(100%) invert(100%) sepia(45%) saturate(650%) hue-rotate(303deg) brightness(103%) contrast(103%)",
        "brightness(0) saturate(100%) invert(32%) sepia(25%) saturate(1453%) hue-rotate(308deg) brightness(91%) contrast(85%)",
        "brightness(0) saturate(100%) invert(48%) sepia(7%) saturate(4374%) hue-rotate(342deg) brightness(88%) contrast(69%)",
        "brightness(0) saturate(100%) invert(81%) sepia(5%) saturate(3770%) hue-rotate(12deg) brightness(85%) contrast(81%)",
        "brightness(0) saturate(100%) invert(53%) sepia(9%) saturate(2070%) hue-rotate(71deg) brightness(96%) contrast(85%)",
        "brightness(0) saturate(100%) invert(42%) sepia(17%) saturate(1187%) hue-rotate(172deg) brightness(95%) contrast(90%)"
    ];

    for (let i = 0; i < grid_width; i++) {
        grid.push([]);
        for (let j = 0; j < grid_height; j++) {
            let square = document.createElement("img");
            square.src = rounded_square_svg_file;
            square.className = "rounded_square";
            square.style.filter = color_filters[Math.floor(Math.random() * color_filters.length)];
            square.dataset.row = i; // store initial position
            square.dataset.col = j;
            square.style.transform = `translate(${(i / grid_width) * 100}vw, ${(j / grid_height) * 100}vh)`;
            grid[i].push(square);
        }
    }

    for (let i = 0; i < grid_width; i++) {
        for (let j = 0; j < grid_height; j++) {
            background_animation_div.appendChild(grid[i][j]);
        }
    }

    do_animation();
}

// Animate the grid
function do_animation() {
    if (!is_animating) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        return;
    }

    // do a 'clean' for the squares before animating
    // make sure the move speeds are all reset
    // make sure no animation timeouts are running

    for (let i = 0; i < grid_width; i++) {
        for (let j = 0; j < grid_height; j++) {
            let square = grid[i][j];
            square.style.transition = `transform ${move_speed}s ${default_bezier}`;
        }
    }
    

    if (Math.random() > 0.5) { // Animate a row
        let random_row = Math.floor(Math.random() * grid_width);
        let direction = Math.random() > 0.5 ? 1 : -1;

        let new_row = [];
        for (let i = 0; i < grid_height; i++) {
            new_row.push(grid[random_row][(i + direction + grid_height) % grid_height]);
        }

        for (let i = 0; i < grid_height; i++) {
            grid[random_row][i] = new_row[i];
            let square = grid[random_row][i];

            // if its the edge square...
            if((i == 0 && direction == -1) || (i == grid_height - 1 && direction == 1)) {

                if(i == grid_height - 1) { // if its the top edge square moving to the bottom edge

                    // Step 1: go off screen (up)
                    square.style.transform = `translate(${(random_row / grid_width) * 100}vw, ${((-1) / grid_height) * 100}vh)`;
                    square.style.transition = `transform ${move_speed/2}s ${edge_bezier}`;

                    // Step 2: teleport to the bottom
                    setTimeout(() => {
                        square.style.transform = `translate(${(random_row / grid_width) * 100}vw, ${((grid_height + 1) / grid_height) * 100}vh)`;
                        square.style.transition = `transform 0s`;
                    }, move_speed/4 * 1000);

                    // Step 3: come back on screen (down)
                    setTimeout(() => {
                        square.style.transform = `translate(${(random_row / grid_width) * 100}vw, ${(i / grid_height) * 100}vh)`;
                        square.style.transition = `transform ${move_speed/2}s ${edge_bezier}`;
                    }, (move_speed/2) * 1000);
                } else {
                    // Step 1: go off screen (down)
                    square.style.transform = `translate(${(random_row / grid_width) * 100}vw, ${(grid_height) / grid_height * 100}vh)`;
                    square.style.transition = `transform ${move_speed/2}s ${edge_bezier}`;

                    // Step 2: teleport to the top
                    setTimeout(() => {
                        square.style.transform = `translate(${(random_row / grid_width) * 100}vw, ${((-1) / grid_height) * 100}vh)`;
                        square.style.transition = `transform 0s`;
                    }, move_speed/4 * 1000);

                    // Step 3: come back on screen (up)
                    setTimeout(() => {
                        square.style.transform = `translate(${(random_row / grid_width) * 100}vw, ${(i / grid_height) * 100}vh)`;
                        square.style.transition = `transform ${move_speed/2}s ${edge_bezier}`;
                    }, (move_speed/2) * 1000);
                }
            } else {
                // Slide by one square to new position
                square.style.transition = `transform ${move_speed}s ${default_bezier}`;
                square.style.transform = `translate(${(random_row / grid_width) * 100}vw, ${(i / grid_height) * 100}vh)`;
            }
        }
    } else { // Animate a column
        let random_column = Math.floor(Math.random() * grid_height);
        let direction = Math.random() > 0.5 ? 1 : -1;

        let new_column = [];
        for (let i = 0; i < grid_width; i++) {
            new_column.push(grid[(i + direction + grid_width) % grid_width][random_column]);
        }

        for (let i = 0; i < grid_width; i++) {
            grid[i][random_column] = new_column[i];
            let square = grid[i][random_column];

            // if its the edge square...
            if((i == 0 && direction == -1) || (i == grid_width - 1 && direction == 1)) {

                if(i == grid_width - 1) { // if its the left edge square moving to the right edge

                    // Step 1: go off screen (left)
                    square.style.transform = `translate(${((-1) / grid_width) * 100}vw, ${(random_column / grid_height) * 100}vh)`;
                    square.style.transition = `transform ${move_speed/2}s ${edge_bezier}`;

                    // Step 2: teleport to the right
                    setTimeout(() => {
                        square.style.transform = `translate(${((grid_width + 1) / grid_width) * 100}vw, ${(random_column / grid_height) * 100}vh)`;
                        square.style.transition = `transform 0s`;
                    }, move_speed/4 * 1000);

                    // Step 3: come back on screen (right)
                    setTimeout(() => {
                        square.style.transform = `translate(${(i / grid_width) * 100}vw, ${(random_column / grid_height) * 100}vh)`;
                        square.style.transition = `transform ${move_speed/2}s ${edge_bezier}`;
                    }, (move_speed/2) * 1000);
                } else {
                    // Step 1: go off screen (right)
                    square.style.transform = `translate(${(grid_width) / grid_width * 100}vw, ${(random_column / grid_height) * 100}vh)`;
                    square.style.transition = `transform ${move_speed/2}s ${edge_bezier}`;

                    // Step 2: teleport to the left
                    setTimeout(() => {
                        square.style.transform = `translate(${((-1) / grid_width) * 100}vw, ${(random_column / grid_height) * 100}vh)`;
                        square.style.transition = `transform 0s`;
                    }, move_speed/4 * 1000);

                    // Step 3: come back on screen (left)
                    setTimeout(() => {
                        square.style.transform = `translate(${(i / grid_width) * 100}vw, ${(random_column / grid_height) * 100}vh)`;
                        square.style.transition = `transform ${move_speed/2}s ${edge_bezier}`;
                    }, (move_speed/2) * 1000);
                }
            } else {
                // Slide by one square to new position
                square.style.transition = `transform ${move_speed}s ${default_bezier}`;
                square.style.transform = `translate(${(i / grid_width) * 100}vw, ${(random_column / grid_height) * 100}vh)`;
            }
        }
    }

    timeoutId = setTimeout(do_animation, repeat_delay);
}

// on load
setupAnimation();

// on resize
window.addEventListener("resize", function() {
    // Remove all squares
    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    // let background_animation_div = document.getElementById("background-animation"); 
    while (background_animation_div.firstChild) {
        background_animation_div.removeChild(background_animation_div.firstChild);
    }  

    setupAnimation();
});

document.addEventListener("visibilitychange", function() {
    if (document.hidden) {
        is_animating = false;
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    } else {
        is_animating = true;
        setTimeout(do_animation, repeat_delay/2);
    }
});