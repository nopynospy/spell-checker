// Initiate quill js
var BackgroundClass = Quill.import('attributors/class/background');
var ColorClass = Quill.import('attributors/class/color');
var SizeStyle = Quill.import('attributors/style/size');
Quill.register(BackgroundClass, true);
Quill.register(ColorClass, true);
Quill.register(SizeStyle, true);

// Remove text editing toolbar, specify editor-container for quill js
var quill = new Quill('#editor-container', {
  modules: {
    toolbar: false
  },
  formats: [],
  placeholder: 'Compose an epic...',
  theme: 'snow'
});
quill.root.setAttribute("spellcheck", "false")

// Initiate variables and constants
let editorContainer = document.getElementById('editor-container');
let suggestContainer = document.getElementById("suggestContainer");
let editorMirror = document.getElementById("editorMirror");
let suggestArea1 = document.getElementById("suggestArea1");
let suggestArea2 = document.getElementById("suggestArea2");
let dictionaryList = document.getElementById('dictionaryList');
const MAX_WORDS  = 500;
const WORD_REGEX = /([^\s]+)/g

const rightBodyWidth = document.body.clientWidth - 310

let isEditing = false;
let isWordSelected = false;

let selectionIndex = 0;
let string_selected

// Function that gets mouse click coordinates on webpage
// https://stackoverflow.com/questions/26551428/get-the-mouse-position-in-mousedown-and-mousemove-events
let mouse = {
  position: {
    x: 0,
    y: 0
  },
  down: false,
  downedPos: {
    x: 0,
    y: 0
  },
}
mouse.getPosition = function(element, evt) {
  var rect = element.getBoundingClientRect(),
    root = document.documentElement;
  this.position.x = evt.pageX - root.scrollLeft;
  this.position.y = evt.pageY;
  return this.position;
}

// When the user clicks text edit area, get the mouse click position to show suggestion area
editorContainer.addEventListener("click", function(e) {
  mouse.downedPos = mouse.getPosition(this, e);
  if (isEditing && (quill.getLength() > 1)) {
    suggestArea2.style.top =( mouse.downedPos.y - 150) + "px";
    suggestArea2.style.left = (mouse.downedPos.x - 260 )+ "px";
    suggestArea2.style.opacity = 1;
    suggestArea1.style.opacity = 0;
  }
});

// Set the width of editor and suggestion container to not overlap with corpus area
editorContainer.style.width = rightBodyWidth + "px"
suggestContainer.style.width = rightBodyWidth + "px"

// When text cursor in text editor change
quill.on('editor-change', function(eventName, range, oldRange) {
  if (eventName === 'selection-change') {
    isEditing = false;
    suggestArea2.style.opacity = 0;
    suggestArea1.style.opacity = 1;

    eel.get_candidates();
      if (range) {
        // If only one character selected
          if (range.length == 0) {
            isEditing = true;
            console.log('User cursor is on', range.index);
            selectionIndex = range.index
            string_selected = quill.getText(selectionIndex-1);
            string_selected = string_selected.charAt(0)
            console.log("SELECTION", string_selected);
            if (checkIfSpace(string_selected)) {
              console.log("suggest next word");
              isWordSelected = false;
            } else {
              console.log("check word");
              isWordSelected = true;
            }
            count_words(quill.getText());
            // Insert the line break element to simulate new lines in mirror
            // let newestText = quill.getText(0, selectionIndex).replace(/(?:\r\n|\r|\n)/g, '<br>&emsp;');
            updateMirror();
            let rect = suggestArea1.getBoundingClientRect();
            // console.log("RECT", rect)
            if (rect.right > document.body.clientWidth) {
              newestText = newestText.substring(0, newestText.length - 20);
              updateMirror();
            }
          } else { // if more than one character selected
            var text = quill.getText(selectionIndex, range.length);
            console.log('User has highlighted', text);
          }
        } else { // if user select area outside of text editor
          console.log('Cursor not in the editor');
        }
  }
});

// Helper function that synchs user input text with mirror
function updateMirror() {
  editorMirror.innerHTML = quill.root.innerHTML;
  quill.focus();
}

