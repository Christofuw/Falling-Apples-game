// Image variables
var bowlImg, rottenAppleImg, appleImg;

var score = 0;
var highScore = 0; 
var time = 0; 
var speed = 1; 
var startTime = 0; 
var xarray = []; 
var yarray = []; 
var bowlx = 200; 
var bowly = 430; // Shifted down relative to floor 
var word; 
var typearray = []; 
var gameState = 'START'; 
var gracePeriodOver = false; 
var chance = 0.2; 
var bowl_speed = 8;  
// Dash variables 
var canDash = true; 
var dashCooldown = 1000; // 1 second cooldown 
var lastDirection = 'right'; 
var dashOn = true; 
var dashStartTime = 0;  
var missedYellowCount = 0; 
var magnetActive = false; 
var magnetTimer = 0; 
var magnetRadiusX = 25; 
var magnetRadiusY = 15; 
// Shield converted to time-based variables
var shieldActive = false; 
var shieldTimer = 0; 
var slowActive = false; 
var slowTimer = 0; 
const MAGNET_COST = 30; 
const SHIELD_COST = 40; 
const SLOW_COST = 20; 
var spawnTimer; 
var speedTimer;  

function preload() {
  // loads images
  bowlImg = loadImage('bowl.png');
  rottenAppleImg = loadImage('rotten_apple.png');
  appleImg = loadImage('apple.png');
}

function setup() { 
  //creates the screen (Canvas height 600)
  createCanvas(400, 600); 
  imageMode(CENTER);
}  

function draw() { 
  // draws the background
  background('green');  
  // checks the game state, and displays it
  if (gameState === 'START') { 
    displayStartScreen(); 
    return; 
  }  
  
  if (gameState === 'GAMEOVER') { 
    displayGameOver(); 
    return; 
  }  
  // miscellaneous logic
  if (score > highScore) { 
    highScore = score; 
  }  
  
  if (score >= 10) { 
    gracePeriodOver = true; 
  }  
  
  if ((gracePeriodOver && score < 0) || missedYellowCount >= 3) { 
    triggerGameOver(); 
    return; 
  }  
  // run functions
  updatePowerUpTimers(); 
  drop(); 
  bowl();  
  
  // Floor (Y position 450)
  fill('black'); 
  noStroke(); 
  rectMode(CORNER);
  rect(0, 450, 400, 150);  
  
  info(); 
  drawPowerUpHUD();  
  
  // Draw Dash Bar only if dashOn is true 
  if (dashOn) { 
    drawDashBar(); 
  } 
}  

function displayStartScreen() { 
  // draws the start screen
  fill('black'); 
  rectMode(CORNER);
  rect(0, 0, width, height);  
  
  fill('gold'); 
  textSize(32); 
  textAlign(CENTER, CENTER); 
  text('CATCH THE BALLS', 200, 130);  
  
  fill('white'); 
  textSize(15); 
  text('• Catch GOLD balls (+1 pt)\n• Avoid BLACK balls (-3 pts)\n• Missing 3 GOLD balls in a row \n OR \n reaching 0 points = Game Over', 200, 230);  
  
  text('Controls:\n• Left/Right Arrows: Move\n• Shift: Dash\n• Keys Z, X, C: Power-ups', 200, 350);  
  
  // Start Button 
  fill('darkgreen'); 
  stroke('white'); 
  strokeWeight(2); 
  rect(125, 450, 150, 50, 10);  
  
  noStroke(); 
  fill('white'); 
  textSize(20); 
  text('START GAME', 200, 475); 
}  

function displayGameOver() { 
  // draws game over screen
  fill('black'); 
  rectMode(CORNER);
  rect(0, 0, width, height);  
  
  fill('red'); 
  textSize(36); 
  textAlign(CENTER, CENTER); 
  text('GAME OVER', 200, 150);  
  
  fill('white'); 
  textSize(18); 
  text('Highest Score: ' + highScore, 200, 220); 
  text('Final Time: ' + time + 's', 200, 260);  
  
  if (missedYellowCount >= 3) { 
    textSize(14); 
    fill('yellow'); 
    text('Missed 3 Apples in a Row!', 200, 300); 
  }  
  
  // Restart Button 
  fill('darkred'); 
  stroke('white'); 
  strokeWeight(2); 
  rect(125, 370, 150, 50, 10);  
  
  noStroke(); 
  fill('white'); 
  textSize(20); 
  text('RESTART (R)', 200, 395); 
}  

function startGame() { 
  // changes game state the playing and resets the variables
  resetGameVars(); 
  startTime = millis(); 
  gameState = 'PLAYING';  
  
  // Timers 
  clearInterval(speedTimer); 
  speedTimer = setInterval(increaseValue, 1000);  
  
  clearTimeout(spawnTimer); 
  spawnTimer = setTimeout(spawn, 2000 / speed); 
}  

