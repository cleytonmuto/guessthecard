import { useState, useEffect } from 'react'
import './App.css'

interface Card {
  suit: string
  value: number
  image: string
}

type GamePhase = 'selection' | 'reordered'

function App() {
  const [deck, setDeck] = useState<Card[]>([])
  const [selectedCards, setSelectedCards] = useState<Card[]>([])
  const [reorderedCards, setReorderedCards] = useState<Card[]>([])
  const [gamePhase, setGamePhase] = useState<GamePhase>('selection')
  const [isLoading, setIsLoading] = useState(true)
  const [showHiddenCard, setShowHiddenCard] = useState(false)

  // Load all card images using Vite's import.meta.glob
  useEffect(() => {
    const suits = ['clubs', 'diamonds', 'hearts', 'spades']
    const cards: Card[] = []

    // Use import.meta.glob to get all card images
    const cardImages = import.meta.glob('./assets/*.png', { eager: true, as: 'url' })
    
    suits.forEach(suit => {
      for (let i = 1; i <= 13; i++) {
        const value = i
        const imageName = `${suit}${value.toString().padStart(2, '0')}.png`
        const imagePath = `./assets/${imageName}`
        
        if (cardImages[imagePath]) {
          cards.push({
            suit,
            value,
            image: cardImages[imagePath] as string
          })
        }
      }
    })

    // Shuffle the deck
    const shuffled = cards.sort(() => Math.random() - 0.5)
    setDeck(shuffled)
    setIsLoading(false)
  }, [])

  // Calculate card number (1-52) based on suit and value
  const getCardNumber = (card: Card): number => {
    const suitOrder: Record<string, number> = {
      'spades': 0,
      'clubs': 1,
      'hearts': 2,
      'diamonds': 3
    }
    return card.value + (suitOrder[card.suit] * 13)
  }

  // Get permutation number (1-24) for 4 cards based on their order
  // ABCD = 1, DCBA = 24
  // This calculates what permutation number the current order represents
  const getPermutationNumber = (cards: Card[]): number => {
    if (cards.length !== 4) return 0

    // Calculate numbers for each card and identify A, B, C, D
    const cardData = cards.map((card, idx) => ({
      card,
      number: getCardNumber(card),
      originalIndex: idx
    }))

    // Sort by number to identify which card is A, B, C, D
    const sorted = [...cardData].sort((a, b) => a.number - b.number)
    
    // Map each original card to its sorted position (A=0, B=1, C=2, D=3)
    const originalOrder: number[] = []
    cards.forEach(card => {
      const sortedIdx = sorted.findIndex(item => item.card === card)
      originalOrder.push(sortedIdx)
    })

    // Convert permutation to number 1-24 using Lehmer code
    // ABCD (0,1,2,3) = 1, DCBA (3,2,1,0) = 24
    let permNumber = 1
    const used: boolean[] = [false, false, false, false]
    
    for (let i = 0; i < 4; i++) {
      const value = originalOrder[i]
      let count = 0
      for (let j = 0; j < value; j++) {
        if (!used[j]) count++
      }
      used[value] = true
      permNumber += count * factorial(3 - i)
    }

    return permNumber
  }

  const factorial = (n: number): number => {
    if (n <= 1) return 1
    return n * factorial(n - 1)
  }

  const handleCardClick = (card: Card) => {
    if (gamePhase !== 'selection') return
    if (selectedCards.length >= 5) return
    if (selectedCards.some(c => c.suit === card.suit && c.value === card.value)) return

    setSelectedCards([...selectedCards, card])
  }

  const handleReorder = () => {
    if (selectedCards.length !== 5) return

    const firstFour = selectedCards.slice(0, 4)
    const fifthCard = selectedCards[4]

    // Calculate numbers for the 4 cards
    const cardNumbers = firstFour.map(card => ({
      card,
      number: getCardNumber(card)
    }))

    // Sort by number to get A, B, C, D (A = smallest, D = largest)
    const sorted = [...cardNumbers].sort((a, b) => a.number - b.number)
    const sortedCards = sorted.map(item => item.card)

    // Get the permutation number
    const permNumber = getPermutationNumber(firstFour)

    // Reordered: 5th card first (face down), then the 4 sorted cards below
    // The order of these 4 cards represents the permutation
    setReorderedCards([fifthCard, ...sortedCards])
    setGamePhase('reordered')
    setShowHiddenCard(false)
  }

  const handleReset = () => {
    setSelectedCards([])
    setReorderedCards([])
    setGamePhase('selection')
    setShowHiddenCard(false)
    // Reshuffle deck
    const shuffled = [...deck].sort(() => Math.random() - 0.5)
    setDeck(shuffled)
  }

  if (isLoading) {
    return <div className="loading">Loading cards...</div>
  }

  return (
    <div className="app">
      <h1>🎴 Magical Card Divination Trick</h1>
      
      {gamePhase === 'selection' && (
        <>
          <div className="instructions">
            <p>Select 5 cards from the deck. The 5th card will be the one to guess!</p>
            <p className="selection-count">Selected: {selectedCards.length} / 5</p>
          </div>

          {selectedCards.length > 0 && (
            <div className="selected-cards-preview">
              <h3>Your Selection:</h3>
              <div className="cards-container">
                {selectedCards.map((card, index) => (
                  <div key={`${card.suit}-${card.value}-${index}`} className="card-wrapper">
                    <img 
                      src={card.image} 
                      alt={`${card.suit} ${card.value}`}
                      className="card-image"
                    />
                    <span className="card-number">{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedCards.length === 5 && (
            <button className="reorder-button" onClick={handleReorder}>
              Reorder Cards
            </button>
          )}

          <div className="deck-container">
            <h3>Choose your cards:</h3>
            <div className="deck-grid">
              {deck.map((card, index) => {
                const isSelected = selectedCards.some(
                  c => c.suit === card.suit && c.value === card.value
                )
                return (
                  <div
                    key={`${card.suit}-${card.value}-${index}`}
                    className={`card-wrapper ${isSelected ? 'selected' : ''} ${selectedCards.length >= 5 ? 'disabled' : ''}`}
                    onClick={() => handleCardClick(card)}
                  >
                    <img 
                      src={card.image} 
                      alt={`${card.suit} ${card.value}`}
                      className="card-image"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {gamePhase === 'reordered' && (
        <>
          <div className="instructions">
            <p>The cards have been reordered! The first card (face down) is the one to guess.</p>
            <p>The four cards below represent the hidden card through permutation.</p>
          </div>

          <div className="reordered-container">
            <div className="card-stack">
              {/* 5th card - face down (to be guessed) */}
              <div className="card-wrapper face-down">
                {showHiddenCard && reorderedCards[0] ? (
                  <>
                    <img 
                      src={reorderedCards[0].image} 
                      alt={`${reorderedCards[0].suit} ${reorderedCards[0].value}`}
                      className="card-image"
                    />
                    <span className="card-label">Card to Guess</span>
                  </>
                ) : (
                  <>
                    <div className="card-back">?</div>
                    <span className="card-label">Card to Guess</span>
                  </>
                )}
              </div>
            </div>

            <div className="toggle-container">
              <button 
                className={`toggle-button ${showHiddenCard ? 'on' : 'off'}`}
                onClick={() => setShowHiddenCard(!showHiddenCard)}
              >
                {showHiddenCard ? 'HIDE' : 'SHOW'}
              </button>
            </div>

            <div className="four-cards-row">
              <h3>Four Cards (Representing the Hidden Card):</h3>
              <div className="cards-container">
                {reorderedCards.slice(1).map((card, index) => (
                  <div key={`reordered-${card.suit}-${card.value}-${index}`} className="card-wrapper">
                    <img 
                      src={card.image} 
                      alt={`${card.suit} ${card.value}`}
                      className="card-image"
                    />
                    <span className="card-number">{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button className="reset-button" onClick={handleReset}>
            Start Over
          </button>
        </>
      )}
    </div>
  )
}

export default App
