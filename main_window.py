import sys
from PyQt5.QtGui import *
from PyQt5.QtCore import *
from PyQt5.QtWidgets import *
import win32clipboard

class MainWindow(QWidget):

    def __init__(self):
        # Initialize UI
        super(MainWindow, self).__init__()
        self.userInputText = ""
        self.initUI()

    def initUI(self):
        # Split the window into 2 main frames
        self.hbox = QHBoxLayout()
        self.inputFrame = QFrame()
        self.inputFrame.setFrameShape(QFrame.StyledPanel)
        self.suggestFrame = QFrame()
        self.suggestFrame.setFrameShape(QFrame.StyledPanel)

        # The first frame on top will be text area. Add title and text area
        self.inputLayout = QVBoxLayout()
        self.inputLayout.addWidget(QLabel("<h1>Welcome to test</h1>"))
        self.textedit = QPlainTextEdit()
        self.textedit.setPlainText("")
        self.textedit.textChanged.connect(self.textUpdateEvt)
        self.textedit.cursorPositionChanged.connect(self.cursorUpdateEvt)
        self.editCursor = QTextCursor(self.textedit.textCursor())
        self.inputLayout.addWidget(self.textedit)

        # Add another frame with horizontal layout under the text area to contain buttons
        self.inputOptions = QFrame()
        self.inputLayout.addWidget(self.inputOptions)
        self.inputOptionsLayout = QHBoxLayout()

        # Button: Save as txt file
        self.saveTxtBtn = QPushButton()
        self.saveTxtBtn.setText("Save as text file")
        self.inputOptionsLayout.addWidget(self.saveTxtBtn)

        # Button: Save as Word document
        self.saveWordBtn = QPushButton()
        self.saveWordBtn.setText("Save as Word file")
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

        # Set layouts of both first main frame and the frame in the first main frame
        self.inputOptions.setLayout(self.inputOptionsLayout)
        self.inputFrame.setLayout(self.inputLayout)

        # Add a splitter to divide both main frames to allow user to drag and expand frame size
        self.frameSplitter = QSplitter(Qt.Vertical)
        self.frameSplitter.addWidget(self.inputFrame)
        self.frameSplitter.addWidget(self.suggestFrame)
        self.hbox.addWidget(self.frameSplitter)
        self.setLayout(self.hbox)
        QApplication.setStyle(QStyleFactory.create('Cleanlooks'))
        
        # Set main window layout and title
        self.setGeometry(500, 500, 500, 400)
        self.setWindowTitle('Test')
        self.show()

    # Function to clear text edit
    def clearBtnEvt(self):
        self.textedit.setPlainText("")
        self.textedit.clear()

    # Function to watch for new keyboard entries
    def textUpdateEvt(self):
        print(self.textedit.toPlainText())
        self.updateWordCount()
    
    # Function to update word count
    def updateWordCount(self):
        newCount = str(len(self.textedit.toPlainText().split())) + "/500words"
        self.wordCountLabel.setText(newCount)

    # Function to get text edit cursor
    def getEditCursor(self):
        return self.textedit.textCursor()

    # Function to watch for cursor position changes
    def cursorUpdateEvt(self):
        index = self.getEditCursor().position() - 1
        current = self.textedit.toPlainText()
        print(current[index])

# Call the main window class and maximize its view
def main():
    app = QApplication(sys.argv)
    ex = MainWindow()
    ex.showMaximized()
    sys.exit(app.exec_())
	
if __name__ == '__main__':
   main()