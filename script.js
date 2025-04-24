fetch('./item_containers.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json(); // Parse JSON
  })
  .then(data => {
    console.log(data); 
    const item_containers = data;
  })
  .catch(error => console.error('Error fetching JSON:', error));


let items_left = [];
var current_container_name;
let results = [];
const mainButtonElement = document.getElementById('next_stop_button');
const itemElement = document.getElementById('item');
let current_item = undefined;
// TIMIER NEW
let timer_time = 0;
let intervalId = null;
let timer_running = false;

function startTimer() {
  document.querySelector('.item-container').classList.add('timer-active');
  timer_running = true;
  timer_time = 0;
  let startTime = Date.now();
  intervalId = setInterval(() => {
    timer_time = (Date.now() - startTime) / 1000;
    updateTimerDisplay();
  }, 10); // update every 10ms
}

function stopTimer() {  
  document.querySelector('.item-container').classList.remove('timer-active');
  if (timer_running) {
    timer_running = false;
    clearInterval(intervalId);
    intervalId = null;
  }
}

function resetTimer() {
  stopTimer();
  timer_time = 0;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  let timerElement = document.getElementById('timer');
  timerElement.textContent = `Zeit: ${timer_time.toFixed(2)}s`;
}

// NAV OVERLAY
function showNav() {
  document.querySelector('.nav-icon').classList.add('active');
  const navOverlay = document.querySelector('.nav-overlay');
  navOverlay.classList.add('show');
  navOverlay.style.animation = 'slideIn 0.5s forwards';
}

function hideNav() {
  const navOverlay = document.querySelector('.nav-overlay');
  if (navOverlay.classList.contains('show')) {
    document.querySelector('.nav-icon').classList.remove('active');
    navOverlay.classList.remove('show');
    navOverlay.style.animation = 'slideOut 0.5s forwards';
  }
}

function toggleNav() {
  const navOverlay = document.querySelector('.nav-overlay');

  if (navOverlay.classList.contains('show')) {
    hideNav();
  } else {
    showNav();
  }
}

const navOverlay = document.querySelector('.nav-overlay');

let navOverlayButtons = [];

function loadNavOverlay() {
  Object.keys(item_containers).forEach(key => {
    const button = document.createElement('button');
    button.id = key;
    button.textContent = item_containers[key]['meta']['display_name'];
    button.onclick = function () {
      startNewRound(this.id);
    };
    navOverlayButtons.push(button); // store the buttons in an array
    navOverlay.appendChild(button);
  });

  updateHighlighting(); // call the updateHighlighting function initially to set the highlighting
}

function updateHighlighting() {
  // remove the highlighted class from all buttons
  navOverlayButtons.forEach(button => {
    button.classList.remove('highlighted');
  });

  // add the highlighted class to the button with the matching id
  const highlightedButton = document.getElementById(current_container_name);
  if (highlightedButton) {
    highlightedButton.classList.add('highlighted');
  }
}

function startNewRound(container_name) {
  hideLocationHint();
  loadContainer(container_name);
  updateProgressBar();
  mainButtonElement.innerHTML = `Neue Runde mit <b>${item_containers[container_name]['meta']['display_name']}</b> starten!</br>Alternativ oben rechts bei ☰ einen andern Ort beüben.`;
  itemElement.innerHTML = 'Hier wird der gesuchte Gegenstand angezeigt.';
  updateHighlighting();
  hideNav();
  resetTimer();
  
}

function loadContainer(container_name) {
  items_left = shuffleList(item_containers[container_name]['items']);
  current_container_name = container_name;
  current_item = undefined;
  results = [];
}

function shuffleList(list) {
  // Create a copy of the original list to avoid modifying it
  const shuffledList = [...list];
  // Use the Fisher-Yates shuffle algorithm to shuffle the list
  for (let i = shuffledList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledList[i], shuffledList[j]] = [shuffledList[j], shuffledList[i]];
  }
  return shuffledList;
}