function triggerGameOver() { 
  // changes game state to game over and clears timers
  gameState = 'GAMEOVER'; 
  clearInterval(speedTimer); 
  clearTimeout(spawnTimer); 
}  

function resetGameVars() { 
  // resets game variables
  score = 0; 
  time = 0; 
  speed = 1; 
  chance = 0.2; 
  xarray = []; 
  yarray = []; 
  typearray = []; 
  bowlx = 200; 
  bowly = 430; 
  gracePeriodOver = false; 
  missedYellowCount = 0; 
  magnetActive = false; 
  shieldActive = false; 
  slowActive = false; 
  canDash = true; 
}  

function info() { 
  // draws the HUD for information
  fill('WHITE'); 
  textSize(16); 
  time = parseInt((millis() - startTime) / 1000); 
  word = 'Score: ' + score +'  Time: ' + time + 's  Missed: ' + missedYellowCount + '/3'; 
  textAlign(CENTER); 
  text(word, 200, 475); 
}  

function drawPowerUpHUD() { 
  // draws the HUD for abilities
  textAlign(CENTER, CENTER); 
  textSize(11);  
  rectMode(CORNER);

  fill(score >= MAGNET_COST ? (magnetActive ? 'gold' : 'darkcyan') : 'gray'); 
  rect(10, 540, 115, 45, 5); 
  fill('white'); 
  text('[Z] Magnet (' + MAGNET_COST + 'p)', 67, 553); 
  text(magnetActive ? 'ACTIVE (' + ceil(magnetTimer / 60) + 's)' : 'Pickup Range +', 67, 570);  
  
  // Updated Shield HUD display for time-based behavior
  fill(score >= SHIELD_COST ? (shieldActive ? 'dodgerblue' : 'darkblue') : 'gray'); 
  rect(142, 540, 115, 45, 5); 
  fill('white'); 
  text('[X] Shield (' + SHIELD_COST + 'p)', 200, 553); 
  text(shieldActive ? 'ACTIVE (' + ceil(shieldTimer / 60) + 's)' : '10s Protection', 200, 570);  
  
  fill(score >= SLOW_COST ? (slowActive ? 'purple' : 'indigo') : 'gray'); 
  rect(275, 540, 115, 45, 5); 
  fill('white'); 
  text('[C] Slow (' + SLOW_COST + 'p)', 332, 553); 
  text(slowActive ? 'ACTIVE (' + ceil(slowTimer / 60) + 's)' : 'Slows Falling', 332, 570); 
}  

function drawDashBar() { 
  // create variables
  let barX = 100; 
  let barY = 500; 
  let barWidth = 200; 
  let barHeight = 15;  
  
  // Background Bar 
  fill(50); 
  stroke(255); 
  strokeWeight(1); 
  rectMode(CORNER);
  rect(barX, barY, barWidth, barHeight, 5);  
  
  // cooldown calculations
  let progress = 1; 
  if (!canDash) { 
    let elapsedTime = millis() - dashStartTime; 
    progress = constrain(elapsedTime / dashCooldown, 0, 1); 
  }  
  
  // Progress Fill 
  noStroke(); 
  if (canDash) { 
    fill('cyan'); 
  } else { 
    fill('orange'); 
  } 
  rect(barX + 2, barY + 2, (barWidth - 4) * progress, barHeight - 4, 3);  
  
  // Label Text 
  fill('white'); 
  textSize(10); 
  textAlign(CENTER, CENTER); 
  text(canDash ? 'DASH READY [SHIFT]' : 'DASH RECHARGING...', 200, barY + barHeight / 2); 
}  

function updatePowerUpTimers() { 
  // timers for abilities
  if (magnetActive) { 
    magnetTimer--; 
    magnetRadiusX = 65; 
    magnetRadiusY = 35; 
    if (magnetTimer <= 0) magnetActive = false; 
  } else { 
    magnetRadiusX = 25; 
    magnetRadiusY = 15; 
  }  
  
  // Decrement Shield Timer
  if (shieldActive) { 
    shieldTimer--; 
    if (shieldTimer <= 0) shieldActive = false; 
  } 

  if (slowActive) { 
    slowTimer--; 
    if (slowTimer <= 0) slowActive = false; 
  } 
}  

function spawn() { 
  // spawns the apples
  if (gameState !== 'PLAYING') return;  
  
  yarray.push(0); 
  xarray.push(random(30, 370));  
  
  if (random(1) < chance) { 
    typearray.push('bad'); 
  } else { 
    typearray.push('good'); 
  }  
  
  let currentSpeed = (speed && speed > 0) ? speed : 1; 
  spawnTimer = setTimeout(spawn, 1000 / currentSpeed); 
}  

