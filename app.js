const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
let selectedDateKey = null;

let calendarData = JSON.parse(localStorage.getItem("myPlannerData") || "{}");

const monthTitle = document.getElementById("monthTitle");
const calendarBody = document.getElementById("calendarBody");
const tooltip = document.getElementById("calendarTooltip");

// =========================
// 초기 실행
// =========================
init();

function init() {
  // 버튼/이벤트 연결 (수업 스타일)
  document.getElementById("goTodayBtn").onclick = goToday;
  document.getElementById("prevMonth").onclick = prevMonth;
  document.getElementById("nextMonth").onclick = nextMonth;
  document.getElementById("addTodoBtn").onclick = addTodo;
  document.getElementById("addExpenseBtn").onclick = addExpense;
  document.getElementById("saveMemoBtn").onclick = saveMemo;
  document.getElementById("resetMoodBtn").onclick = resetMood;

  setupMoodEvents();

  renderCalendar(currentYear, currentMonth);

  // 처음 실행 시 오늘 날짜 선택
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());
  selectDate(todayKey);

  // 메모 로드
  document.getElementById("freeMemo").value = localStorage.getItem("myMemo") || "";
}

// =========================
// 달력 이동/버튼 핸들러
// =========================
function goToday() {
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();

  const todayKey = formatDateKey(currentYear, currentMonth + 1, today.getDate());
  renderCalendar(currentYear, currentMonth);
  selectDate(todayKey);
}

function prevMonth() {
  moveMonth(-1);
}

function nextMonth() {
  moveMonth(1);
}

function moveMonth(step) {
  currentMonth += step;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar(currentYear, currentMonth);
}

// =========================
// 달력 그리기
// =========================
function renderCalendar(year, month) {
  monthTitle.textContent = year + "." + String(month + 1).padStart(2, "0");
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
        const emoji = data && data.emotion ? data.emotion : "";

        let html = ""
          + '<div class="date-header">'
          +   '<span class="date-number">' + date + '</span>'
          +   '<span class="daily-emotion">' + emoji + '</span>'
          + '</div>'
          + '<div class="events-container">';

        // 연속 일정 바(최대 3개 표시)
        if (data && data.todos) {
          data.todos.slice(0, 3).forEach(function (todo) {
            const yesterday = new Date(year, month, date - 1);
            const tomorrow = new Date(year, month, date + 1);

            const prevK = formatDateKey(
              yesterday.getFullYear(),
              yesterday.getMonth() + 1,
              yesterday.getDate()
            );
            const nextK = formatDateKey(
              tomorrow.getFullYear(),
              tomorrow.getMonth() + 1,
              tomorrow.getDate()
            );

            const hasPrev = hasEventId(prevK, todo.groupId);
            const hasNext = hasEventId(nextK, todo.groupId);

            let classStr = "is-single";
            if (hasPrev && hasNext) classStr = "is-middle";
            else if (hasPrev && !hasNext) classStr = "is-end";
            else if (!hasPrev && hasNext) classStr = "is-start";

            html += '<div class="event-bar ' + classStr + '">' + todo.text + "</div>";
          });
        }

        html += "</div>";

        // 지출/수입 도트 표시
        if (data && data.moneyLogs && data.moneyLogs.length > 0) {
          html += '<div class="money-dot-box">';
          data.moneyLogs.forEach(function (l) {
            html += '<div class="money-dot ' + (l.type === "income" ? "inc" : "exp") + '"></div>';
          });
          html += "</div>";
        }

        td.innerHTML = html;

        if (selectedDateKey === dateKey) td.classList.add("selected");

        // 이벤트 연결
        td.onclick = function () { selectDate(dateKey); };
        td.onmouseenter = function (e) { showTooltip(e, dateKey); };
        td.onmousemove = function (e) { moveTooltip(e); };
        td.onmouseleave = function () { hideTooltip(); };

        date++;
      }

      tr.appendChild(td);
    }

    calendarBody.appendChild(tr);

    if (date > lastDate) break;
  }
}

function hasEventId(key, gid) {
  return !!(gid && calendarData[key] && calendarData[key].todos && calendarData[key].todos.some(function (t) {
    return t.groupId === gid;
  }));
}

// =========================
// 툴팁
// =========================
function showTooltip(e, key) {
  const data = calendarData[key];
  if (!data) return;

  let html = '<div class="tooltip-title">' + key + "</div>";

  if (data.todos) {
    data.todos.slice(0, 5).forEach(function (t) {
      html += "<div>• " + t.text + "</div>";
    });
  }

  let inc = 0, exp = 0;
  (data.moneyLogs || []).forEach(function (l) {
    if (l.type === "income") inc += l.amount;
    else exp += l.amount;
  });

  if (inc > 0 || exp > 0) {
    html += '<div class="tooltip-money">';
    if (inc > 0) html += '<div style="color:#4dabf7">수입: +' + inc.toLocaleString() + "</div>";
    if (exp > 0) html += '<div style="color:#ffeb3b">지출: -' + exp.toLocaleString() + "</div>";
    html += "</div>";
  }

  tooltip.innerHTML = html;
  tooltip.style.display = "block";
  moveTooltip(e);
}

function moveTooltip(e) {
  tooltip.style.left = (e.pageX + 15) + "px";
  tooltip.style.top = (e.pageY + 15) + "px";
}

