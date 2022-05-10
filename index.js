NUMGUESSES = 6; //Row count
NUMLETTERS = 5; //Letter (column) count

//The current letter the user is guessing.
var guessRow = 0;
var guessCol = 0;

//The correct word, and game over variable.
var correctWord = "";
var gameOver = false;

//We already fetched acceptedWords[] and correctWords[] from words.js.
//First, add the correctWords into the accepted word list.
acceptedWords.push(...correctWords)

//Function to display a toast notification.
//When the user fails the puzzle, a toast indicating the correct answer
//is continuously displayed and no other toasts are shown.
var toastingWrongAnswer = false;
function toast(m)
{
    if (toastingWrongAnswer)
        return;
    
    //Fetch toast element and update its text
    var x = document.getElementById("toast");
    x.innerText = m;

    //Show toast
    x.classList.add("show");

    //If failure message, show without timeout, otherwise with
    if (m.includes("Sorry, you failed"))
        toastingWrongAnswer = true;
    if (!toastingWrongAnswer)
        setTimeout(function(){ x.classList = ""; }, 3000);  
}

//Initialization function (to be ran when page loads).
window.onload = function()
{
    //Create the gameboard.
    for (let i = 0; i < NUMGUESSES; i++)
    {
        for (let j = 0; j < NUMLETTERS; j++)
        {
            var tile = document.createElement("span");
            tile.classList.add("tile");
            tile.id = i + "-" + j;
            tile.innerText = "";

            document.getElementById("guessboard").appendChild(tile);
        }
    }

    //Create the keyboard.
    let keyboard = [["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Enter", "Z", "X", "C", "V", "B", "N", "M", "⌫", "Reset"]]

    for (var kRow of keyboard)
    {
        //Add element with the keyboard row.
        let keyboardRow = document.createElement("div");
        keyboardRow.classList.add("keyboardRow");

        //Add each key in the row.
        for (var key of kRow)
        {
            let tile = document.createElement("div");
            tile.innerText = key;

            //Add appropriate ID and class.
            if (key == "Enter")
            {
                tile.classList.add("enterKey")
                tile.id = "ENTER";
            }
            else if (key == "⌫")
            {
                tile.classList.add("keyboardKey")
                tile.id = "BACKSPACE";
            }
            else if (key == "Reset")
            {
                tile.classList.add("resetKey");
                tile.id = "RESET";
            }
            else
            {
                tile.classList.add("keyboardKey")
                tile.id = key;
            }

            //Add event listener that uses the event ID properly.
            tile.addEventListener("click", function() {processInput(this.id);});
            keyboardRow.appendChild(tile);
        }

        //Finally, add the constructed keyboard row.
        document.getElementById("keyboard").appendChild(keyboardRow);
    }

    //Listen for key press.
    document.addEventListener("keydown", (e) => {if (!e.repeat) processInput(e.key.toUpperCase())});

    //Function to load puzzle. This is its own
    //function so the reset feature can also call it.
    loadPuzzle();
}

//This function is run when the page is loaded,
//or when the reset button is clicked. Loads a
//new puzzle.
function loadPuzzle()
{
    //(Re-)iniitalize global variables.
    guessRow = 0;
    guessCol = 0;
    gameOver = false;

    //Fetch a new word. Randomly select a word from the correct word list.
    correctWord = correctWords[Math.floor(Math.random()*correctWords.length)];
    correctWord = correctWord.toUpperCase();
    console.log(correctWord); //This can be commented out when debugging/testing.

    //Remove all guess letters from the tiles.
    document.querySelectorAll(".tile").forEach(e => { e.innerText = "" });

    //Now, remove all hint colors from the tiles and keyboard kes.
    ["green", "gray", "yellow"].forEach(color => {
    document.querySelectorAll("." + color).forEach(e =>
    e.classList.remove(color))});

    //Close the toast message in case it is being shown perpetually.
    if (toastingWrongAnswer)
    {
        toastingWrongAnswer = false;
        document.getElementById("toast").classList = "";
    }
}

