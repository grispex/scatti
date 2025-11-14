// Elementi DOM
const grid = document.querySelector('.projects-grid');
const popup = document.getElementById('imagePopup');
const popupImage = popup.querySelector('.popup-image');
const popupContent = popup.querySelector('.popup-content');
const nameElement = document.querySelector('.name');
const streetNameElement = document.getElementById('streetName');

// Crea l'overlay
const overlay = document.createElement('div');
overlay.className = 'popup-overlay';
document.body.appendChild(overlay);

// Costanti di configurazione
const maxMove = 400;
const sensitivity = 0.25;

// Variabili di stato
let ticking = false;
let lastKnownMouseX = 0;
let lastKnownMouseY = 0;
let originalAspectRatio = 1;
let originalImageWidth = 0;
let originalImageHeight = 0;
let isResizing = false;
let currentResizeHandle = null;
let initialSize = { width: 0, height: 0 };
let initialPosition = { x: 0, y: 0 };
let isDragging = false;
let dragStartPosition = { x: 0, y: 0 };
let mouseDownOnPopup = false;
let currentPopupContent = null;
let topZIndex = 1000;
let popupStack = [];
let isMultiPopupMode = false;

// Configurazione griglia
const config = {
    columns: 6,
    rows: 4,
    boxSize: 350,
    minBoxSize: 260,
    maxBoxSize: 300,
    minColumns: 6,
    maxColumns: 14,
    lastPinchDistance: 0,
    isAnimating: false,
    minVisibleBoxes: 9,
    userChangedSize: false
};

// Gestione Z-Index e Popup
function bringToFront(popup) {
    const index = popupStack.indexOf(popup);
    if (index !== -1) {
        // Rimuovi il popup dalla sua posizione attuale
        popupStack.splice(index, 1);
        
        // Inseriscilo in cima allo stack
        popupStack.push(popup);
        
        // Aggiorna gli z-index di tutti i popup
        const baseZIndex = 1000;
        const increment = 10;
        
        // Applica solo il z-index a tutti i popup
        popupStack.forEach((p, i) => {
            const content = p.querySelector('.popup-content');
            if (content) {
                p.style.zIndex = baseZIndex + (i * increment);
                content.style.transform = 'scale(1)';
                content.style.opacity = '1';
            }
        });
    }
}

// Gestione del ridimensionamento
function initResize(e, handle, targetPopupContent) {
    isResizing = true;
    currentResizeHandle = handle;
    currentPopupContent = targetPopupContent;
    
    initialPosition = {
        x: e.clientX,
        y: e.clientY
    };
    
    const rect = targetPopupContent.getBoundingClientRect();
    initialSize = {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom
    };
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    e.preventDefault();
}

function handleResize(e) {
    if (!isResizing || !currentPopupContent) return;
    
    requestAnimationFrame(() => {
        const moveX = e.clientX - initialPosition.x;
        const moveY = e.clientY - initialPosition.y;
        
        const maxScreenWidth = window.innerWidth * 0.75;
        const maxScreenHeight = window.innerHeight * 0.75;
        const minScreenWidth = window.innerWidth * 0.25;
        const minScreenHeight = window.innerHeight * 0.25;
        
        let newWidth, newHeight, newLeft, newTop;
        
        // Calcola le nuove dimensioni mantenendo l'aspect ratio
        if (currentResizeHandle.includes('right')) {
            newWidth = Math.max(minScreenWidth, Math.min(maxScreenWidth, initialSize.width + moveX));
            newHeight = newWidth / originalAspectRatio;
            newLeft = initialSize.left;
        } else if (currentResizeHandle.includes('left')) {
            newWidth = Math.max(minScreenWidth, Math.min(maxScreenWidth, initialSize.width - moveX));
            newHeight = newWidth / originalAspectRatio;
            newLeft = initialSize.right - newWidth;
        }
        
        // Aggiusta l'altezza se supera i limiti dello schermo
        if (newHeight > maxScreenHeight) {
            newHeight = maxScreenHeight;
            newWidth = newHeight * originalAspectRatio;
            if (currentResizeHandle.includes('left')) {
                newLeft = initialSize.right - newWidth;
            }
        }
        
        // Calcola la posizione verticale
        if (currentResizeHandle.includes('top')) {
            newTop = initialSize.bottom - newHeight;
        } else {
            newTop = initialSize.top;
        }
        
        // Applica le nuove dimensioni e posizione
        if (newWidth >= minScreenWidth && newWidth <= maxScreenWidth &&
            newHeight >= minScreenHeight && newHeight <= maxScreenHeight) {
            const maxLeft = window.innerWidth - newWidth;
            const maxTop = window.innerHeight - newHeight;
            
            currentPopupContent.style.width = `${newWidth}px`;
            currentPopupContent.style.height = `${newHeight}px`;
            currentPopupContent.style.left = `${Math.max(0, Math.min(maxLeft, newLeft))}px`;
            currentPopupContent.style.top = `${Math.max(0, Math.min(maxTop, newTop))}px`;
        }
    });
}

