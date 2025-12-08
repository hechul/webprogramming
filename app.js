// 상태 변수
const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
let selectedDateKey = null;
let currentSlideIndex = 0;

// 데이터 로드
let calendarData = loadData();
let memoData = localStorage.getItem("myMemo") || ""; 

// DOM Elements
const monthTitle = document.getElementById("monthTitle");
const calendarBody = document.getElementById("calendarBody");
const selectedDateText = document.getElementById("selectedDateText");
const selectedEmotionDisplay = document.getElementById("selectedEmotionDisplay");
const dailyDetails = document.getElementById("dailyDetails");

// Photo Elements
const photoSlider = document.getElementById("photoSlider");
const slideWrapper = document.getElementById("slideWrapper");
const prevSlideBtn = document.getElementById("prevSlide");
const nextSlideBtn = document.getElementById("nextSlide");
const slideIndicator = document.getElementById("slideIndicator");
const photoInput = document.getElementById("photoInput");
const deletePhotoBtn = document.getElementById("deletePhotoBtn");

// To-Do & Money Elements
const todoInput = document.getElementById("todoInput");
const todoEndDate = document.getElementById("todoEndDate");
const addTodoBtn = document.getElementById("addTodoBtn");
const todoList = document.getElementById("todoList");
const todoCount = document.getElementById("todoCount");

const moneyType = document.getElementById("moneyType");
const expenseTitle = document.getElementById("expenseTitle");
const expenseAmount = document.getElementById("expenseAmount");
const addExpenseBtn = document.getElementById("addExpenseBtn");
const expenseList = document.getElementById("expenseList");
const dailyTotal = document.getElementById("dailyTotal");

const freeMemo = document.getElementById("freeMemo");
const saveMemoBtn = document.getElementById("saveMemoBtn");
const emoBtns = document.querySelectorAll(".emo-btn");
const resetMoodBtn = document.getElementById("resetMoodBtn"); // 리셋 버튼
const elMonthIncome = document.getElementById("monthIncome");
const elMonthExpense = document.getElementById("monthExpense");
const elMonthBalance = document.getElementById("monthBalance");

// 초기 실행
init();

function init() {
  renderCalendar(currentYear, currentMonth);
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());
  selectDate(todayKey);
  freeMemo.value = memoData;
}

// 이벤트 리스너
document.getElementById("prevMonth").onclick = () => moveMonth(-1);
document.getElementById("nextMonth").onclick = () => moveMonth(1);
document.getElementById("goTodayBtn").onclick = () => {
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();
  renderCalendar(currentYear, currentMonth);
  selectDate(formatDateKey(currentYear, currentMonth + 1, today.getDate()));
};

todoInput.addEventListener("keypress", (e) => { if (e.key === "Enter") addTodoBtn.click(); });
expenseAmount.addEventListener("keypress", (e) => { if (e.key === "Enter") addExpenseBtn.click(); });
saveMemoBtn.onclick = () => { localStorage.setItem("myMemo", freeMemo.value); alert("메모가 저장되었습니다."); };

// 감정 저장
emoBtns.forEach(btn => {
  btn.onclick = () => {
    if (!selectedDateKey) return alert("날짜를 먼저 선택하세요!");
    initData(selectedDateKey);
    calendarData[selectedDateKey].emotion = btn.dataset.emoji;
    saveAndRefresh();
  };
});

// [NEW] 감정 초기화(삭제)
resetMoodBtn.onclick = () => {
  if (!selectedDateKey) return alert("날짜를 먼저 선택하세요!");
  if (calendarData[selectedDateKey]) {
    calendarData[selectedDateKey].emotion = null;
    saveAndRefresh(); // 달력과 상세화면 모두 갱신
  }
};

