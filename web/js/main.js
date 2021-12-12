// Initiate quill js
// Quill js is a library for creating text editor
// Remove text editing toolbar, specify editor-container for quill js
var quill = new Quill('#editor-container', {
  modules: {
    toolbar: false
  },
  theme: 'snow'
});
quill.root.setAttribute("spellcheck", "false")

// Allow the word suggestion box UI to be draggable by user for re-positioning
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
// getElementById means to get a UI component and store as variable
let editorContainer = document.getElementById('editor-container');
let suggestContainer = document.getElementById("suggestContainer");
let editorMirror = document.getElementById("editorMirror");
let suggestArea1 = document.getElementById("suggestArea1");
let clearBtn = document.getElementById("clearBtn")
let txtBtn = document.getElementById("txtBtn")
let dictionaryList = document.getElementById('dictionaryList');
let searchInput = document.getElementById('searchInput');
let loader = document.getElementById('loader');
let loaderText = document.getElementById('loader-text');
let checkButton = document.getElementById('check_button');
let wordNum = document.getElementById('wordNum');
let seedNum = document.getElementById('seedNum');
let nwNum = document.getElementById('nwNum');
let ttSplit = document.getElementById('ttSplit');
let sampleBtn = document.getElementById('sample-btn');
let prediction = document.getElementById('prediction');
let predRep = document.getElementById('pred_report');
let predRes = document.getElementById('pred_result');
let pyenchant = document.getElementById('pyenchant');
let enchantRes = document.getElementById('pyenchant_result');
let enchantRep = document.getElementById('pyenchant_report');
let phrasesArea = document.getElementById('phrasesArea');
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
  // disableButtons();
});

// Disable buttons when check is being performed
function disableButtons(bool=true) {
  if (bool) {
    checkButton.disabled = true;
    sampleBtn.disabled = true;
    clearBtn.disabled = true;
    txtBtn.disabled = true;
    wordNum.disabled = true;
    seedNum.disabled = true;
    nwNum.disabled = true;
    ttSplit.disabled = true;
    quill.disable();
  } else {
    checkButton.disabled = false;
    sampleBtn.disabled = false;
    clearBtn.disabled = false;
    txtBtn.disabled = false;
    wordNum.disabled = false;
    seedNum.disabled = false;
    nwNum.disabled = false;
    ttSplit.disabled = false;
    quill.enable();
  }
}

// Remove html elements from text editor
function get_stripped_text() {
  let stripped_text = quill.root.innerText.replace(/(\r\n|\r|\n){2,}/g, '$1\n')
  return stripped_text.replace(/ +(?= )/g,'');
}

// When check button is clicked
checkButton.addEventListener("click", ()=>{
  loader.style.display = "flex";
  disableButtons();
  eel.get_user_text(get_stripped_text(), 0);
  phrasesArea.innerHTML = ""
  prediction.style.display="none"
  pyenchant.style.display = "none";
  suggestArea1.style.display = "none";
  // Send the user text to python
  quill.setText(get_stripped_text());
});

// When sample button is clicked
sampleBtn.addEventListener("click", ()=>{
  // Pass test parameters to python
  eel.generate_sample(wordNum.value, seedNum.value, nwNum.value, ttSplit.value);
  suggestArea1.style.display = "none";
  loader.style.display = "flex";
  prediction.style.display = "none";
  pyenchant.style.display = "none";
  disableButtons();
});

// Return generated test sample from python
eel.expose(return_sample);
function return_sample(sample) {
  quill.setText(sample);
  count_words(quill.getText());
}