//Function ran when key is pressed, or on-screen key is clicked.
function processInput(key)
{
    //If resetting, ask for confirmation.
    if (key == "RESET")
    {
        if (confirm("Would you like to reset the puzzle and obtain a new word?"))
            loadPuzzle();
        return;
    }

    //Do nothing if the game has ended.
    if (gameOver)
        return;
    
    //Check if the key is alphabetical (and we haven't filled in the last letter).
    if (key.match(/^[A-Z]{1}$/) && guessCol < NUMLETTERS)
    {
        //Update the letter's text to match the input.
        document.getElementById(guessRow + "-" + guessCol).innerText = key;
        guessCol += 1;
    }

    //Check if the key is a backspace (and we are not on the first letter).
    else if (key == "BACKSPACE" && 0 < guessCol)
    {
        //Remove the text and go back one column.
        guessCol -= 1;
        document.getElementById(guessRow + "-" + guessCol).innerText = "";
    }

    //Check if the key is the enter key.
    else if (key == "ENTER")
    {
        //If all letters are filled in, process the guess.
        if (guessCol == NUMLETTERS)
            processGuess();

        //Otherwise, inform the user they haven't entered all letters.
        else
            toast("You must enter a 5-letter word.");
    }

    //Stop accepting key input when game over.
    if (!gameOver && guessRow == NUMGUESSES)
    {
        gameOver = true;
        toast("Sorry, you failed. The correct answer was " + correctWord +".");
    }
}

//Function to process a guess once one is amade.
function processGuess()
{
    //First, string up the guess.
    guess = "";
    for (let c = 0; c < NUMLETTERS; c++)
        guess += document.getElementById(guessRow + "-" + c).innerText;
    guess = guess.toLowerCase();
    
    //If the word is not in the accepted list, return.
    if (!(acceptedWords.includes(guess)))
    {
        toast("Hmmm, that doesn't seem like a valid word.");
        return;
    }

    //There is a case to be aware of; if the word is "MARKS",
    //and the user enters "MMMMM", we don't want the last 4
    //tiles to be yellow. To avoid this, we use a dict.
    letterCount = {}
    for (var letter of correctWord)
    {
        if (letter in letterCount)
            letterCount[letter] += 1;
        else
            letterCount[letter] = 1;
    }    

    //Now, we want to iterate twice. First, to check for all the correct letters.
    correctCount = 0;
    for (let c = 0; c < NUMLETTERS; c++)
    {
        let tile = document.getElementById(guessRow + "-" + c);
        let letter = tile.innerText;

        //The letter is correct.
        if (correctWord[c] == letter)
        {
            //Mark the tile and corresponding key tile as green.
            tile.classList.add("green");

            keyTile = document.getElementById(letter);
            keyTile.classList.remove("yellow"); //In case it was previously yellow
            keyTile.classList.add("green");

            correctCount += 1;
            letterCount[letter] -= 1;
        }

        //The entire word is correct.
        if (correctCount == NUMLETTERS)
        {
            toast("Good job, you got it!");
            gameOver = true;
        }
    }

    //Now, iterate again, to check incorrect position.
    for (let c = 0; c < NUMLETTERS; c++)
    {
        let tile = document.getElementById(guessRow + "-" + c);
        let letter = tile.innerText;

        //Skip tiles already marked as correct.
        if (tile.classList.contains("green"))
            continue;
        
        //Mark tiles yellow.
        if (correctWord.includes(letter) && letterCount[letter] > 0)
        {
            tile.classList.add("yellow")
            keyTile = document.getElementById(letter);
            if(!(keyTile.classList.contains("green")))
                keyTile.classList.add("yellow");
            letterCount[letter] -= 1;
        }
        //If the letter is not in the word, or, if the letter is in
        //the word but all the instances of it are already marked green/yellow,
        //then mark this tile as gray.
        else
        {
            tile.classList.add("gray");
            keyTile = document.getElementById(letter);
            keyTile.classList.add("gray");
        }
    }

    //Change to next guess row.
    guessRow += 1;
    guessCol = 0;
}