// Initiate quill js
var BackgroundClass = Quill.import('attributors/class/background');
var ColorClass = Quill.import('attributors/class/color');
var SizeStyle = Quill.import('attributors/style/size');
var Base = Quill.import('blots/embed');
Quill.register(BackgroundClass, true);
Quill.register(ColorClass, true);
Quill.register(SizeStyle, true);

class MentionBlot extends Base {

  static create(data) {
    const node = super.create(data.name);
    node.innerHTML = data.name;
    node.setAttribute('spellcheck', "false");
    node.setAttribute('autocomplete', "off");
    node.setAttribute('autocorrect', "off");
    node.setAttribute('autocapitalize', "off");

    // store data
    node.setAttribute('data-name', data.name);
    node.setAttribute('data-id', data.id);
    node.setAttribute('id', data.uuid);
    node.setAttribute('data-start', data.start);
    return node;
  }

  static value(domNode) {
    const { name, id, uuid, start } = domNode.dataset;
    return { name, id, uuid, start };
  }

  constructor(domNode, value) {
    super(domNode);
    this._data = value;
    this._removedBlot = false;
  }

  // eslint-disable-next-line no-unused-vars
  index(node, offset) {
    // See leaf definition as reference:
    // https://github.com/quilljs/parchment/blob/master/src/blot/abstract/leaf.ts
    // NOTE: sometimes `node` contains the actual dom node and sometimes just
    // the text
    return 1;
  }

  /**
   * Replace the current Mention Blot with the given text.
   *
   * @param { String } text the text to replace the mention with.
   */
  _replaceBlotWithText(text) {
    // The steps to replace the Blot with its text must be in this order:
    // 1. insert text - source:API
    //    using API we won't react to changes
    // 2. set selection - source:API
    //    set the cursor position in place
    // 3. remove blot - source:USER
    //    using USER we react to the text-change event and it "looks" like we
    //    did a blot->text replacement in one step.
    //
    // If we don't do these actions in the specified order, the text update and
    // the cursor position won't be as it should for the autocompletion list.

    if (this._removedBlot) return;
    this._removedBlot = true;

    const cursorPosition = quill.getSelection().index;
    const blotCursorPosition = quill.selection.getNativeRange().end.offset;
    const realPosition = cursorPosition + blotCursorPosition;

    quill.insertText(cursorPosition - 1, text, Quill.sources.API);
    quill.setSelection(realPosition - 1, Quill.sources.API);
    quill.deleteText(cursorPosition + text.length - 1, 1, Quill.sources.USER);

    // We use API+USER to be able to hook just USER from the outside and the
    // content edit will look like is done in "one action".
  }

  changeText(oldText, newText) {
    const name = this._data.name;

    const valid = (oldText == name) && (newText != oldText);
    if (!valid) return;

    let cursorPosition = quill.getSelection().index;
    if (cursorPosition == -1) {
      // This case was found just a couple of times and it may not appear again
      // due to improvements made on the MentionBlot. I'm leaving the fix here
      // in case that happens again to debug it.
      cursorPosition = 1;
      console.warning("[changeText] cursorPosition was -1 ... changed to 1");
    }

    const blotCursorPosition = quill.selection.getNativeRange().end.offset;
    let realPosition = cursorPosition;

    if (!this._removedBlot) {
      realPosition += blotCursorPosition;
    } else {
      // Right after the blot is removed we may need to handle a Mutation.
      // If that's the case, considering that the length of the text is 1 would
      // be wrong since it no longer is an Embed but a text.
      console.warning("[changeText] removedBlot is set!");
    }

    if (newText.startsWith(name) && oldText == name) { // append
      // An append happens as follows:
      // Text: <@Name|> -> <@NameX|>
      // We need to move the inserted letter X outside the blot.
      const extra = newText.substr(name.length);

      this.domNode.innerHTML = name;

      // append the text outside the blot
      quill.insertText(cursorPosition, extra, Quill.sources.USER);
      quill.setSelection(cursorPosition + extra.length, Quill.sources.API);
      // quill.insertText(cursorPosition + 2, extra, Quill.sources.USER);
      // quill.setSelection(cursorPosition + extra.length + 3, Quill.sources.API);

      return;
    } else if (newText.endsWith(name) && oldText == name) { // prepend
      // A prepend may be handled in two different ways depending on the
      // browser and the text/cursor state.
      //
      // Case A: (not a problem)
      // Text: |<@Name> -> X|<@Name>
      // Case B: (problem)
      // Text: <|@Name> -> <X|@Name>
      //
      // If we reach this point, it means that we need to tackle Case B.
      // We need to move the inserted letter X outside the blot.
      const end = newText.length - name.length;
      const extra = newText.substr(0, end);

      // The cursor position is set right after the inserted character.
      // In some cases the cursor position gets updated before the text-edit
      // event is emited and in some cases afterwards.
      // This difference manifests itself when the Blot is at the beginning and
      // this conditional assignment handles the issue.
      const pos = cursorPosition > 0 ? cursorPosition - 1 : cursorPosition;

      this.domNode.innerHTML = name;

      // append the text outside the blot
      quill.insertText(pos, extra, Quill.sources.USER);
      quill.setSelection(pos + extra.length, Quill.sources.API);

      return;
    }
    // no append, no prepend, text has changed in a different way.

    // We need to trigger these changes right after the update callback
    // finishes, otherwise errors may appear due to ranges not updating
    // correctly.
    // See: https://github.com/quilljs/quill/issues/1134
    setTimeout(() => this._replaceBlotWithText(newText), 0)
  }

