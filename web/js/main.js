// Declare variables
let suggestArea = document.getElementById('suggestArea');

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

// Function that gets mouse click coordinates on webpage
// https://stackoverflow.com/questions/26551428/get-the-mouse-position-in-mousedown-and-mousemove-events
mouse.getPosition = function(element, evt) {
  var rect = element.getBoundingClientRect(),
    root = document.documentElement;
  this.position.x = evt.clientX - root.scrollLeft;
  this.position.y = evt.clientY;
  return this.position;
}

let textarea = document.getElementById('textArea');

// When user clicks on textarea
textarea.addEventListener("mousedown", function(e) {
  mouse.down = true;
  // Mouse coordinates are obtained
  mouse.downedPos = mouse.getPosition(this, e);
  // If they pasted text that contains line break, automatically convert to html break element
  let currentText = textarea.value.replace(/(?:\r\n|\r|\n)/g, '<br>');;
  // Under the hood, an HTML span elements is hidden under the textarea and it has the exact same text as the textarea
  textareaMirrorInline.innerHTML = currentText;
  // If they click within the hidden span area, show the text suggestion UI at their moust coordinates
  // Because clicking textarea on anywhere will toggle, so a text span area is hidden,
  // so that user can only click until text that are already typed
  // This also ensures the the text suggestion UI does not appear too far away from user cursor
  let rect = textareaMirrorInline.getBoundingClientRect();
  if (mouse.downedPos.y > rect.top
    && mouse.downedPos.y < rect.bottom
    && mouse.downedPos.x > rect.left
    && mouse.downedPos.x < rect.right) {
      suggestArea.style.top = mouse.downedPos.y + "px";
      suggestArea.style.left = mouse.downedPos.x + "px";
      suggestArea.style.display = "block";
      eel.get_candidates()
    }
    // Otherwise hide the suggestion UI
    else {
      suggestArea.style.display = "none";
    }
});

// When the user scrolls in the textarea, hide the suggestion UI
textarea.addEventListener("scroll", function(e) {
  suggestArea.style.display = "none";
});

// Create a word counter, starting with a regex
const WORD_REGEX = /([^\s]+)/g

textarea.addEventListener('keydown', check_words);
textarea.addEventListener('keyup', check_words);
textarea.addEventListener('keydown', count_words);
textarea.addEventListener('keyup', count_words);

// This word counting function is modified the codes from link below
// https://stackoverflow.com/questions/16949373/javascript-textarea-word-limit
function check_words(e) {
  let BACKSPACE  = 8;
  let DELETE     = 46;
  let MAX_WORDS  = 500;
  let valid_keys = [BACKSPACE, DELETE];
  let words      = textarea.value.match(WORD_REGEX);
  let words_num = count_words()

  if (words_num >= MAX_WORDS && valid_keys.indexOf(e.keyCode) == -1) {
      e.preventDefault();
      words.length = MAX_WORDS;
      this.value = words.join(' ');
  }
}

// Update the UI to show new word count
function count_words() {
  let words_num = textarea.value.match(WORD_REGEX).length;
  updateInnerHTML("wordnum", words_num);
  return words_num
}

// Helper function that updates a UI element based on text given
function updateInnerHTML(ele, text) {
  document.getElementById(ele).innerHTML = text;
}

// Detect any user event in the textarea
// https://stackoverflow.com/questions/53999384/javascript-execute-when-textarea-caret-is-moved
textarea.addEventListener('keypress', checkCursor); // Every character written
textarea.addEventListener('mousedown', checkCursor); // Click down
textarea.addEventListener('touchstart', checkCursor); // Mobile
textarea.addEventListener('input', checkCursor); // Other input events
textarea.addEventListener('paste', checkCursor); // Clipboard actions
textarea.addEventListener('cut', checkCursor);
textarea.addEventListener('mousemove', checkCursor); // Selection, dragging text
textarea.addEventListener('select', checkCursor); // Some browsers support this event
textarea.addEventListener('selectstart', checkCursor); // Some browsers support this event

// Hide the span behind the textarea
let textareaMirror = document.getElementById('textAreaMirror');
let textareaMirrorInline = document.getElementById('textareaMirrorInline');

textareaMirror.style.width = textarea.clientWidth + "px";
textareaMirror.style.height = textarea.clientHeight + "px";
textareaMirror.style.position = "absolute";
textareaMirror.style.top = 0;
textareaMirror.style.left = 0;
textareaMirror.style.textAlign = "left";
textareaMirror.style.overflowY = "hidden";
textareaMirror.style.background = "transparent";
textareaMirror.style.margin = 0;

function checkCursor(){
  let currentText = textarea.value.replace(/(?:\r\n|\r|\n)/g, '<br>');;
  textareaMirrorInline.innerHTML = currentText;
};

// Allow user to clear textarea text with the clear button
document.getElementById("clearBtn").addEventListener("click", ()=>{
  textarea.value="";
  suggestArea.style.display = "none";
  updateInnerHTML("wordnum", 0);
});

// Allow user to download textarea text as a .txt file using the download button
function downloadTxt() {
  var link = document.createElement('a');
  link.href = 'data:text/plain;charset=UTF-8,' + escape(textarea.value);
  link.download = 'output.txt';
  link.click();
}

document.getElementById("txtBtn").addEventListener("click", downloadTxt);

// Connect to the python functions stored in app.py
eel.expose(return_candidates);
function return_candidates(candidates) {
  suggestArea.innerHTML = "";
  candidates.forEach(function(candidate) {
    let new_btn = document.createElement("button");
    new_btn.innerText = candidate["word"];
    new_btn.className = "suggestions";
    new_btn.onclick = function(){
      let val = textarea.value
      let head = val.slice(0, textarea.selectionStart);
      let new_cursor_pos = head.length + candidate["word"].length + 1
      textarea.value = head + candidate["word"] + " " + val.slice(textarea.selectionStart);
      textarea.setSelectionRange(new_cursor_pos, new_cursor_pos);
      textarea.focus();
      count_words()
    };
    suggestArea.appendChild(new_btn);
  });
}