// Return pyenchant text result from python
eel.expose(return_enchant);
function return_enchant(text, errors) {
  enchantRes.innerText = text;
  pyenchant.style.display = "inline";
  console.log(errors)
  errors.forEach((error)=>{
    let new_btn = document.createElement("button");
    new_btn.classList.add("btn_pyenchants")
    new_btn.innerText = error["token"];
    var att = document.createAttribute("suggestions");
    att.value = error["id"];
    new_btn.setAttributeNode(att);
    // enchantRes.innerHTML = enchantRes.innerHTML.replace(error["token"], new_btn.outerHTML)
    enchantRes.innerHTML = enchantRes.innerHTML.replace(error["token"] + " ", new_btn.outerHTML)
    enchantRes.innerHTML = enchantRes.innerHTML.replace(" "+ error["token"], new_btn.outerHTML)
    if (enchantRes.innerHTML.endsWith(error["token"])) {
      enchantRes.innerHTML = enchantRes.innerHTML.replace(error["token"], new_btn.outerHTML)
    }
  })
  var elements = document.getElementsByClassName("btn_pyenchants");
  var myFunction = function(node, event, suggestions) {
      var id = node.getAttribute("suggestions");
      // suggestions = suggestions.replace(/'/g, '"');
      suggestions = suggestions.find(obj => {
        return obj.id === id
      });
      // var suggestions = this.getAttribute("suggestions");
      // suggestions = suggestions.replace(/'/g, '"');
      // suggestions = JSON.parse(suggestions);
      // Generate coordinates on screen to display the suggestion UI
      var xPosition = event.clientX - pyenchant.getBoundingClientRect().left;
      var yPosition = event.clientY - pyenchant.getBoundingClientRect().top;
      // If it goes way past the screen, set it on x coordinate 0
        if (xPosition < 0){
          xPosition = 300;
        }
      // If it goes way past screen height, set y coordinate to just above screen bottom
        if (yPosition + 200 > screen.height) {
          yPosition = screen.height - 200;
        }
        suggestArea1.innerHTML = "<h2>" + node.innerText + "</h2><br />";
        suggestArea1.style.display = "block";
        suggestArea1.style.left = xPosition + "px";
        suggestArea1.style.top = yPosition + "px";

        suggestions["suggestions"].forEach((item, index)=>{
          let new_btn = document.createElement("button");
          new_btn.innerText = item;
          new_btn.className = "suggestions";
          suggestArea1.appendChild(new_btn);
        })
  };

  for (var i = 0; i < elements.length; i++) {
      elements[i].addEventListener('mouseover', function(event)
      {
        myFunction(this, event, errors)
      }, false);
  }
}

// Return pyenchant classification report from python 
eel.expose(return_report);
function return_report(rep) {
  enchantRep.innerText = rep;
  prediction.style.display = "block";
  predRep.style.display = "block";
  enchantRes.style.display = "block";
  enchantRep.style.display = "block";
}