  update(mutations) {
    // See as reference:
    // https://github.com/quilljs/quill/blob/develop/blots/cursor.js

    mutations
      .filter(mutation => mutation.type == 'characterData')
      .forEach(m => {
        const oldText = m.oldValue;
        const newText = m.target.data;
        this.changeText(oldText, newText);
      });

    // I'm not sure whether this is needed or not, keeping it just in case.
    super.update(mutations.filter(mutation => mutation.type != 'characterData'));
  }

}

MentionBlot.blotName = 'mention';
MentionBlot.className = 'quill-mention';
MentionBlot.tagName = 'button';
// MentionBlot.onclick = console.log("CLICK MENTION");

/* } end of MentionBlot definition, mention.js */

Quill.register({
  'formats/mention': MentionBlot
});

const insertMention = (data, position) => {

  quill.insertEmbed(position, 'mention', data, Quill.sources.API);
  quill.insertText(position + 1, ' ', Quill.sources.API);
  quill.setSelection(position + 2, Quill.sources.API);
}

const addMention = (text, suggestions, uuid, position) => {
  const data = {
    name: text,
    id: suggestions,
    uuid: uuid,
    start: position
  };
  
  insertMention(data, position);
};

// Remove text editing toolbar, specify editor-container for quill js
var quill = new Quill('#editor-container', {
  modules: {
    toolbar: false
  },
  theme: 'snow'
});
quill.root.setAttribute("spellcheck", "false")

// https://www.w3schools.com/howto/howto_js_draggable.asp

dragElement(document.getElementById("suggestArea1"));

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Initiate variables and constants
let editorContainer = document.getElementById('editor-container');
let suggestContainer = document.getElementById("suggestContainer");
let editorMirror = document.getElementById("editorMirror");
let suggestArea1 = document.getElementById("suggestArea1");
// let suggestArea2 = document.getElementById("suggestArea2");
let dictionaryList = document.getElementById('dictionaryList');
let searchInput = document.getElementById('searchInput');
let loader = document.getElementById('loader');
let loaderText = document.getElementById('loader-text');
let checkButton = document.getElementById('check_button');
let wordNum = document.getElementById('wordNum');
let seedNum = document.getElementById('seedNum');
let nwNum = document.getElementById('nwNum');
let sampleBtn = document.getElementById('sample-btn');
let enchantCheck = document.getElementById('pyenchant');
// let enchantBtn = document.getElementById('enchant-btn');

let corpus_words = [];

const MAX_WORDS  = 500;
const WORD_REGEX = /([^\s]+)/g

const rightBodyWidth = document.body.clientWidth - 310

let isEditing = false;
let isWordSelected = false;
let hasPasted = false;

let selectionIndex = 0;
let string_selected

let suggestions = [];
let currentWord = "";

let oldText = "";

// Set the width of editor and suggestion container to not overlap with corpus area
editorContainer.style.width = rightBodyWidth + "px"
suggestContainer.style.width = rightBodyWidth + "px"

editorContainer.addEventListener("paste", ()=>{
  hasPasted = true;
  loader.style.display = "flex";
  checkButton.disabled = true;
});

function get_stripped_text() {
  let stripped_text = quill.root.innerText.replace(/(\r\n|\r|\n){2,}/g, '$1\n')
  return stripped_text.replace(/ +(?= )/g,'');
}

checkButton.addEventListener("click", ()=>{
  loader.style.display = "flex";
  checkButton.disabled = true;
  quill.disable();
  eel.get_user_text(get_stripped_text(), 0);
  suggestArea1.style.opacity = 0;
  quill.setText(stripped_text);
});

sampleBtn.addEventListener("click", ()=>{
  eel.generate_sample(wordNum.value, seedNum.value, nwNum.value);
  loader.style.display = "flex";
});

// enchantBtn.addEventListener("click", ()=>{
//   let stripped_text = quill.root.innerText.replace(/(\r\n|\r|\n){2,}/g, '$1\n')
//   stripped_text = stripped_text.replace(/ +(?= )/g,'');
//   eel.run_py_enchant(stripped_text);
// });

eel.expose(return_sample);
function return_sample(sample) {
  quill.setText(sample);
  count_words(quill.getText());
}