function stopResize() {
    isResizing = false;
    currentResizeHandle = null;
    currentPopupContent = null;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
}

// Gestione Popup
function getRandomPosition(width, height) {
    const marginX = window.innerWidth * 0.1;
    const marginY = window.innerHeight * 0.1;
    
    const safeX = window.innerWidth - width - (marginX * 2);
    const safeY = window.innerHeight - height - (marginY * 2);
    
    return {
        left: Math.random() * safeX + marginX,
        top: Math.random() * safeY + marginY
    };
}

function createPopup(imgSrc) {
    showOverlay();
    const newPopup = document.createElement('div');
    newPopup.className = 'popup-container';
    newPopup.style.display = 'flex';
    
    const content = document.createElement('div');
    content.className = 'popup-content';
    
    // Imposta le proprietà iniziali
    content.style.transform = 'scale(0.95)';
    content.style.opacity = '0.8';
    
    const handleTemplate = document.createElement('div');
    ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(position => {
        const handle = handleTemplate.cloneNode();
        handle.className = `resize-handle ${position}`;
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            const targetPopup = handle.closest('.popup-container');
            bringToFront(targetPopup);
            const handleClass = position;
            initResize(e, handleClass, content);
        }, { passive: false });
        content.appendChild(handle);
    });
    
    const img = document.createElement('img');
    img.className = 'popup-image';
    img.src = imgSrc;
    img.alt = 'Immagine ingrandita';
    
    // Imposta l'aspect ratio iniziale quando l'immagine è caricata
    img.onload = () => {
        originalAspectRatio = img.naturalWidth / img.naturalHeight;
        
        // Calcola una dimensione casuale tra 40% e 60% dello schermo
        const randomPercentage = 40 + Math.random() * 20;
        const maxWidth = window.innerWidth * (randomPercentage / 100);
        const maxHeight = window.innerHeight * (randomPercentage / 100);
        
        let width = maxWidth;
        let height = width / originalAspectRatio;
        
        if (height > maxHeight) {
            height = maxHeight;
            width = height * originalAspectRatio;
        }
        
        content.style.width = `${width}px`;
        content.style.height = `${height}px`;
        
        const pos = getRandomPosition(width, height);
        content.style.left = `${pos.left}px`;
        content.style.top = `${pos.top}px`;
        
        // Aggiungi il popup allo stack e imposta il z-index
        popupStack.push(newPopup);
        bringToFront(newPopup);
    };
    
    content.appendChild(img);
    
    // Gestione del click sul popup
    content.addEventListener('mousedown', (e) => {
        if (e.target === content || e.target === img) {
            e.stopPropagation();
            const parentPopup = content.closest('.popup-container');
            if (parentPopup) {
                bringToFront(parentPopup);
            }
            initDrag(e, content);
        }
    }, { passive: false });
    
    img.addEventListener('dragstart', (e) => e.preventDefault(), { passive: false });
    
    // Gestione del click fuori dal popup
    newPopup.addEventListener('mousedown', (e) => {
        const rect = content.getBoundingClientRect();
        const isOutside = e.clientX < rect.left || e.clientX > rect.right ||
                        e.clientY < rect.top || e.clientY > rect.bottom;
        
        if (!isOutside) {
            e.stopPropagation();
            bringToFront(newPopup);
            if (!isDragging && !isResizing) {
                initDrag(e, content);
            }
        }
        mouseDownOnPopup = !isOutside;
    }, { passive: false });
    
    // Gestione della chiusura del popup
    document.addEventListener('mousedown', (e) => {
        const rect = content.getBoundingClientRect();
        const isOutside = e.clientX < rect.left || e.clientX > rect.right ||
                        e.clientY < rect.top || e.clientY > rect.bottom;
        
        if (isOutside && !isClickInsideAnyPopup(e)) {
            const index = popupStack.indexOf(newPopup);
            if (index !== -1) {
                popupStack.splice(index, 1);
                newPopup.remove();
                isMultiPopupMode = popupStack.length > 1;
            }
        }
    });
    
    newPopup.appendChild(content);
    document.body.appendChild(newPopup);
    
    // Dopo aver aggiunto il popup al DOM, abilita le transizioni
    requestAnimationFrame(() => {
        content.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    });
}