function hideTooltip() {
  tooltip.style.display = "none";
}

// =========================
// 날짜 선택/상세 렌더
// =========================
function selectDate(key) {
  selectedDateKey = key;

  document.getElementById("selectedDateText").textContent = key;

  document.querySelectorAll(".calendar td").forEach(function (td) {
    td.classList.remove("selected");
    if (td.dataset.date === key) td.classList.add("selected");
  });

  const data = calendarData[key];
  document.getElementById("selectedEmotionDisplay").textContent = (data && data.emotion) ? data.emotion : "";

  renderTodoList(key);
  renderMoneyList(key);
}

// =========================
// 기분 버튼
// =========================
function setupMoodEvents() {
  document.querySelectorAll(".emo-btn").forEach(function (btn) {
    btn.onclick = function () {
      if (!selectedDateKey) return;
      initData(selectedDateKey);
      calendarData[selectedDateKey].emotion = btn.dataset.emoji;
      saveAndRefresh();
    };
  });
}

function resetMood() {
  if (!selectedDateKey) return;
  if (calendarData[selectedDateKey]) {
    calendarData[selectedDateKey].emotion = null;
    saveAndRefresh();
  }
}

// =========================
// 일정/가계부 추가
// =========================
function addTodo() {
  const txt = document.getElementById("todoInput").value;
  const endVal = document.getElementById("todoEndDate").value;

  if (!txt || !selectedDateKey) return;

  const gid = Date.now().toString();

  let curr = new Date(selectedDateKey);
  const end = endVal ? new Date(endVal) : new Date(selectedDateKey);

  while (curr <= end) {
    const k = formatDateKey(curr.getFullYear(), curr.getMonth() + 1, curr.getDate());
    initData(k);
    calendarData[k].todos.push({ text: txt, groupId: gid });
    curr.setDate(curr.getDate() + 1);
  }

  document.getElementById("todoInput").value = "";
  document.getElementById("todoEndDate").value = "";

  saveAndRefresh();
}

function addExpense() {
  if (!selectedDateKey) return;

  const type = document.getElementById("moneyType").value;
  const title = document.getElementById("expenseTitle").value;
  const amt = Number(document.getElementById("expenseAmount").value);

  if (!title || amt <= 0) return;

  initData(selectedDateKey);
  calendarData[selectedDateKey].moneyLogs.push({ type: type, title: title, amount: amt });

  document.getElementById("expenseTitle").value = "";
  document.getElementById("expenseAmount").value = "";

  saveAndRefresh();
}

// =========================
// 리스트 렌더/삭제
// =========================
function renderTodoList(key) {
  const list = document.getElementById("todoList");
  list.innerHTML = "";

  const arr = (calendarData[key] && calendarData[key].todos) ? calendarData[key].todos : [];

  arr.forEach(function (t, i) {
    const li = document.createElement("li");
    li.innerHTML =
      "<span>" + t.text + '</span>' +
      '<button class="del-btn" onclick="deleteTodo(' + i + ')">' +
      '<i class="fas fa-trash"></i></button>';
    list.appendChild(li);
  });
}

function renderMoneyList(key) {
  const list = document.getElementById("expenseList");
  list.innerHTML = "";

  const arr = (calendarData[key] && calendarData[key].moneyLogs) ? calendarData[key].moneyLogs : [];

  arr.forEach(function (l, i) {
    const li = document.createElement("li");
    li.innerHTML =
      "<span>" + l.title + "</span>" +
      "<span>" + l.amount.toLocaleString() +
      ' <button class="del-btn" onclick="deleteMoney(' + i + ')">x</button></span>';
    list.appendChild(li);
  });
}

function deleteTodo(i) {
  if (!selectedDateKey) return;
  if (!calendarData[selectedDateKey] || !calendarData[selectedDateKey].todos) return;

  const ok = confirm("해당 일정을 삭제하시겠습니까?");
  if (!ok) return;

  calendarData[selectedDateKey].todos.splice(i, 1);
  saveAndRefresh();
}

function deleteMoney(i) {
  if (!selectedDateKey) return;
  if (!calendarData[selectedDateKey] || !calendarData[selectedDateKey].moneyLogs) return;

  const ok = confirm("해당 내역을 삭제하시겠습니까?");
  if (!ok) return;

  calendarData[selectedDateKey].moneyLogs.splice(i, 1);
  saveAndRefresh();
}

// =========================
// 월간 합계 / 저장
// =========================
function updateMonthlySummary(y, m) {
  let inc = 0, exp = 0;

  Object.keys(calendarData).forEach(function (k) {
    if (k.startsWith(y + "-" + String(m + 1).padStart(2, "0"))) {
      const logs = calendarData[k].moneyLogs || [];
      logs.forEach(function (l) {
        if (l.type === "income") inc += l.amount;
        else exp += l.amount;
      });
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

function saveMemo() {
  localStorage.setItem("myMemo", document.getElementById("freeMemo").value);
  alert("메모가 저장되었습니다.");
}

// =========================
// 공통 유틸
// =========================
function initData(k) {
  if (!calendarData[k]) calendarData[k] = { todos: [], moneyLogs: [] };
}

function formatDateKey(y, m, d) {
  return y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
}
