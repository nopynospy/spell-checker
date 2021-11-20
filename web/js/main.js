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
    suggestArea1.style.top =( mouse.downedPos.y - 150) + "px";
    suggestArea1.style.left = (mouse.downedPos.x - 260 )+ "px";
    suggestArea1.style.opacity = 1;
    suggestArea2.style.opacity = 0;
  }
});

// Set the width of editor and suggestion container to not overlap with corpus area
editorContainer.style.width = rightBodyWidth + "px"
suggestContainer.style.width = rightBodyWidth + "px"

// When text cursor in text editor change
quill.on('editor-change', function(eventName, range, oldRange) {
  if (eventName === 'selection-change') {
    isEditing = false;
    suggestArea1.style.opacity = 0;
    suggestArea2.style.opacity = 1;
    eel.get_candidates();
      if (range) {
        // If only one character selected
          if (range.length == 0) {
            isEditing = true;
            console.log('User cursor is on', range.index);
            let cursor_minus = quill.getText(range.index-1, range.index);
            console.log("SELECTION", cursor_minus);
            if (cursor_minus === null || !cursor_minus.replace(/\s/g, '').length) {
              console.log("suggest next word");
              isWordSelected = false;
            } else {
              console.log("check word");
              isWordSelected = true;
            }
            count_words(quill.getText());
            let newestText = quill.getText(0, range.index).replace(/(?:\r\n|\r|\n)/g, '<br>&emsp;');
            editorMirror.innerHTML = newestText
            let rect = suggestArea1.getBoundingClientRect();
            // console.log("RECT", rect)
            if (rect.right > document.body.clientWidth) {
              newestText = newestText.substring(0, newestText.length - 20);
              editorMirror.innerHTML = newestText
            }
          } else { // if more than one character selected
            var text = quill.getText(range.index, range.length);
            console.log('User has highlighted', text);
          }
        } else { // if user select area outside of text editor
          console.log('Cursor not in the editor');
        }
  }
});

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
  updateInnerText("editorMirror", "")
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
  console.log(candidates)
  suggestArea1.innerHTML = "";
  suggestArea2.innerHTML = "";
  candidates.forEach(function(candidate) {
    let new_btn = document.createElement("button");
    new_btn.innerText = candidate["word"];
    new_btn.className = "suggestions";
    // new_btn.onclick = function(){
    //   let val = textarea.value
    //   let head = val.slice(0, textarea.selectionStart);
    //   let new_cursor_pos = head.length + candidate["word"].length + 1
    //   textarea.value = head + candidate["word"] + " " + val.slice(textarea.selectionStart);
    //   textarea.setSelectionRange(new_cursor_pos, new_cursor_pos);
    //   textarea.focus();
    //   count_words()
    // };
    suggestArea1.appendChild(new_btn);
    suggestArea2.appendChild(new_btn);
  });
}

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