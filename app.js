const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
let selectedDateKey = null;

let calendarData = JSON.parse(localStorage.getItem("myPlannerData") || "{}");

const monthTitle = document.getElementById("monthTitle");
const calendarBody = document.getElementById("calendarBody");
const tooltip = document.getElementById("calendarTooltip");

// 초기화
init();

function init() {
  renderCalendar(currentYear, currentMonth);
  // 처음 실행 시 오늘 날짜 선택
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());
  selectDate(todayKey);
  
  document.getElementById("freeMemo").value = localStorage.getItem("myMemo") || "";
  setupMoodEvents();
}

// Today 버튼 클릭 이벤트
document.getElementById("goTodayBtn").onclick = () => {
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();
  const todayKey = formatDateKey(currentYear, currentMonth + 1, today.getDate());
  
  renderCalendar(currentYear, currentMonth); // 달력 이동
  selectDate(todayKey); // 오늘 날짜 선택 및 상세 정보 표시
};

// 달력 그리기
function renderCalendar(year, month) {
  monthTitle.textContent = `${year}.${String(month + 1).padStart(2, '0')}`;
  calendarBody.innerHTML = "";
  updateMonthlySummary(year, month);

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  let date = 1;
  for (let i = 0; i < 6; i++) {
    const tr = document.createElement("tr");
    for (let j = 0; j < 7; j++) {
      const td = document.createElement("td");
      if ((i === 0 && j < firstDay) || date > lastDate) {
        td.style.backgroundColor = "#fafafa";
      } else {
        const dateKey = formatDateKey(year, month + 1, date);
        td.dataset.date = dateKey;
        const data = calendarData[dateKey];
        const emoji = (data && data.emotion) ? data.emotion : "";

        let html = `
          <div class="date-header">
            <span class="date-number">${date}</span>
            <span class="daily-emotion">${emoji}</span>
          </div>
          <div class="events-container">
        `;

        // 연속 일정 바 로직
        if (data && data.todos) {
          data.todos.slice(0, 3).forEach(todo => {
            const yesterday = new Date(year, month, date - 1);
            const tomorrow = new Date(year, month, date + 1);
            const prevK = formatDateKey(yesterday.getFullYear(), yesterday.getMonth()+1, yesterday.getDate());
            const nextK = formatDateKey(tomorrow.getFullYear(), tomorrow.getMonth()+1, tomorrow.getDate());
            
            const hasPrev = hasEventId(prevK, todo.groupId);
            const hasNext = hasEventId(nextK, todo.groupId);

            let classStr = "is-single";
            if (hasPrev && hasNext) classStr = "is-middle";
            else if (hasPrev && !hasNext) classStr = "is-end";
            else if (!hasPrev && hasNext) classStr = "is-start";

            html += `<div class="event-bar ${classStr}">${todo.text}</div>`;
          });
        }
        html += `</div>`;
        
        // 지출/수입 도트 표시
        if (data && data.moneyLogs?.length > 0) {
          html += `<div class="money-dot-box">`;
          data.moneyLogs.forEach(l => html += `<div class="money-dot ${l.type==='income'?'inc':'exp'}"></div>`);
          html += `</div>`;
        }

        td.innerHTML = html;
        if (selectedDateKey === dateKey) td.classList.add("selected");
        td.onclick = () => selectDate(dateKey);
        td.onmouseenter = (e) => showTooltip(e, dateKey);
        td.onmousemove = (e) => moveTooltip(e);
        td.onmouseleave = () => hideTooltip();
        date++;
      }
      tr.appendChild(td);
    }
    calendarBody.appendChild(tr);
    if (date > lastDate) break;
  }
}

function hasEventId(key, gid) {
  return gid && calendarData[key] && calendarData[key].todos?.some(t => t.groupId === gid);
}

// 툴팁 (수입/지출 합계 표시)
function showTooltip(e, key) {
  const data = calendarData[key];
  if (!data) return;
  let html = `<div class="tooltip-title">${key}</div>`;
  if (data.todos) data.todos.slice(0, 5).forEach(t => html += `<div>• ${t.text}</div>`);
  
  let inc = 0, exp = 0;
  (data.moneyLogs || []).forEach(l => l.type === 'income' ? inc += l.amount : exp += l.amount);
  if (inc > 0 || exp > 0) {
    html += `<div class="tooltip-money">`;
    if (inc > 0) html += `<div style="color:#4dabf7">수입: +${inc.toLocaleString()}</div>`;
    if (exp > 0) html += `<div style="color:#ffeb3b">지출: -${exp.toLocaleString()}</div>`;
    html += `</div>`;
  }
  tooltip.innerHTML = html;
  tooltip.style.display = "block";
  moveTooltip(e);
}