// 사진 업로드
photoInput.onchange = function() {
  if (!selectedDateKey) return alert("날짜를 먼저 선택하세요.");
  if (this.files && this.files.length > 0) {
    initData(selectedDateKey);
    Array.from(this.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = function(e) {
        calendarData[selectedDateKey].photos.push(e.target.result);
        saveAndRefresh(false);
        renderPhotoSlide(selectedDateKey);
      };
      reader.readAsDataURL(file);
    });
    this.value = "";
  }
};

// 사진 삭제
deletePhotoBtn.onclick = function() {
  if (!selectedDateKey) return;
  const data = calendarData[selectedDateKey];
  if (data && data.photos.length > 0) {
    if(confirm("현재 보고 있는 사진을 삭제하시겠습니까?")) {
      data.photos.splice(currentSlideIndex, 1);
      if (currentSlideIndex >= data.photos.length) currentSlideIndex = Math.max(0, data.photos.length - 1);
      saveAndRefresh(false);
      renderPhotoSlide(selectedDateKey);
    }
  }
};

// 슬라이드 네비게이션
prevSlideBtn.onclick = () => {
  if (!checkPhotos()) return;
  const photos = calendarData[selectedDateKey].photos;
  currentSlideIndex--;
  if (currentSlideIndex < 0) currentSlideIndex = photos.length - 1;
  updateSlideView(photos);
};
nextSlideBtn.onclick = () => {
  if (!checkPhotos()) return;
  const photos = calendarData[selectedDateKey].photos;
  currentSlideIndex++;
  if (currentSlideIndex >= photos.length) currentSlideIndex = 0;
  updateSlideView(photos);
};
function checkPhotos() {
  return (selectedDateKey && calendarData[selectedDateKey] && calendarData[selectedDateKey].photos.length > 0);
}

function moveMonth(step) {
  currentMonth += step;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  else if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar(currentYear, currentMonth);
}

// 달력 렌더링
function renderCalendar(year, month) {
  monthTitle.textContent = `${year}.${String(month + 1).padStart(2, '0')}`;
  calendarBody.innerHTML = "";
  updateMonthlySummary(year, month);

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  let date = 1;
  for (let week = 0; week < 6; week++) {
    const tr = document.createElement("tr");
    for (let day = 0; day < 7; day++) {
      const td = document.createElement("td");
      
      if ((week === 0 && day < firstDay) || date > lastDate) {
        td.style.backgroundColor = "#fafafa";
        td.style.pointerEvents = "none";
      } else {
        const dateKey = formatDateKey(year, month + 1, date);
        td.dataset.date = dateKey;

        const data = calendarData[dateKey];
        const emotion = (data && data.emotion) ? data.emotion : "";

        let html = `
          <div class="date-header">
            <span class="date-number">${date}</span>
            <span class="daily-emotion">${emotion}</span>
          </div>
          <div class="events-container">
        `;

        if (data && data.todos) {
          const maxShow = 4;
          data.todos.forEach((todo, idx) => {
            if (idx < maxShow) {
              // 연속성 판단
              const yesterdayDate = new Date(year, month, date - 1);
              const tomorrowDate = new Date(year, month, date + 1);
              const prevKey = formatDateKey(yesterdayDate.getFullYear(), yesterdayDate.getMonth() + 1, yesterdayDate.getDate());
              const nextKey = formatDateKey(tomorrowDate.getFullYear(), tomorrowDate.getMonth() + 1, tomorrowDate.getDate());

              const hasPrev = hasEventId(prevKey, todo.groupId);
              const hasNext = hasEventId(nextKey, todo.groupId);

              let classStr = "is-single";
              if (hasPrev && hasNext) classStr = "is-middle";
              else if (hasPrev && !hasNext) classStr = "is-end";
              else if (!hasPrev && hasNext) classStr = "is-start";

              html += `<div class="event-bar ${classStr}">${todo.text}</div>`;
            }
          });
          if (data.todos.length > maxShow) {
             html += `<div style="font-size:10px; color:#aaa; padding-left:6px;">+${data.todos.length - maxShow}</div>`;
          }
        }
        html += `</div>`; // events-container

        if (data && data.moneyLogs && data.moneyLogs.length > 0) {
          html += `<div class="money-dot-box">`;
          data.moneyLogs.forEach(log => {
             html += `<div class="money-dot ${log.type === 'income' ? 'inc' : 'exp'}"></div>`;
          });
          html += `</div>`;
        }

        td.innerHTML = html;
        if (selectedDateKey === dateKey) td.classList.add("selected");
        td.onclick = () => selectDate(dateKey);
        date++;
      }
      tr.appendChild(td);
    }
    calendarBody.appendChild(tr);
    if (date > lastDate) break;
  }
}