// Helper function to check if a string is space or line break
function checkIfSpace(text) {
  return text === null || !text.replace(/\s/g, '').length
}

// Update the UI to show new word count
function count_words(text) {
  let words_num = text.match(WORD_REGEX).length;
  updateInnerText("wordnum", words_num);
  if (words_num > MAX_WORDS) {
    let words = quill.getText().match(WORD_REGEX).slice(0, MAX_WORDS);
    quill.setText(words.join(' '));
  }
  return words_num
}

// Helper function that updates a UI element based on text given
function updateInnerText(ele, text) {
  document.getElementById(ele).innerText = text;
}

// Allow user to clear textarea text with the clear button
document.getElementById("clearBtn").addEventListener("click", ()=>{
  updateInnerText("wordnum", 0);
  updateMirror();
  quill.setText('');
});

// Allow user to download textarea text as a .txt file using the download button
document.getElementById("txtBtn").addEventListener("click", ()=>{
  var link = document.createElement('a');
  link.href = 'data:text/plain;charset=UTF-8,' + escape(quill.getText());
  link.download = 'output.txt';
  link.click();
});

// // Connect to the python functions stored in app.py
eel.expose(return_candidates);
function return_candidates(candidates) {
  suggestArea1.textContent = "";
  suggestArea2.textContent = "";
  candidates.forEach(function(candidate) {
    let new_btn = document.createElement("button");
    new_btn.innerText = candidate["word"];
    new_btn.className = "suggestions";
    new_btn.onclick = function(){
      if (isWordSelected) { // if user selected a non-space character and clicked the button, replace word
        let leftBound = getLeftWordBound().length;
        let rightBound = getRightWordBound().length;
        quill.deleteText(selectionIndex-leftBound, leftBound + rightBound);
        quill.insertText(selectionIndex, this.innerText);
      } else { // if user selected a space character and clicked the button, insert word
        quill.insertText(selectionIndex, this.innerText);
      }
      updateMirror();
      count_words(quill.getText());
    };
    new_btn_copy = new_btn.cloneNode(true);
    new_btn_copy.onclick = function(){
      if (isWordSelected) { // if user selected a non-space character and clicked the button, replace word
        let leftBound = getLeftWordBound().length;
        let rightBound = getRightWordBound().length;
        quill.deleteText(selectionIndex-leftBound, leftBound + rightBound);
        quill.insertText(selectionIndex, this.innerText);
      } else { // if user selected a space character and clicked the button, insert word
        quill.insertText(selectionIndex, this.innerText);
      }
      updateMirror();
      count_words(quill.getText());
    };
    suggestArea2.appendChild(new_btn_copy);
    suggestArea1.appendChild(new_btn);
  });
}

// Get the left boundary of a word selected by cursor. Boundary is determined by the last space.
function getLeftWordBound() {
  let isContinue = true;
  let currentChar = "";
  let newIndex = selectionIndex;
  let leftBound = ""
  if (quill.getText(0, newIndex).includes(" ")) {
    while (isContinue) {
      newIndex--;
      if (checkIfSpace(quill.getText(newIndex).charAt(0))) {
        isContinue = false;
      } else {
        currentChar = quill.getText(newIndex).charAt(0)
        leftBound = currentChar + leftBound
      }
    }
    return leftBound
  }
  return quill.getText(0, newIndex)
}

// Get the right boundary of a word selected by cursor. Boundary is determined by the next space.
function getRightWordBound() {
  if (quill.getText(selectionIndex).split(/\s+/g).length > 0) {
    return quill.getText(selectionIndex).split(/\s+/g)[0];
  }
  return quill.getText(selectionIndex);
}

// Return all words from corpus
eel.expose(return_all_words);
function return_all_words(words) {
  dictionaryList.innerHTML = "";
  words.forEach(function(word) {
    let new_li= document.createElement("li");
    new_li.innerText = word;
    new_li.className = "";
    dictionaryList.appendChild(new_li);
  });
}

eel.get_all_words()