// Gestione del trascinamento
function initDrag(e, targetPopupContent) {
    if (!targetPopupContent) return;
    
    isDragging = true;
    currentPopupContent = targetPopupContent;
    dragStartPosition = {
        x: e.clientX - targetPopupContent.offsetLeft,
        y: e.clientY - targetPopupContent.offsetTop
    };
    
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
    e.preventDefault();
}

function handleDrag(e) {
    if (!isDragging || !currentPopupContent) return;
    
    const width = currentPopupContent.offsetWidth;
    const height = currentPopupContent.offsetHeight;
    
    requestAnimationFrame(() => {
        const newX = e.clientX - dragStartPosition.x;
        const newY = e.clientY - dragStartPosition.y;
        
        const maxX = window.innerWidth - width;
        const maxY = window.innerHeight - height;
        
        currentPopupContent.style.left = `${Math.max(0, Math.min(maxX, newX))}px`;
        currentPopupContent.style.top = `${Math.max(0, Math.min(maxY, newY))}px`;
    });
}

function stopDrag() {
    isDragging = false;
    currentPopupContent = null;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
}

// Funzioni di utilità
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

function updateGridProperties() {
    const root = document.documentElement;
    root.style.setProperty('--columns', config.columns);
    root.style.setProperty('--rows', config.rows);
    root.style.setProperty('--box-size', `${config.boxSize}px`);

    // Rimuovi eventuali transizioni per un aggiornamento netto
    grid.style.transition = 'none'; // Assicurati che non ci siano transizioni
}

function countVisibleBoxes() {
    const { innerWidth: width, innerHeight: height } = window;
    const { boxSize } = config;
    
    const boxesPerRow = (width / boxSize) | 0;
    const boxesPerColumn = (height / boxSize) | 0;
    
    return boxesPerRow * boxesPerColumn;
}

function canUsePinch() {
    const visibleBoxes = countVisibleBoxes();
    const totalBoxes = config.columns * config.rows;
    const allBoxesVisible = visibleBoxes >= totalBoxes;
    return visibleBoxes >= config.minVisibleBoxes && !allBoxesVisible;
}

function resizeGridToFitWindow() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calcola la dimensione del box in base alle proporzioni della finestra
    // Considera il gap e il padding nella griglia
    const gap = 3.2; // gap è 0.2rem
    const padding = 19.2; // padding è 1.2rem
    
    // Calcola la dimensione disponibile (considerando gap e padding)
    const availableWidth = windowWidth - (padding * 2);
    const availableHeight = windowHeight - (padding * 2);
    
    // Calcola le dimensioni ottimali per riga e colonna
    const boxWidth = (availableWidth - (gap * (config.columns - 1))) / config.columns;
    const boxHeight = (availableHeight - (gap * (config.rows - 1))) / config.rows;
    
    // Usa la dimensione minore tra larghezza e altezza per mantenere i box quadrati
    let newBoxSize = Math.min(boxWidth, boxHeight);
    
    // Limita tra min e max
    newBoxSize = Math.max(150, Math.min(500, newBoxSize));
    
    config.boxSize = newBoxSize;
    updateGridProperties();
    grid.style.transform = 'translate3d(0, 0, 0) scale(1)';
    
    // Gestisci la visibilità di grispex
    if (config.boxSize < 280) {
        nameElement.style.display = 'none';
    } else {
        nameElement.style.display = 'block';
    }
}