function hasEventId(dateKey, groupId) {
  if (!groupId) return false;
  const d = calendarData[dateKey];
  if (!d || !d.todos) return false;
  return d.todos.some(t => t.groupId === groupId);
}

function selectDate(key) {
  selectedDateKey = key;
  selectedDateText.textContent = key;
  todoEndDate.value = "";
  currentSlideIndex = 0;

  const data = calendarData[key];
  selectedEmotionDisplay.textContent = (data && data.emotion) ? data.emotion : "";

  document.querySelectorAll(".calendar td").forEach(td => {
    td.classList.remove("selected");
    if (td.dataset.date === key) td.classList.add("selected");
  });

  // 애니메이션 리셋 (클래스 뺐다 끼우기)
  dailyDetails.classList.remove("slide-up-anim");
  void dailyDetails.offsetWidth; // trigger reflow
  dailyDetails.classList.add("slide-up-anim");

  renderTodoList(key);
  renderMoneyList(key);
  renderPhotoSlide(key);
}

function renderPhotoSlide(key) {
  const data = calendarData[key];
  const photos = (data && data.photos) ? data.photos : [];

  if (photos.length === 0) {
    slideWrapper.innerHTML = `<p class="no-photo-text">등록된 사진이 없습니다.</p>`;
    slideIndicator.textContent = `0 / 0`;
    return;
  }
  updateSlideView(photos);
}

function updateSlideView(photos) {
  slideWrapper.innerHTML = `<img src="${photos[currentSlideIndex]}" alt="Photo Log">`;
  slideIndicator.textContent = `${currentSlideIndex + 1} / ${photos.length}`;
}

// 일정 추가 (ID 생성)
function addTodo() {
  if (!selectedDateKey) return alert("날짜 선택!");
  const txt = todoInput.value.trim();
  const endDateVal = todoEndDate.value;
  if (!txt) return;

  const groupId = Date.now().toString(); // 고유 그룹 ID

  if (!endDateVal || endDateVal === selectedDateKey) {
    saveTodo(selectedDateKey, txt, groupId);
  } else {
    const startDate = new Date(selectedDateKey);
    const endDate = new Date(endDateVal);
    if (endDate < startDate) return alert("날짜 오류");

    let curr = startDate;
    while (curr <= endDate) {
      const k = formatDateKey(curr.getFullYear(), curr.getMonth() + 1, curr.getDate());
      saveTodo(k, txt, groupId);
      curr.setDate(curr.getDate() + 1);
    }
    alert("일정이 등록되었습니다.");
  }
  todoInput.value = ""; todoEndDate.value = "";
  saveAndRefresh();
}

function saveTodo(key, text, groupId) {
  initData(key);
  calendarData[key].todos.push({ text: text, done: false, groupId: groupId });
}
addTodoBtn.onclick = addTodo;

function addMoney() {
  if (!selectedDateKey) return alert("날짜 선택!");
  const title = expenseTitle.value.trim();
  const amt = Number(expenseAmount.value);
  if (!title || amt <= 0) return;

  initData(selectedDateKey);
  calendarData[selectedDateKey].moneyLogs.push({ type: moneyType.value, title: title, amount: amt });
  expenseTitle.value = ""; expenseAmount.value = "";
  saveAndRefresh();
}
addExpenseBtn.onclick = addMoney;