function moveTooltip(e) {
  tooltip.style.left = (e.pageX + 15) + "px";
  tooltip.style.top = (e.pageY + 15) + "px";
}

function hideTooltip() { tooltip.style.display = "none"; }

// 기본 기능들
function selectDate(key) {
  selectedDateKey = key;
  document.getElementById("selectedDateText").textContent = key;
  document.querySelectorAll(".calendar td").forEach(td => {
    td.classList.remove("selected");
    if (td.dataset.date === key) td.classList.add("selected");
  });
  const data = calendarData[key];
  document.getElementById("selectedEmotionDisplay").textContent = data?.emotion || "";
  renderTodoList(key);
  renderMoneyList(key);
}

function setupMoodEvents() {
  document.querySelectorAll(".emo-btn").forEach(btn => {
    btn.onclick = () => {
      if (!selectedDateKey) return;
      initData(selectedDateKey);
      calendarData[selectedDateKey].emotion = btn.dataset.emoji;
      saveAndRefresh();
    };
  });
  document.getElementById("resetMoodBtn").onclick = () => {
    if (calendarData[selectedDateKey]) {
      calendarData[selectedDateKey].emotion = null;
      saveAndRefresh();
    }
  };
}

document.getElementById("addTodoBtn").onclick = () => {
  const txt = document.getElementById("todoInput").value;
  const endVal = document.getElementById("todoEndDate").value;
  if (!txt || !selectedDateKey) return;
  const gid = Date.now().toString();
  let curr = new Date(selectedDateKey);
  const end = endVal ? new Date(endVal) : curr;
  while (curr <= end) {
    const k = formatDateKey(curr.getFullYear(), curr.getMonth() + 1, curr.getDate());
    initData(k);
    calendarData[k].todos.push({ text: txt, groupId: gid });
    curr.setDate(curr.getDate() + 1);
  }
  document.getElementById("todoInput").value = "";
  saveAndRefresh();
};

document.getElementById("addExpenseBtn").onclick = () => {
  const title = document.getElementById("expenseTitle").value;
  const amt = Number(document.getElementById("expenseAmount").value);
  if (!title || amt <= 0) return;
  initData(selectedDateKey);
  calendarData[selectedDateKey].moneyLogs.push({ type: document.getElementById("moneyType").value, title, amount: amt });
  saveAndRefresh();
};

function renderTodoList(key) {
  const list = document.getElementById("todoList");
  list.innerHTML = "";
  (calendarData[key]?.todos || []).forEach((t, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${t.text}</span><button class="del-btn" onclick="deleteTodo(${i})"><i class="fas fa-trash"></i></button>`;
    list.appendChild(li);
  });
}

function renderMoneyList(key) {
  const list = document.getElementById("expenseList");
  list.innerHTML = "";
  (calendarData[key]?.moneyLogs || []).forEach((l, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${l.title}</span><span>${l.amount.toLocaleString()} <button class="del-btn" onclick="deleteMoney(${i})">x</button></span>`;
    list.appendChild(li);
  });
}

window.deleteTodo = (i) => { calendarData[selectedDateKey].todos.splice(i, 1); saveAndRefresh(); };
window.deleteMoney = (i) => { calendarData[selectedDateKey].moneyLogs.splice(i, 1); saveAndRefresh(); };

function updateMonthlySummary(y, m) {
  let inc = 0, exp = 0;
  Object.keys(calendarData).forEach(k => {
    if (k.startsWith(`${y}-${String(m+1).padStart(2,'0')}`)) {
      calendarData[k].moneyLogs?.forEach(l => l.type === 'income' ? inc += l.amount : exp += l.amount);
    }
  });
  document.getElementById("monthIncome").textContent = inc.toLocaleString();
  document.getElementById("monthExpense").textContent = exp.toLocaleString();
}

function saveAndRefresh() {
  localStorage.setItem("myPlannerData", JSON.stringify(calendarData));
  renderCalendar(currentYear, currentMonth);
  selectDate(selectedDateKey);
}

function initData(k) { if (!calendarData[k]) calendarData[k] = { todos: [], moneyLogs: [] }; }
function formatDateKey(y, m, d) { return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }

function moveMonth(s) {
  currentMonth += s;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  else if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar(currentYear, currentMonth);
}

document.getElementById("prevMonth").onclick = () => moveMonth(-1);
document.getElementById("nextMonth").onclick = () => moveMonth(1);
document.getElementById("saveMemoBtn").onclick = () => {
  localStorage.setItem("myMemo", document.getElementById("freeMemo").value);
  alert("메모가 저장되었습니다.");
};