// Return spellchecker text result from python
eel.expose(return_pred);
function return_pred(text, nonwords, realwords) {
  predRes.innerText = text
  prediction.style.display = "inline";
  nonwords.forEach((error)=>{
    let new_btn = document.createElement("button");
    new_btn.classList.add("btn_pred_nons")
    new_btn.innerText = error["token"];
    var att = document.createAttribute("suggestions");
    att.value = error["id"];
    new_btn.setAttributeNode(att);
    let search = new RegExp("\\b" + error["token"] + "\\b")
    predRes.innerHTML = predRes.innerHTML.replace(search, new_btn.outerHTML)
    // predRes.innerHTML = predRes.innerHTML.replace(error["token"] + " ", new_btn.outerHTML)
    // predRes.innerHTML = predRes.innerHTML.replace(" "+ error["token"], new_btn.outerHTML)
    // if (predRes.innerHTML.startsWith(error["token"]) || predRes.innerHTML.endsWith(error["token"])) {
    //   predRes.innerHTML = predRes.innerHTML.replace(error["token"], new_btn.outerHTML)
    // }
  })
  realwords.forEach((error)=>{
    let new_btn = document.createElement("button");
    new_btn.classList.add("btn_pred_reals")
    new_btn.innerText = error["token"];
    var att = document.createAttribute("suggestions");
    att.value = error["id"];
    new_btn.setAttributeNode(att);
    // let search = new RegExp("\\b" + error["token"] + "\\b")
    // predRes.innerHTML = predRes.innerHTML.replace(search, new_btn.outerHTML)
    predRes.innerHTML = predRes.innerHTML.replace(error["token"] + " ", new_btn.outerHTML)
    predRes.innerHTML = predRes.innerHTML.replace(" "+ error["token"], new_btn.outerHTML)
    if (predRes.innerHTML.endsWith(error["token"])) {
      predRes.innerHTML = predRes.innerHTML.replace(error["token"], new_btn.outerHTML)
    }
  })
  var elements = document.getElementsByClassName("btn_pred_nons")
  var elements2 = document.getElementsByClassName("btn_pred_reals");

  var myFunction = function(node, event, suggestions) {
      var id = node.getAttribute("suggestions");
      // suggestions = suggestions.replace(/'/g, '"');
      suggestions = suggestions.find(obj => {
        return obj.id === id
      });
      // // Generate coordinates on screen to display the suggestion UI
      var xPosition = event.screenX - prediction.getBoundingClientRect().left;
      var yPosition = event.screenY - prediction.getBoundingClientRect().top;
      // If it goes way past the screen, set it on x coordinate 0
        if (xPosition < 0){
          xPosition = 300;
        }
      // If it goes way past screen height, set y coordinate to just above screen bottom
        if (yPosition + 200 > screen.height) {
          yPosition = screen.height - 200;
        }
      //   // Create header and buttons in suggest area
        suggestArea1.innerHTML = "<h2>" + node.innerText + "</h2><br />";
        var att = document.createAttribute("old");
        att.value = node.innerText;
        suggestArea1.setAttributeNode(att);
        var att2 = document.createAttribute("type");
        att2.value = node.classList.contains("btn_pred_nons") ? "non" : "real";;
        suggestArea1.setAttributeNode(att2);
        suggestArea1.style.display = "block";
        suggestArea1.style.left = xPosition + "px";
        suggestArea1.style.top = yPosition + "px";
        suggestions["suggestions"].forEach((item, index)=>{
          let new_btn = document.createElement("button");
          let text = item["word"] + "\n" + item["stats"]
          new_btn.innerText = text;
          new_btn.className = "suggestions";
          var att = document.createAttribute("value");
          att.value = item["word"];
          new_btn.setAttributeNode(att);
          // when newly created button is clicked, replace text with suggestion
          new_btn.onclick = function() {
            let value = this.value;
            let old = this.parentNode.getAttribute("old")
            let type = this.parentNode.getAttribute("type")
            let highlights = []
            if (type==="real") {
              var lastIndex = old.lastIndexOf(" ");
              value = old.substring(0, lastIndex) + " " + value;
              highlights = document.getElementsByClassName("btn_pred_reals")
            } else {
              highlights = document.getElementsByClassName("btn_pred_nons")
            }
            updated = quill.getText().replace(old, value);
            quill.setText(updated);
            for (let i=0; i<highlights.length; i++) {
              if (highlights[i].innerText === old) {
                highlights[i].innerText = value;
              }
            }
            suggestArea1.style.display = "none";
          }
          suggestArea1.appendChild(new_btn);
        })
  };

  for (var i = 0; i < elements.length; i++) {
      elements[i].addEventListener('mouseover', function(event)
      {
        myFunction(this, event, nonwords)
      }, false);
  }
  for (var i = 0; i < elements2.length; i++) {
    elements2[i].addEventListener('mouseover', function(event)
    {
      myFunction(this, event, suggestions)
    }, false);
  }
}

// Return spellchecker classification report from python
eel.expose(return_pred_report);
function return_pred_report(rep) {
  predRep.style.display = "block";
  enchantRes.style.display = "block";
  enchantRep.style.display = "block";
  predRep.innerText = rep;
  prediction.style.display = "inline";
}

