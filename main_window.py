import sys
from PyQt5.QtGui import *
from PyQt5.QtCore import *
from PyQt5.QtWidgets import *

class MainWindow(QWidget):

    def __init__(self):
        # Initialize UI
        super(MainWindow, self).__init__()
        self.suggestions = [
            {"word": "cat", "distance": 5},
            {"word": "fish", "distance": 3},
            {"word": "carrot", "distance": 8},
            {"word": "egg", "distance": 9},
            {"word": "onion", "distance": 12},
            {"word": "seaweed", "distance": 4},
            {"word": "apple", "distance": 9},
            {"word": "car", "distance": 15},
            {"word": "house", "distance": 11},
            {"word": "old", "distance": 7},
            {"word": "new", "distance": 7},
            {"word": "past", "distance": 13},
        ]
        self.initUI()

    def initUI(self):
        # create 2 windows: main for text input, sub window for text suggestion
        self.mainVBox = QVBoxLayout()
        self.inputFrame = QFrame()
        self.inputFrame.setFrameShape(QFrame.StyledPanel)
        self.suggestPopUp = SuggestWindow()

        # The main window will have text area for user input. Add title and layout.
        self.inputLayout = QVBoxLayout()
        self.inputLayout.addWidget(QLabel("<h1>Welcome to test</h1>"))

        # Add another frame with horizontal layout to contain buttons
        self.inputOptions = QFrame()
        self.inputLayout.addWidget(self.inputOptions)
        self.inputOptionsLayout = QHBoxLayout()

        # Button: Save as txt file
        self.saveTxtBtn = QPushButton()
        self.saveTxtBtn.setText("Save as text file")
        self.saveTxtBtn.clicked.connect(self.saveTxtBtnEvt)
        self.inputOptionsLayout.addWidget(self.saveTxtBtn)

        # Button: Save as Word document
        self.saveWordBtn = QPushButton()
        self.saveWordBtn.setText("Save as Word file")
        self.saveWordBtn.clicked.connect(
            lambda checked: self.toggleWindow(self.suggestPopUp)
        )
        self.inputOptionsLayout.addWidget(self.saveWordBtn)

        # Button: clear text area
        self.clearBtn = QPushButton()
        self.clearBtn.setText("Clear text")
        self.clearBtn.clicked.connect(self.clearBtnEvt)
        self.inputOptionsLayout.addWidget(self.clearBtn)

        # Label: keep track of word numbers in text area
        self.wordCountLabel = QLabel()
        self.wordCountLabel.setText("0/500 words")
        self.wordCountLabel.setAlignment(Qt.AlignCenter)
        self.inputOptionsLayout.addWidget(self.wordCountLabel)

        # PlainTextEdit: Add text area, which only allows plain text and not for rich text editing
        self.textedit = QPlainTextEdit()
        self.textedit.setPlainText("")
        self.textedit.textChanged.connect(self.textUpdateEvt)
        self.textedit.cursorPositionChanged.connect(self.cursorUpdateEvt)
        self.textedit.zoomIn(4)
        self.editCursor = QTextCursor(self.textedit.textCursor())
        self.inputLayout.addWidget(self.textedit)

        # Set layouts of both first main frame and the frame in the main window
        self.inputOptions.setLayout(self.inputOptionsLayout)
        self.inputFrame.setLayout(self.inputLayout)

        # Add input frame to main window
        self.mainVBox.addWidget(self.inputFrame)
        self.setLayout(self.mainVBox)
        QApplication.setStyle(QStyleFactory.create('Cleanlooks'))
        
        # Set main window layout and title
        self.setGeometry(100, 100, 500, 600)
        self.setWindowTitle('Test')
        self.show()

    # Function to clear text edit
    def saveTxtBtnEvt(self):
        fileName, _ = QFileDialog.getSaveFileName(None,"QFileDialog.getOpenFileName()", "","Text File (*.txt)")
        with open(fileName, 'w') as file:
            file.write(self.textedit.toPlainText())

    # Function to clear text edit
    def saveWordBtnEvt(self):
        self.textedit.clear()

    # Function to clear text edit
    def clearBtnEvt(self):
        self.textedit.clear()

    # Function to watch for new keyboard entries
    def textUpdateEvt(self):
        print(self.textedit.toPlainText())
        self.updateWordCount()
    
    # Function to update word count and limit word number to 500
    def updateWordCount(self):
        text = self.textedit.toPlainText()
        newCount = len(text.split())
        countText = str(newCount) + "/500words"
        self.wordCountLabel.setText(countText)
        maxInputLen = 500
        if newCount > maxInputLen:
            text = ' '.join(text.split()[:maxInputLen])
            self.textedit.setPlainText(text)
            self.getEditCursor().setPosition(len(text))

    # Function to get text edit cursor
    def getEditCursor(self):
        return self.textedit.textCursor()

    # Function to watch for cursor position changes
    def cursorUpdateEvt(self):
        if len(self.textedit.toPlainText()) > 0:
            index = self.getEditCursor().position() - 1
            current = self.textedit.toPlainText()
            print(current[index])
            if current[index] == " " or current[index] == "\n":
                print("space or blank, suggest new word")
            else:
                print("cursor in word, use spell check")

    # # Function to dynamically generate suggestion buttons
    # def generateButtons(self):
    #     for s in self.suggestions:
    #         newBtn = QPushButton()
    #         newBtn.setText(s["word"])
    #         count = self.suggestOptionsLayout.count() - 1
    #         self.suggestOptionsLayout.insertWidget(count, newBtn)
    #         # self.suggestOptions.setLayout(self.suggestOptionsLayout)

    # Show sub window, such as spelling suggestion window
    def toggleWindow(self, window):
        if window.isVisible():
            window.hide()

        else:
            window.show()

class SuggestWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.hbox = QHBoxLayout()
        self.scrollArea = QScrollArea()
        self.widget = QWidget()                 
        self.scrollArea.setVerticalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        self.scrollArea.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOn)
        self.scrollArea.setWidgetResizable(True)
        self.scrollArea.setWidget(self.widget)
        self.hbox.addWidget(self.scrollArea)
        self.setGeometry(200, 200, 400, 100)
        self.setWindowTitle('Spelling suggestions')
        self.setLayout(self.hbox)

# Call the main window class and maximize its view
def main():
    app = QApplication(sys.argv)
    ex = MainWindow()
    # ex.showMaximized()
    sys.exit(app.exec_())
	
if __name__ == '__main__':
   main()