# Portfolio - Grispex

Portfolio fotografico interattivo con visualizzazione a griglia e popup multipli.

## Struttura del Progetto

```
portfolio/
├── index.html          # Pagina principale
├── about.html          # Pagina about
├── styles.css          # Stili CSS
├── js/
│   ├── main.js        # Logica principale dell'applicazione
│   └── animation.js   # Animazioni (se presente)
└── assets/
    ├── cover/         # Immagini di copertina (1-24)
    ├── 2/            # Immagini progetto 2
    ├── 3/            # Immagini progetto 3
    └── ...           # Altre cartelle progetti
```

## Caratteristiche

- **Griglia interattiva**: Visualizzazione a griglia delle immagini di copertina
- **Popup multipli**: Apertura di più immagini contemporaneamente in overlay
- **Responsive**: Design ottimizzato per desktop e mobile
- **Interazioni avanzate**: Drag & drop, resize, gestione z-index

## Utilizzo

1. Apri `index.html` nel browser
2. Clicca su un'immagine per aprire il progetto
3. Su desktop: vengono aperti popup multipli sovrapposti
4. Su mobile: le immagini si aprono in overlay mantenendo visibile la lista

## Tecnologie

- HTML5
- CSS3
- JavaScript vanilla

## Note

- Tutti i file immagine sono stati rinominati per rimuovere spazi e caratteri speciali
- I percorsi sono relativi e funzionano correttamente su GitHub Pages
- Le immagini di copertina sono in `assets/cover/`
- Le immagini dei progetti sono organizzate per cartella numerata

