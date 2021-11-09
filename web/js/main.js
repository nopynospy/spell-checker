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

// https://stackoverflow.com/questions/26551428/get-the-mouse-position-in-mousedown-and-mousemove-events
mouse.getPosition = function(element, evt) {
  var rect = element.getBoundingClientRect(),
    root = document.documentElement;
  this.position.x = evt.clientX - root.scrollLeft;
  this.position.y = evt.clientY + 20;
  return this.position;
}

let textarea = document.getElementById('input_box');

textarea.addEventListener("mousedown", function(e) {
  mouse.down = true;
  mouse.downedPos = mouse.getPosition(this, e);
  suggestArea.style.top = mouse.downedPos.y + "px";
  suggestArea.style.left = mouse.downedPos.x + "px";
  suggestArea.style.display = "block";
  eel.get_candidates()
});

textarea.addEventListener("scroll", function(e) {
  suggestArea.style.display = "none";
});

// https://stackoverflow.com/questions/5570390/resize-event-for-textarea
function outputsize() {
  suggestArea.style.display = "none";
 }
 outputsize()
 
 new MutationObserver(outputsize).observe(textarea, {
  attributes: true, attributeFilter: [ "style" ]
 })

const WORD_REGEX = /([^\s]+)/g

textarea.addEventListener('keydown', check_words);
textarea.addEventListener('keyup', check_words);
textarea.addEventListener('keydown', count_words);
textarea.addEventListener('keyup', count_words);

// This function is modified the codes from link below
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

function count_words() {
  let words_num = textarea.value.match(WORD_REGEX).length;
  updateInnerHTML("wordnum", words_num);
  return words_num
}

function updateInnerHTML(ele, text) {
  document.getElementById(ele).innerHTML = text;
}

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

function checkCursor(){
  console.log(textarea.selectionStart)
  // suggestArea.style.top = (textarea.selectionStart / textarea.rows) + "px";
  // suggestArea.style.left = ((textarea.selectionStart % textarea.rows)*20) + "px";
  // console.log(suggestArea.style.left)
  // suggestArea.style.display = "block";
  // eel.get_candidates()
};

document.getElementById("clearBtn").addEventListener("click", ()=>{
  textarea.value="";
  suggestArea.style.display = "none";
  updateInnerHTML("wordnum", 0);
});

function downloadTxt() {
  var link = document.createElement('a');
  link.href = 'data:text/plain;charset=UTF-8,' + escape(textarea.value);
  link.download = 'output.txt';
  link.click();
}

document.getElementById("txtBtn").addEventListener("click", downloadTxt);

eel.expose(return_candidates);
function return_candidates(candidates) {
  suggestArea.innerHTML = "";
  candidates.forEach(function(candidate) {
    let new_btn = document.createElement("button");
    new_btn.innerText = candidate["word"];
    new_btn.className = "suggestions";
    new_btn.onclick = function(){
      let val = textarea.value
      let new_cursor_pos = textarea.selectionStart + candidate["word"].length
      textarea.value = val.substr(0, textarea.selectionStart) + candidate["word"] +
                       val.substr(textarea.selectionStart);
      
      // textarea.setSelectionRange(new_cursor_pos, new_cursor_pos);
      textarea.selectionStart = new_cursor_pos;
      textarea.selectionEnd = new_cursor_pos;
      console.log("new", textarea.selectionStart)
    };
    suggestArea.appendChild(new_btn);
  });
}