function drop() { 
  // moves the apples down
  let effectiveSpeed = slowActive ? speed * 0.5 : speed;  
  
  for (let i = xarray.length - 1; i >= 0; i--) { 
    let isYellow = typearray[i] === 'good';  
    
    // Replace circle with sprite image
    if (!isYellow) { 
      image(rottenAppleImg, xarray[i], yarray[i], 25, 25); 
    } else { 
      image(appleImg, xarray[i], yarray[i], 25, 25); 
    }  
    
    yarray[i] += effectiveSpeed;  
    // increase hitbox if magnet on and its an apple
    let currentRadiusX = (isYellow && magnetActive) ? magnetRadiusX : 25; 
    let currentRadiusY = (isYellow && magnetActive) ? magnetRadiusY : 15;  
    // check collisions
    if (abs(xarray[i] - bowlx) < currentRadiusX && abs(yarray[i] - bowly) < currentRadiusY) { 
      if (!isYellow) { 
        // Shield absorbs hits while active without losing timer duration prematurely
        if (!shieldActive) { 
          score -= 3; 
        } 
      } else { 
        score += 1; 
        missedYellowCount = 0; 
      }  
      
      xarray.splice(i, 1); 
      yarray.splice(i, 1); 
      typearray.splice(i, 1); 
      continue; 
    }  
    
    if (yarray[i] > 450) { 
      if (isYellow) { 
        missedYellowCount += 1; 
      }  
      
      xarray.splice(i, 1); 
      yarray.splice(i, 1); 
      typearray.splice(i, 1); 
    } 
  } 
}  

function bowl() { 
  // moving the bowl
  if (keyIsDown(LEFT_ARROW)) { 
    if (bowlx >= 30) bowlx -= bowl_speed; 
    lastDirection = 'left'; 
  } else if (keyIsDown(RIGHT_ARROW)) { 
    if (bowlx <= 370) bowlx += bowl_speed; 
    lastDirection = 'right'; 
  }  
  // draws the bubble while shield is active
  if (shieldActive) { 
    noFill(); 
    stroke('cyan'); 
    strokeWeight(3); 
    ellipse(bowlx, bowly - 5, 70, 45); 
  }  
  
  // Replace manual ellipses with bowl sprite
  image(bowlImg, bowlx, bowly, 50, 30);
}  

function buyMagnet() { 
  // magnet ability
  if (score >= MAGNET_COST) { 
    score -= MAGNET_COST; 
    magnetActive = true; 
    magnetTimer = 8 * 60; 
  } 
}  

function buyShield() { 
  // updated shield ability to set timer (10 seconds at 60 FPS = 600 frames)
  if (score >= SHIELD_COST) { 
    score -= SHIELD_COST; 
    shieldActive = true; 
    shieldTimer = 10 * 60; 
    missedYellowCount = 0; 
  } 
}  

function buySlow() { 
  // slow ability
  if (score >= SLOW_COST) { 
    score -= SLOW_COST; 
    slowActive = true; 
    slowTimer = 4 * 60; 
  } 
}  

function keyPressed() { 
  // check keys for abilities and restart
  if (gameState === 'GAMEOVER' && (key === 'r' || key === 'R')) { 
    startGame(); 
    return; 
  }  
  
  if (gameState === 'PLAYING') { 
    if (key === 'z' || key === 'Z') buyMagnet(); 
    if (key === 'x' || key === 'X') buyShield(); 
    if (key === 'c' || key === 'C') buySlow();  
    
    if (dashOn) { 
      if ((keyCode === SHIFT || key === 'Shift') && canDash) { 
        let dashDistance = 80;  
        if (lastDirection === 'left') bowlx -= dashDistance; 
        else if (lastDirection === 'right') bowlx += dashDistance;  
        
        startDashCooldown(); 
      } 
    } 
    bowlx = constrain(bowlx, 30, 370); 
  } 
}  

function mousePressed() { 
  // check mouse clicks for restart and abilities
  if (gameState === 'START') { 
    if (mouseX >= 125 && mouseX <= 275 && mouseY >= 450 && mouseY <= 500) { 
      startGame(); 
    } 
  } else if (gameState === 'GAMEOVER') { 
    if (mouseX >= 125 && mouseX <= 275 && mouseY >= 370 && mouseY <= 420) { 
      startGame(); 
    } 
  } else if (gameState === 'PLAYING') { 
    if (mouseY >= 540 && mouseY <= 585) { 
      // mouse clicks for abilities
      if (mouseX >= 10 && mouseX <= 125) buyMagnet(); 
      if (mouseX >= 142 && mouseX <= 257) buyShield(); 
      if (mouseX >= 275 && mouseX <= 390) buySlow(); 
    } 
  } 
}  

function startDashCooldown() { 
  // starts the dash cooldown
  canDash = false; 
  dashStartTime = millis(); 
  setTimeout(() => { 
    canDash = true; 
  }, dashCooldown); 
}  

function increaseValue() { 
  // increases the speed and chance of bad apples over time 
  if (gameState === 'PLAYING') { 
    speed += 0.1; 
    chance += 0.01; 
    if (chance > 0.9) chance = 0.9; 
  } 
  // makes sure score doesn't go below 0
  if (score < 0) score = 0; 
}