// RESULT MODAL

function showResultModal(results) {
  fillGeneralResults(results);
  fillResultTable(results);
  document.getElementById('result-modal').classList.add('show');
  document.body.classList.add('overlay-open');
}

function fillGeneralResults(results) {
  total_time = Math.floor(results.reduce((acc, obj) => acc + obj.time, 0));
  const minutes = Math.floor(total_time / 60);
  const remainingSeconds = total_time % 60;
  const timeString = `Gesmmtdauer <b>${minutes}:${remainingSeconds.toString().padStart(2, '0')}</b> Minuten`;
  const generalResultsElement = document.getElementById('general-results');
  generalResultsElement.innerHTML = timeString;
}

function fillResultTable(data) {
  data = sortByTimeDescAndHintNeeded(data);
  const tableElement = document.getElementById('result-table');
  tableElement.innerHTML = '';
  const headers = ['Zeit', 'Gegenstand', 'Hinweis Benötigt'];
  const rows = [];
  // Create table headers
  const headerRow = document.createElement('tr');
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  tableElement.appendChild(headerRow);
  // Create table rows
  data.forEach(item => {
    const row = document.createElement('tr');
    if (item.hint_needed) {
      row.style.backgroundColor = '#8B0A1A'; // dark red shade
    }
    row.innerHTML = `
      <td>${item.time.toFixed(2)}</td>
      <td>${item.itemName}</td>
      <td>${item.hint_needed ? 'Ja' : 'Nein'}</td>
    `;
    tableElement.appendChild(row);
  });
}

function sortByTimeDescAndHintNeeded(results) {
  return results.sort((a, b) => {
    if (a.hint_needed !== b.hint_needed) {
      return a.hint_needed ? -1 : 1;
    } else {
      return b.time - a.time;
    }
  });
}

function closeResultModal() {
  document.getElementById('result-modal').classList.remove('show');
  document.body.classList.remove('overlay-open');
  startNewRound(current_container_name)
}

document.querySelector('.close-btn').addEventListener('click', closeResultModal);

//Main button
function mainButtonClicked() {
  if (!timer_running) {
    showNewItem();
  } else {
    handleItemFound();
  }
}

function showNewItem() {
  hideLocationHint();
  current_item = items_left.pop();
  current_item.hint_needed = false;
  const itemElement = document.getElementById('item');
  itemElement.innerHTML = current_item.name
  const locationHintElement = document.getElementById('location-hint');
  if(!current_item.location){
    current_item.location = "? nicht Eingetragen ?"
  }
  locationHintElement.innerHTML = current_item.location;
  mainButtonElement.innerHTML = 'Gefunden!';
  startTimer();
}

function handleItemFound() {
  stopTimer();
  updateProgressBar();
  saveResult()
  mainButtonElement.innerHTML = 'Nächster Gegenstand';
  if (items_left.length === 0) {
    showResultModal(results);
  }
}

function saveResult(){
  const currentItemResult = {
    itemName: current_item.name,
    time: timer_time,
    hint_needed: current_item.hint_needed
  };
  results.push(currentItemResult);
}

function updateProgressBar() {
  const progressBarElement = document.getElementById('progress-bar');
  const progressTextElement = document.getElementById('progress-text');
  const items_done =
        item_containers[current_container_name]['items'].length - items_left.length;
  const progress =
        (items_done / item_containers[current_container_name]['items'].length) *
        100;
  progressBarElement.style.width = `${progress}%`;
  progressTextElement.textContent = `${items_done} von ${item_containers[current_container_name]['items'].length}`;
}

function showLocationHint() {
  if (timer_running) {
    current_item.hint_needed = true;
  }
  document.getElementById('location-hint').style.display = 'block';
}

function hideLocationHint() {
  document.getElementById('location-hint').style.display = 'none';
}

//initial load
startNewRound('RTW');
loadNavOverlay();

// testing: 
