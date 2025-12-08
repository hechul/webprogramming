# 📅 MY PLANNER : iOS 스타일 일정 & 자산 관리 웹 앱

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

> **2025년 2학기 웹프로그래밍 과제** > 외부 라이브러리 없이 **Vanilla JavaScript**만을 사용하여 구현한 반응형 일정 관리 및 가계부 애플리케이션입니다.

---

## 🖥️ 프로젝트 미리보기 (Preview)

![Main Screenshot](./image_393895.png)
*▲ iOS 캘린더 스타일의 직관적인 UI와 연속 일정 표시 기능*

### 🔗 배포 링크 (Demo)
> **[여기를 클릭하여 웹사이트 바로가기](https://hechul.github.io/webprogramming/)** > *(위 링크가 작동하려면 Repository의 Settings > Pages에서 main 브랜치를 배포 설정해주세요)*

---

## ✨ 주요 기능 (Key Features)

### 1. iOS 스타일 캘린더 (Continuous Schedule Bars)
- **연속 일정 시각화:** 시작일과 종료일을 설정하면 달력에 끊김 없는 **Bar 형태**로 일정이 표시됩니다.
- **스마트 렌더링:** 일정의 시작(Start), 중간(Middle), 끝(End)을 계산하여 둥근 모서리와 여백을 자동으로 스타일링합니다.
- **반응형 디자인:** 날짜 선택 시 하단 상세 패널이 부드러운 애니메이션(`cubic-bezier`)과 함께 등장합니다.

### 2. 올인원 데일리 로그 (Daily Log)
- **To-Do List:** 체크박스를 통한 할 일 완료 처리 및 그룹(연속 일정) 일괄 삭제 기능 지원.
- **Money Log (가계부):** 수입/지출 내역 기록 및 메모 기능. 달력 하단에 작은 점(Dot)으로 수입(파랑)/지출(빨강) 여부를 표시합니다.
- **Photo Log:** `FileReader` API를 활용하여 그날의 사진을 업로드하고 슬라이드로 감상할 수 있습니다.
- **Mood Tracker:** 5가지 이모지로 그날의 기분을 기록하고 달력에 표시합니다.

### 3. 데이터 영속성 (Data Persistence)
- **LocalStorage 활용:** 브라우저를 종료해도 데이터(일정, 가계부, 사진, 기분 등)가 사라지지 않고 유지됩니다.
- **이미지 데이터 처리:** 업로드한 이미지를 Base64 문자열로 변환하여 로컬 스토리지에 저장합니다.

---

## 🛠️ 기술 스택 (Tech Stack)

* **Frontend:** HTML5, CSS3 (Flexbox, CSS Animation), JavaScript (ES6+)
* **Storage:** Web LocalStorage API
* **Design:** Custom CSS (No Bootstrap/Tailwind), FontAwesome Icons

---

## 📂 폴더 구조 (Directory Structure)

```bash
📦 my-planner
├── 📄 index.html      # 메인 레이아웃 구조 (Semantic HTML)
├── 🎨 style.css       # 전체 스타일링, 애니메이션, 반응형 디자인
├── 📜 app.js          # DOM 조작, 캘린더 로직, CRUD 기능 구현
└── 🖼️ image_393895.png # 리드미용 스크린샷 이미지
