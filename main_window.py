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
        self.textedit = QTextEdit()
        self.textedit.setPlainText(self.userInputText)
        self.textedit.textChanged.connect(self.textUpdateEvt)
        self.editCursor = QTextCursor(self.textedit.textCursor())
        self.inputLayout.addWidget(self.textedit)

        # Add another frame with horizontal layout under the text area to contain buttons
        self.inputOptions = QFrame()
        self.inputLayout.addWidget(self.inputOptions)
        self.inputOptionsLayout = QHBoxLayout()

        # Button: copy from clipboard
        self.copyBtn = QPushButton()
        self.copyBtn.setText("Copy from clipboard")
        self.copyBtn.clicked.connect(self.copyBtnEvt)
        self.inputOptionsLayout.addWidget(self.copyBtn)

        # Button: paste to clipboard
        self.pasteBtn = QPushButton()
        self.pasteBtn.setText("Paste to clipboard")
        self.pasteBtn.clicked.connect(self.pasteBtnEvt)
        self.inputOptionsLayout.addWidget(self.pasteBtn)

        # Button: clear text area
        self.clearBtn = QPushButton()
        self.clearBtn.setText("Clear text")
        self.clearBtn.clicked.connect(self.clearBtnEvt)
        self.inputOptionsLayout.addWidget(self.clearBtn)

        # Label: keep track of word numbers in text area
        wordCountLabel = QLabel()
        wordCountLabel.setText("0/500 words")
        wordCountLabel.setAlignment(Qt.AlignCenter)
        self.inputOptionsLayout.addWidget(wordCountLabel)

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

    # Function to update text edit
    def updateTextEdit(self):
        self.textedit.setPlainText(self.userInputText)

    # Function to paste text from clipboard
    def pasteBtnEvt(self):
        win32clipboard.OpenClipboard()
        index = self.getEditCursor().position()
        self.userInputText = self.userInputText[:index] + 'Fu ' + self.userInputText[index:]
        self.updateTextEdit()
        win32clipboard.CloseClipboard()

    # Function to copy text to clipboard
    def copyBtnEvt(self):
        win32clipboard.OpenClipboard()
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardText(self.userInputText)
        win32clipboard.CloseClipboard()

    # Function to clear text edit
    def clearBtnEvt(self):
        self.userInputText = ""
        self.textedit.clear()

    def textUpdateEvt(self):
        print(self.textedit.toPlainText())

    def getEditCursor(self):
        return self.textedit.textCursor()

# Call the main window class and maximize its view
def main():
    app = QApplication(sys.argv)
    ex = MainWindow()
    ex.showMaximized()
    sys.exit(app.exec_())
	
if __name__ == '__main__':
   main()