// Return all words from corpus
eel.expose(return_all_words);
function return_all_words(words) {
  corpus_words = words;
  dictionaryList.innerHTML = "";
  // Create a list element for each word in corpus
  corpus_words.forEach(function(word) {
    let new_li= document.createElement("li");
    new_li.innerText = word;
    new_li.className = "";
    dictionaryList.appendChild(new_li);
  });
}

// Return all the unigrams from python to populate the left area of UI
eel.get_all_words()

// Return phrases from python
eel.expose(return_phrases)
function return_phrases(phrases) {
  phrasesArea.style.display = "block"
  phrasesArea.innerHTML = phrases
}

// Return a suggestion from python
eel.expose(return_suggestion);
function return_suggestion(position) {
  if (position.hasOwnProperty('suggestions')) {
    // If suggestion is nonword, bold it
    if (position["type"] == "nonword") {
      let start = quill.getText().indexOf(position["token"])
      quill.formatText(start, position["token"].length, {
        'bold': true,
        'underline': true
      });
    } else {  // if its real word error, italicize
      let start = quill.getText().indexOf(position["token"])
      quill.formatText(start, position["token"].length, {
        'italic': true,
        'underline': true
      });
    }
  }
}

// Return all suggestions from python
eel.expose(return_suggestions);
function return_suggestions(positions) {
  suggestions = positions
  console.log(suggestions)
  quill.removeFormat(0, quill.getLength())

  loader.style.display = "none";
  predRep.style.display = "none";
  enchantRes.style.display = "none";
  enchantRep.style.display = "none";
  disableButtons(false);
}

// Return loading messages from python
eel.expose(return_load_message);
function return_load_message(message) {
  loaderText.innerHTML = message
}

document.getElementsByTagName('body')[0].onscroll = () => {
  suggestArea1.style.display = "none";
};

// When text cursor in text editor change
quill.on('editor-change', function(eventName, range, oldRange) {
  if (eventName === 'selection-change') {
    suggestArea1.style.display = "none"; 
    // suggestArea2.style.opacity = 0;
    if (range) {
      // If only one character selected
        if (range.length == 0) {
          // When user moved text cursor and text has changed
          if (quill.getText() !== oldText) {
            count_words(quill.getText());
            if (hasPasted) {
              // quill.disable();
              disableButtons();
              eel.get_user_text(get_stripped_text(), 0);
              phrasesArea.innerHTML = ""
              suggestArea1.style.display = "none";
              prediction.style.display = "none";
              pyenchant.style.display = "none";
              hasPasted = false
            }
          }
          count_words(quill.getText());
          oldText = quill.getText();
        } else { // if more than one character selected
          var text = quill.getText(selectionIndex, range.length);
          console.log('User has highlighted', text);
        }
      } else { // if user select area outside of text editor
        if (suggestions.length > 0) {
          suggestArea1.style.display = "block";
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
clearBtn.addEventListener("click", ()=>{
  updateInnerText("wordnum", 0);
  quill.setText('');
  suggestions = [];
});

// Allow user to download textarea text as a .txt file using the download button
txtBtn.addEventListener("click", ()=>{
  var link = document.createElement('a');
  link.href = 'data:text/plain;charset=UTF-8,' + escape(quill.getText());
  link.download = 'output.txt';
  link.click();
});

// Allow user to search for corpus entries on left side of UI
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

// Generate more buttons when an error button in text editor is clicked
// Each new button is based on suggestion given by python for that specific word
function generate_buttons(x, y, candidates, parentId, parentStart) {
  suggestArea1.style.display = "block";
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
      var att = document.createAttribute("value");
      att.value = candidates[i]["word"];
      new_btn.setAttributeNode(att);
      new_btn.onclick = function(){
        document.getElementById(parentId).innerText = this.value;
        suggestArea1.style.display = "none"; 
      };
      suggestArea1.appendChild(new_btn);
    }
  }
}