// [핵심] 리스트 렌더링 & 삭제 로직 (일괄 삭제 기능)
function renderTodoList(key) {
  todoList.innerHTML = "";
  const todos = (calendarData[key] && calendarData[key].todos) || [];
  todoCount.textContent = todos.length;

  todos.forEach((todo, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${todo.text}</span> <button class="del-btn"><i class="fas fa-trash"></i></button>`;
    
    // 삭제 버튼 클릭 시
    li.querySelector(".del-btn").onclick = () => {
      // 그룹 ID가 있는지 확인 (연속 일정인지)
      if (todo.groupId) {
        const choice = confirm("연결된 일정입니다.\n[확인] 전체 삭제\n[취소] 이 일정만 삭제");
        if (choice) {
          // 전체 삭제: 모든 날짜를 뒤져서 같은 groupId 삭제
          deleteGroupEvent(todo.groupId);
        } else {
          // 단일 삭제
          todos.splice(idx, 1);
          saveAndRefresh();
        }
      } else {
        // 그냥 삭제
        if(confirm("일정을 삭제하시겠습니까?")) {
           todos.splice(idx, 1);
           saveAndRefresh();
        }
      }
    };
    todoList.appendChild(li);
  });
}

// 그룹 삭제 헬퍼 함수
function deleteGroupEvent(groupId) {
  Object.keys(calendarData).forEach(dateKey => {
    const data = calendarData[dateKey];
    if (data.todos) {
      // 해당 그룹 ID가 아닌 것만 남김 (필터링)
      const newTodos = data.todos.filter(t => t.groupId !== groupId);
      if (newTodos.length !== data.todos.length) {
        data.todos = newTodos;
      }
    }
  });
  saveAndRefresh();
}

function renderMoneyList(key) {
  expenseList.innerHTML = "";
  const logs = (calendarData[key] && calendarData[key].moneyLogs) || [];
  let sum = 0;
  logs.forEach((log, idx) => {
    const li = document.createElement("li");
    const sign = log.type === 'income' ? '+' : '-';
    li.innerHTML = `<span>${log.title}</span><div style="display:flex; gap:10px;"><span class="amt ${log.type === 'income'?'inc':'exp'}">${sign}${log.amount}</span><button class="del-btn"><i class="fas fa-trash"></i></button></div>`;
    
    li.querySelector(".del-btn").onclick = () => {
      logs.splice(idx, 1);
      saveAndRefresh();
    };
    expenseList.appendChild(li);
    if(log.type==='income') sum+=log.amount; else sum-=log.amount;
  });
  dailyTotal.textContent = `${sum.toLocaleString()}원`;
  dailyTotal.style.color = sum >= 0 ? "#2980b9" : "#e74c3c";
}

function updateMonthlySummary(year, month) {
  let inc = 0, exp = 0;
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  Object.keys(calendarData).forEach(k => {
    if (k.startsWith(prefix)) {
      (calendarData[k].moneyLogs || []).forEach(l => {
        if (l.type === 'income') inc += l.amount; else exp += l.amount;
      });
    }
  });
  elMonthIncome.textContent = inc.toLocaleString();
  elMonthExpense.textContent = exp.toLocaleString();
  elMonthBalance.textContent = (inc - exp).toLocaleString();
}

function initData(key) {
  if (!calendarData[key]) calendarData[key] = { todos: [], moneyLogs: [], photos: [] };
  if (!calendarData[key].photos) calendarData[key].photos = [];
}
function saveAndRefresh(redraw = true) {
  localStorage.setItem("myPlannerData", JSON.stringify(calendarData));
  if (redraw) renderCalendar(currentYear, currentMonth);
  renderTodoList(selectedDateKey);
  renderMoneyList(selectedDateKey);
}
function formatDateKey(y, m, d) { return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function loadData() { return JSON.parse(localStorage.getItem("myPlannerData") || "{}"); }