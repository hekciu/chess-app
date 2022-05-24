'use strict'

class ChessGameClient{
    constructor(me,enemy,myColor,socket){
        this.currentlySelectedChessPiece = ""
        this.socket = socket
        this.me = me;
        this.enemy = enemy;
        this.myColor = myColor;
        this.enemyColor = this.myColor === "White" ? "Black" : "White"
        this.boardPositionsVertical = ["A","B","C","D","E","F","G","H"]
        this.boardPositionsHorizontal = ["1","2","3","4","5","6","7","8"] 
        this.enemyPositions = [["P1","A2"],["P2","B2"],["P3","C2"],["P4","D2"],["P5","E2"],["P6","F2"],["P7","G2"],["P8","H2"],
        ["R1","A1"],["Kn1","B1"],["B1","C1"],["K",this.myColor === "White" ? "E1" : "D1"],
        ["Q",this.myColor === "White" ? "D1" : "E1"],["B2","F1"],["Kn2","G1"],["R2","H1"]]
        this.myPositions = [["P1","A7"],["P2","B7"],["P3","C7"],["P4","D7"],["P5","E7"],["P6","F7"],["P7","G7"],["P8","H7"],
        ["R1","A8"],["Kn1","B8"],["B1","C8"],["K",this.enemyColor === "Black" ? "E8" : "D8"],
        ["Q",this.enemyColor === "Black" ? "D8" : "E8"],["B2","F8"],["Kn2","G8"],["R2","H8"]]
    }
    displayGame = async function(){
        await this.loadChessMoves()
        await this.displayChessMoves()
    }
    listenForSocketE = async function(){
        this.socket.on("new-chess-move",async (body)=>{
            if((body.player1 !== window.localStorage.getItem("username")) || (body.player2 !== window.localStorage.getItem("username")))
            try{
                await this.loadChessMoves()   
                await this.displayChessMoves()
            }catch(e){
                console.log(e);
            }
        })
    }
    displayChessMoves(){
        const boardDiv = document.querySelector(".img-div")
        const boardWidth = boardDiv.clientWidth;
        const boardHeight = boardDiv.clientHeight;//should be the same tbh
        const xBoardParting = boardWidth/8;
        const yBoardParting = boardHeight/8;
        const position = boardDiv.getBoundingClientRect()
        boardDiv.innerHTML = '<img src="./img/chess-board.png" alt="Chess board" class="chess-board-img">'
        this.myPositions.forEach((piecePosition)=>{
            const xIndex = this.boardPositionsVertical.indexOf(piecePosition[1][0])
            const yIndex = this.boardPositionsHorizontal.indexOf(piecePosition[1][1])  
            const xPosition = xIndex * xBoardParting;
            const yPosition = yIndex * yBoardParting;
            const html = `<img src="./img/${this.myColor.toLowerCase()}-pieces/${piecePosition[0]}.png" class="${this.myColor + piecePosition[0]} chess-piece">`
            boardDiv.insertAdjacentHTML("beforeend",html)
            const el = document.querySelector(`.${this.myColor + piecePosition[0]}`)
            el.style.left = `${xPosition + position.left}px`
            el.style.top = `${yPosition + position.top}px`
            el.style.width = `${xBoardParting}px`
            el.style.height = `${yBoardParting}px`
        })
        this.enemyPositions.forEach((piecePosition)=>{
            const xIndex = this.boardPositionsVertical.indexOf(piecePosition[1][0])
            const yIndex = this.boardPositionsHorizontal.indexOf(piecePosition[1][1])  
            const xPosition = xIndex * xBoardParting;
            const yPosition = yIndex * yBoardParting;
            const html = `<img src="./img/${this.enemyColor.toLowerCase()}-pieces/${piecePosition[0]}.png" class="${this.enemyColor + piecePosition[0]} chess-piece">`
            boardDiv.insertAdjacentHTML("beforeend",html)
            const el = document.querySelector(`.${this.enemyColor + piecePosition[0]}`)
            el.style.left = `${xPosition + position.left}px`
            el.style.top = `${yPosition + position.top}px`
            el.style.width = `${xBoardParting}px`
            el.style.height = `${yBoardParting}px`
        })
    }
    loadChessMoves = async function(){
        try{    
            const url = window.location.href.slice(0,window.location.href.lastIndexOf("/")) + "/users/me"
            const response = await fetch(url,{
                method: "GET",
                headers: {"Authorization": `Bearer ${window.localStorage.getItem("token")}`}
            })
            if(response.status !== 200) throw new Error("Failed to load user data")
            const myData = await response.json();
            for(const el of myData.currentGameChessMoves.me){
                const chessPieceName = el.chessPiece;
                const myElement = this.myPositions.filter((itr)=>{
                    return itr[0] === chessPieceName
                })[0]
                console.log(myElement);
                if(!myElement) return;
                myElement[1] = el.whichField
            }
            for(const el of myData.currentGameChessMoves.enemy){
                const chessPieceName = el.chessPiece;
                const myElement = this.enemyPositions.filter((itr)=>{
                    return itr[0] === chessPieceName
                })[0]
                console.log(myElement);
                if(!myElement) return;
                myElement[1] = el.whichField
            }
        }catch(e){
            console.log(e);
        }
    }
    checkWhichPieceSelected(xPos,yPos){
        const boardDiv = document.querySelector(".img-div")
        const boardWidth = boardDiv.clientWidth;
        const boardHeight = boardDiv.clientHeight;//should be the same tbh
        const xBoardParting = boardWidth/8;
        const yBoardParting = boardHeight/8;
        const position = boardDiv.getBoundingClientRect()
        const xToSelect = xPos - position.left
        const yToSelect = yPos - position.top
        const selectedElement = this.myPositions.filter((el)=>{
            const xIndex = this.boardPositionsVertical.indexOf(el[1][0])
            const yIndex = this.boardPositionsHorizontal.indexOf(el[1][1])  
            const xPositionLeft = xIndex * xBoardParting;
            const yPositionTop = yIndex * yBoardParting;
            const xPositionRight = (xIndex+1) * xBoardParting;
            const yPositionBottom = (yIndex+1) * yBoardParting;
            const isInXDimension = xToSelect > xPositionLeft &&  xToSelect < xPositionRight
            const isInYDimension = yToSelect > yPositionTop && yToSelect < yPositionBottom
            return isInXDimension && isInYDimension
        })
        console.log(selectedElement);
        return selectedElement
    }
    checkIfICanMoveThere(xPos,yPos){
        //check if on board
        const boardDiv = document.querySelector(".img-div")
        const boardWidth = boardDiv.clientWidth;
        const boardHeight = boardDiv.clientHeight;//should be the same tbh
        const xBoardParting = boardWidth/8;
        const yBoardParting = boardHeight/8;
        const position = boardDiv.getBoundingClientRect()
        const xToSelect = xPos - position.left
        const yToSelect = yPos - position.top
        let foundChessField;
        for(let yIndex = 0; yIndex < this.boardPositionsHorizontal.length; yIndex++){
            for(let xIndex = 0; xIndex < this.boardPositionsVertical.length; xIndex++){
                const xPositionLeft = xIndex * xBoardParting;
                const yPositionTop = yIndex * yBoardParting;
                const xPositionRight = (xIndex+1) * xBoardParting;
                const yPositionBottom = (yIndex+1) * yBoardParting;
                const isInXDimension = xToSelect > xPositionLeft &&  xToSelect < xPositionRight
                const isInYDimension = yToSelect > yPositionTop && yToSelect < yPositionBottom
                if(isInXDimension && isInYDimension){
                    foundChessField = `${this.boardPositionsVertical[xIndex]}${this.boardPositionsHorizontal[yIndex]}`
                }
            }
        }
        if(!foundChessField) return;
        return foundChessField
    }
    boardClickEventListener(e){
        const xPos = e.clientX
        const yPos = e.clientY
        const selectedPiece = this.checkWhichPieceSelected(xPos,yPos)
        if(selectedPiece.length){
            return this.currentlySelectedChessPiece = selectedPiece;
        }
        if(!this.currentlySelectedChessPiece) return;
        const whichField = this.checkIfICanMoveThere(xPos,yPos)
        const chessPiece = this.currentlySelectedChessPiece[0][0]
        const body = {
            whichField,
            chessPiece,
            token: window.localStorage.getItem("token")
        }
        this.socket.emit("new-chess-move",body)
    }
}