// Return all words from corpus
eel.expose(return_all_words);
function return_all_words(words) {
  corpus_words = words;
  dictionaryList.innerHTML = "";
  corpus_words.forEach(function(word) {
    let new_li= document.createElement("li");
    new_li.innerText = word;
    new_li.className = "";
    dictionaryList.appendChild(new_li);
  });
}

eel.get_all_words()

eel.expose(return_suggestion);
function return_suggestion(position) {
  if (position.hasOwnProperty('suggestions')) {
    if (position["type"] == "nonword") {
      quill.formatText(position["start"], position["token"].length, {
        'bold': true,
      });
    } else {
      quill.formatText(position["start"], position["token"].length, {
        'italic': true,
        'underline': true
      });
    }
  }
}

eel.expose(return_suggestions);
function return_suggestions(positions) {
  suggestions = positions
  console.log(suggestions)
  quill.removeFormat(0, quill.getLength)
  for (let i=suggestions.length - 1; i>= 0; i--) {
    if (suggestions[i].hasOwnProperty('suggestions')) {
      
      addMention(suggestions[i]["token"],
                 JSON.stringify(suggestions[i]["suggestions"]),
                 suggestions[i]["id"],
                 suggestions[i]["start"] + suggestions[i]["token"].length) ;
      quill.deleteText(suggestions[i]["start"], suggestions[i]["token"].length); 
    }
  }
  var elements = document.getElementsByClassName("quill-mention");

  var mention_click = function(event) {
    var attribute = this.getAttribute("data-id");
    // https://codepen.io/rm89/pen/aNOmzQ
    var xPosition = event.pageX - editorContainer.getBoundingClientRect().left - (suggestArea1.clientWidth / 3);
    var yPosition = event.pageY - editorContainer.getBoundingClientRect().top - (suggestArea1.clientHeight / 3);
    generate_buttons(xPosition, yPosition, attribute, this.id, this.getAttribute("data-start"))
  };
  
  for (var i = 0; i < elements.length; i++) {
      elements[i].addEventListener('click', mention_click, false);
  }
  loader.style.display = "none";
  checkButton.disabled = false;
  quill.enable();
}

eel.expose(return_load_message);
function return_load_message(message) {
  loaderText.innerHTML = message
}

// When text cursor in text editor change
quill.on('editor-change', function(eventName, range, oldRange) {
  if (eventName === 'selection-change') {
    suggestArea1.style.opacity = 0; 
    // suggestArea2.style.opacity = 0;
    if (range) {
      // If only one character selected
        if (range.length == 0) {
          // When user moved text cursor and text has changed
          if (quill.getText() !== oldText) {
            count_words(quill.getText());
            if (hasPasted) {
              quill.disable();
              eel.get_user_text(get_stripped_text(), 0);
              suggestArea1.style.opacity = 0;
              hasPasted = false
            }
          }
          count_words(quill.getText());
        } else { // if more than one character selected
          var text = quill.getText(selectionIndex, range.length);
          console.log('User has highlighted', text);
        }
      } else { // if user select area outside of text editor
        if (suggestions.length > 0) {
          suggestArea1.style.opacity = 1;
        }
        
        console.log('Cursor not in the editor');
      }
  }
});

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
  suggestions = [];
});

// Allow user to download textarea text as a .txt file using the download button
document.getElementById("txtBtn").addEventListener("click", ()=>{
  var link = document.createElement('a');
  link.href = 'data:text/plain;charset=UTF-8,' + escape(quill.getText());
  link.download = 'output.txt';
  link.click();
});

searchInput.addEventListener("keyup", ()=>{
  dictionaryList.innerHTML = "";
  if (searchInput.value.length > 0) {
    for (w in corpus_words) {
      if (corpus_words[w].toUpperCase().startsWith(searchInput.value.toUpperCase())) {
        let new_li= document.createElement("li");
        new_li.innerText = corpus_words[w];
        new_li.className = "";
        dictionaryList.appendChild(new_li);
      }
    }
  } else {
    eel.get_all_words()
  }
});

function generate_buttons(x, y, candidates, parentId, parentStart) {
  suggestArea1.style.opacity = 1;
  suggestArea1.style.top = (y) + "px";
  suggestArea1.style.left = (x)+ "px";
  suggestArea1.innerHTML = "";
  candidates = JSON.parse(candidates)

  if (candidates.length > 0 && typeof candidates !== undefined) {
    // if isWordSelected and has suggestions gotten from check non words, use instead
    for (let i =0; i<candidates.length; i++) {
      let new_btn = document.createElement("button");
      new_btn.innerText = candidates[i]["word"]  + "\n" + candidates[i]["stats"];
      new_btn.className = "suggestions";
      // new_btn.classList.add('class-1');
      new_btn.onclick = function(){
        document.getElementById(parentId).innerText = this.innerText;
        suggestArea1.style.opacity = 0; 
      };
      suggestArea1.appendChild(new_btn);
    }
  }
}