function updatePosition() {
    // Disabilita il movimento della griglia su mobile
    if (isMobile()) return;
    
    if (!ticking) {
        requestAnimationFrame(() => {
            const rect = grid.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            // Calcola dove dovrebbe essere il bordo della griglia per essere visibile
            // Se la griglia è più grande della finestra, calcoliamo il movimento necessario
            // per mostrare completamente i box più esterni
            
            // Calcola quanto la griglia si estende oltre i bordi dello schermo
            const overflowLeft = Math.max(0, -rect.left);
            const overflowRight = Math.max(0, rect.right - windowWidth);
            const overflowTop = Math.max(0, -rect.top);
            const overflowBottom = Math.max(0, rect.bottom - windowHeight);
            
            // Il movimento massimo orizzontale permette di spostare la griglia
            // così che entrambi i bordi possano essere visti
            const maxHorizontalMove = Math.max(overflowLeft, overflowRight);
            const maxVerticalMove = Math.max(overflowTop, overflowBottom);
            
            const centerX = rect.left + (rect.width * 0.5);
            const centerY = rect.top + (rect.height * 0.5);
            
            const mouseX = (lastKnownMouseX - centerX) * -sensitivity;
            const mouseY = (lastKnownMouseY - centerY) * -sensitivity;
            
            const moveX = Math.max(Math.min(mouseX, maxHorizontalMove), -maxHorizontalMove);
            const moveY = Math.max(Math.min(mouseY, maxVerticalMove), -maxVerticalMove);
            
            const scale = 1 + Math.max(
                Math.abs(moveX),
                Math.abs(mouseY)
            ) / (maxMove * 15);
            
            grid.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) scale(${scale})`;
            ticking = false;
        });
    }
    ticking = true;
}

function handlePinch(e) {
    e.preventDefault();
    
    if (!canUsePinch() || config.isAnimating) return;
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    
    if (!touch1 || !touch2) return;
    
    const deltaX = touch2.clientX - touch1.clientX;
    const deltaY = touch2.clientY - touch1.clientY;
    const distance = Math.hypot(deltaX, deltaY);
    
    if (config.lastPinchDistance) {
        const delta = distance - config.lastPinchDistance;
        const threshold = 10;
        
        if (Math.abs(delta) > threshold) {
            const isZoomingIn = delta < 0;
            const columnDelta = isZoomingIn ? 2 : -2;
            const newColumns = Math.max(
                config.minColumns,
                Math.min(config.maxColumns, config.columns + columnDelta)
            );
            
            if (newColumns !== config.columns) {
                config.isAnimating = true;
                config.columns = newColumns;
                config.boxSize = Math.floor(window.innerWidth / (newColumns + 2));
                
                requestAnimationFrame(() => {
                    updateGridProperties();
                    setTimeout(() => {
                        config.isAnimating = false;
                    }, 300);
                });
            }
        }
    }
    
    config.lastPinchDistance = distance;
}

function openPopup(imgSrc, clickEvent) {
    showOverlay();
    const rect = clickEvent.target.getBoundingClientRect();
    popup.style.display = 'flex';
    popupImage.src = imgSrc;
    currentPopupContent = popupContent;
    
    const img = new Image();
    img.onload = () => {
        originalAspectRatio = img.width / img.height;
        originalImageWidth = img.width;
        originalImageHeight = img.height;
        
        const maxScreenWidth = window.innerWidth * 0.75;
        const maxScreenHeight = window.innerHeight * 0.75;
        
        let width = maxScreenWidth;
        let height = width / originalAspectRatio;
        
        if (height > maxScreenHeight) {
            height = maxScreenHeight;
            width = height * originalAspectRatio;
        }
        
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        
        requestAnimationFrame(() => {
            popupContent.style.width = `${width}px`;
            popupContent.style.height = `${height}px`;
            popupContent.style.left = `${left}px`;
            popupContent.style.top = `${top}px`;
            bringToFront(popup);
        });
    };
    img.src = imgSrc;
}

function closePopup() {
    const index = popupStack.indexOf(popup);
    if (index !== -1) {
        popupStack.splice(index, 1);
    }
    popup.style.display = 'none';
    popupImage.src = '';
    
    // Nascondi "street_b/w"
    if (popupStack.length === 0) {
        console.log("Nascondo street_b/w");
        streetNameElement.classList.remove('visible'); // Nascondi street_b/w
        
        // Mostra grispex solo se i box sono grandi (>= 280px)
        if (config.boxSize >= 280) {
            console.log("Mostro grispex");
            nameElement.style.display = 'block'; // Mostra grispex
        }
    }
}

// Funzione per verificare se il click è all'interno di qualsiasi popup
function isClickInsideAnyPopup(e) {
    return popupStack.some(popup => {
        const content = popup.querySelector('.popup-content');
        const rect = content.getBoundingClientRect();
        return e.clientX >= rect.left && e.clientX <= rect.right &&
               e.clientY >= rect.top && e.clientY <= rect.bottom;
    });
}

// Mappatura delle immagini disponibili per ogni cartella numerata
const folderImages = {
    2: [
        'assets/2/DSC01743.jpeg'
    ],
    3: [
        'assets/3/DSC_2881.jpeg',
        'assets/3/DSC_2954.jpeg'
    ],
    5: [
        'assets/5/17_00199.jpeg',
        'assets/5/35_00217.jpeg',
        'assets/5/11A_00194.jpeg'
    ],
    8: [
        'assets/8/13_02107.jpeg'
    ],
    9: [
        'assets/9/01255.jpeg',
        'assets/9/01262.jpeg',
        'assets/9/01272.jpeg'
    ],
    10: [
        'assets/10/000010800004.jpeg',
        'assets/10/000010800007.jpeg'
    ],
    11: [
        'assets/11/8_00191.jpeg',
        'assets/11/31_00213.jpeg',
        'assets/11/6A_00190.jpeg'
    ],
    12: [
        'assets/12/11_01454.jpeg'
    ],
    13: [
        'assets/13/01256.jpeg',
        'assets/13/01260.jpeg'
    ],
    16: [
        'assets/16/4_01461.jpeg',
        'assets/16/25_01440.jpeg'
    ],
    17: [
        'assets/17/4_00137.jpeg',
        'assets/17/5_00138.jpeg',
        'assets/17/7_00140.jpeg'
    ],
    18: [
        'assets/18/SDC10013.jpeg',
        'assets/18/SDC10036.jpeg',
        'assets/18/SDC10043.jpeg'
    ],
    20: [
        'assets/20/14_02108.jpeg',
        'assets/20/15A_02110.jpeg'
    ],
    21: [
        'assets/21/100_3129.jpeg',
        'assets/21/100_3130.jpeg',
        'assets/21/100_3155.jpeg'
    ],
    22: [
        'assets/22/5A_00896-2.jpeg',
        'assets/22/8A_00899.jpeg',
        'assets/22/14A_00905.jpeg',
        'assets/22/16A_00907.jpeg'
    ],
    23: [
        'assets/23/26A_00916-2.jpeg'
    ]
};

// Funzione per estrarre il numero del box dal percorso dell'immagine
function getBoxNumber(imgSrc) {
    // Estrae il numero dal percorso, es. "assets/cover/8.jpeg" -> 8
    const match = imgSrc.match(/assets\/cover\/(\d+)\.jpeg/);
    return match ? parseInt(match[1], 10) : null;
}

// Funzione aggiornata per ottenere tutte le immagini da caricare per un box
function getImagesForBox(imgSrc) {
    const boxNumber = getBoxNumber(imgSrc);
    // Sempre prima la copertina assets/cover/X.jpeg
    let images = [imgSrc];
    // Se esiste una cartella per questo box, aggiungi le immagini della cartella
    if (boxNumber && folderImages[boxNumber]) {
        images = [imgSrc, ...folderImages[boxNumber]];
    }
    return images;
}

// Funzione per rilevare se siamo su mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Variabili per il carosello mobile
let mobilePopupWrapper = null;
let mobilePopupCarousel = null;

// Funzione per creare il carosello mobile
function createMobilePopupCarousel(images) {
    // Rimuovi carosello esistente se presente
    if (mobilePopupWrapper) {
        closeMobilePopupCarousel();
    }
    
    // Crea il wrapper
    mobilePopupWrapper = document.createElement('div');
    mobilePopupWrapper.className = 'mobile-popup-wrapper active';
    
    // Crea l'overlay oscurato
    const overlay = document.createElement('div');
    overlay.className = 'mobile-popup-overlay';
    overlay.addEventListener('click', (e) => {
        // Chiudi solo se si clicca sull'overlay, non sul carosello
        if (e.target === overlay) {
            closeMobilePopupCarousel();
        }
    });
    mobilePopupWrapper.appendChild(overlay);
    
    // Crea il carosello
    mobilePopupCarousel = document.createElement('div');
    mobilePopupCarousel.className = 'mobile-popup-carousel';
    
    // Previeni la chiusura quando si tocca il carosello
    mobilePopupCarousel.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    }, { passive: true });
    mobilePopupCarousel.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Aggiungi le immagini al carosello
    images.forEach((imgSrc, index) => {
        const item = document.createElement('div');
        item.className = 'mobile-popup-item';
        
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = `Immagine ${index + 1}`;
        
        item.appendChild(img);
        mobilePopupCarousel.appendChild(item);
    });
    
    mobilePopupWrapper.appendChild(mobilePopupCarousel);
    document.body.appendChild(mobilePopupWrapper);
    
    // Previeni lo scroll del body quando il carosello è aperto
    document.body.style.overflow = 'hidden';
    
    // Nascondi grispex e mostra street_b/w
    nameElement.style.display = 'none';
    streetNameElement.classList.add('visible');
}

// Funzione per chiudere il carosello mobile
function closeMobilePopupCarousel() {
    if (mobilePopupWrapper) {
        mobilePopupWrapper.remove();
        mobilePopupWrapper = null;
        mobilePopupCarousel = null;
        
        // Ripristina lo scroll del body
        document.body.style.overflow = '';
        
        // Nascondi street_b/w e mostra grispex
        streetNameElement.classList.remove('visible');
        nameElement.style.display = 'block';
    }
}

// Event Listeners
document.querySelectorAll('.project').forEach((project, index) => {
    project.addEventListener('click', (e) => {
        const img = project.querySelector('img');
        
        // Ottieni tutte le immagini per questo box (dalla cartella se esiste, altrimenti solo l'immagine del box)
        const images = getImagesForBox(img.src);
        
        // Su mobile usa il carosello, su desktop usa i popup
        if (isMobile()) {
            createMobilePopupCarousel(images);
        } else {
            // Crea i popup solo se non esistono già
            if (popupStack.length === 0) {
                images.forEach(imgSrc => {
                    createPopup(imgSrc);
                });
                isMultiPopupMode = true;

                // Nascondi "grispex" e mostra "street_b/w"
                console.log("Nascondo grispex");
                nameElement.style.display = 'none'; // Nascondi grispex
                streetNameElement.classList.add('visible'); // Mostra street_b/w
            } else {
                // Usa createPopup invece di openPopup per uniformare il comportamento
                if (popupStack.indexOf(popup) === -1) {
                    images.forEach(imgSrc => {
                        createPopup(imgSrc);
                    });
                }
            }
        }
        e.stopPropagation();
    });
});

// Rimuovo il vecchio event listener del popup singolo e aggiungo quello nuovo
document.addEventListener('mousedown', (e) => {
    if (!isClickInsideAnyPopup(e) && e.target !== overlay) {
        closeAllPopups();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (isMobile() && mobilePopupWrapper) {
            closeMobilePopupCarousel();
        } else {
            closeAllPopups();
        }
    }
});

document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

const throttledPinch = throttle(handlePinch, 16);

document.addEventListener('mousemove', (e) => {
    // Disabilita il movimento della griglia su mobile
    if (isMobile()) return;
    
    lastKnownMouseX = e.clientX;
    lastKnownMouseY = e.clientY;
    updatePosition();
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    // Disabilita il pinch zoom su mobile
    if (isMobile()) return;
    
    if (e.touches.length === 2) {
        throttledPinch(e);
    }
}, { passive: false });

document.addEventListener('touchend', () => {
    config.lastPinchDistance = 0;
}, { passive: true });

let timeout;
document.addEventListener('mouseleave', () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
        grid.style.transform = 'translate3d(0, 0, 0) scale(1)';
    }, 300);
}, { passive: true });

document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
}, { passive: false });

// Ottimizzazione caricamento immagini
document.querySelectorAll('.project img').forEach(img => {
    img.loading = 'lazy';
    img.decoding = 'async';
});

// Inizializzazione
updateGridProperties();

// Aggiungi gli event listener per il popup singolo
document.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const handleClass = Array.from(handle.classList)
            .find(className => className !== 'resize-handle');
        const targetPopup = handle.closest('.popup-container');
        bringToFront(targetPopup);
        initResize(e, handleClass, targetPopup.querySelector('.popup-content'));
    }, { passive: false });
});

popupContent.addEventListener('mousedown', (e) => {
    if (e.target === popupContent || e.target === popupImage) {
        e.stopPropagation();
        bringToFront(popup);
        initDrag(e, popupContent);
    }
}, { passive: false });

// Gestione dell'overlay
function showOverlay() {
    overlay.style.display = 'block';
}

function hideOverlay() {
    overlay.style.display = 'none';
}

// Chiudi tutti i popup
function closeAllPopups() {
    while (popupStack.length > 0) {
        const p = popupStack.pop();
        p.remove();
    }
    
    // Nascondi street_b/w
    streetNameElement.classList.remove('visible');
    
    // Mostra grispex solo se i box sono grandi (>= 280px)
    if (config.boxSize >= 280) {
        nameElement.style.display = 'block';
    }
    
    closePopup(); // Chiama closePopup per gestire la visibilità di grispex
    hideOverlay();
    isMultiPopupMode = false;
}

// Aggiungi l'event listener per l'overlay
overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
        closeAllPopups();
    }
});

// Gestione click sul titolo - disabilitata
// nameElement.addEventListener('click', (e) => {
//     e.preventDefault();
//     window.location.href = './about.html';
// });

// Aggiungi l'event listener per il mouse wheel
document.addEventListener('wheel', (e) => {
    e.preventDefault(); // Previeni il comportamento di default dello scroll

    const delta = Math.sign(e.deltaY); // Determina la direzione dello scroll
    let newBoxSize;

    if (delta < 0) { // Scroll verso il basso
        newBoxSize = config.boxSize * 1.5; // Aumenta la dimensione del 50%
    } else { // Scroll verso l'alto
        newBoxSize = config.boxSize / 1.5; // Riduci la dimensione
    }

    // Limita la dimensione della griglia
    if (newBoxSize >= 150 && newBoxSize <= 500) { // Limita la dimensione tra 150px e 500px
        config.boxSize = newBoxSize;
        config.userChangedSize = true; // Indica che l'utente ha modificato la dimensione manualmente
        updateGridProperties(); // Aggiorna le proprietà della griglia
        
        // Resetta la posizione della griglia per evitare problemi di visualizzazione
        grid.style.transform = 'translate3d(0, 0, 0) scale(1)';
        
        // Nascondi/mostra "grispex" in base alla dimensione dei box
        if (newBoxSize < 280) {
            nameElement.style.display = 'none';
        } else {
            nameElement.style.display = 'block';
        }
    }
});

// Gestione resize della finestra
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Riadatta solo se l'utente non ha modificato manualmente la dimensione
        if (!config.userChangedSize) {
            resizeGridToFitWindow();
        }
    }, 150); // Debounce per evitare troppi aggiornamenti
});

