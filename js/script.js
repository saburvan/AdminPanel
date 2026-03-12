// Imports from chart.js and statistics
import {getStats, getTop, pieChart, revenueChart, topCoursesChart} from './chart.js';

// ---------- ELEMENTS ----------
const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');
const loginForm = document.getElementById('loginForm');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const logoutBtn = document.getElementById('logoutBtn');

// Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const coursesSection = document.getElementById('coursesSection');
const studentsSection = document.getElementById('studentsSection');

// Headers and buttons of courses/lessons
const coursesHeader = document.getElementById('coursesHeader');
const lessonsHeader = document.getElementById('lessonsHeader');
const coursesListDiv = document.getElementById('coursesList');
const lessonsDetailBlock = document.getElementById('lessonsDetailBlock');
const backToCoursesBtn = document.getElementById('backToCourses');
const openCreateCourseBtn = document.getElementById('openCreateCourseModal');
const openCreateLessonBtn = document.getElementById('openCreateLessonModal');

// Statistics elements
const statsTabs = document.querySelectorAll('.stats-tab');
const statsContents = {
    revenuePie: document.getElementById('revenuePieContent'),
    top: document.getElementById('topContent')
};
const statisticsSection = document.getElementById('statisticsSection');

// Modal windows
const courseModal = document.getElementById('courseModal');
const lessonModal = document.getElementById('lessonModal');
const confirmModal = document.getElementById('confirmModal');
const closeModalButtons = document.querySelectorAll('.close-modal');
const deleteModal = document.getElementById('confirmModalCourse');

// Action buttons on cards
const editCourseButtons = document.querySelectorAll('.edit-course');

// File preview
const fileInput = document.getElementById('courseImage');
const fileNameSpan = document.getElementById('file-name');
const imagePreview = document.getElementById('imagePreview');

const pagination = document.querySelector('.pagination')

const BASE_URL = 'http://127.0.0.1:8000/api';
const PER_PAGE = 8;
const MESSAGE_DURATION = 3000 // in ms
const SKELETON_COOLDOWN = 200 // in ms


// ---------- GENERAL FUNCTIONS ----------
// Function of showing error
function showError(response, input, inputError, name) {
    const errors = response['errors'];
    input.style.borderColor = `var(--danger)`;
    inputError.classList.remove('hidden');
    inputError.innerHTML = errors[name]
}

// Function of showing message
export function showMessage(type, messageText) {
    let message = document.querySelector('.message');
    let messageContent = document.querySelector('.message p')
    messageContent.innerHTML = messageText
    setTimeout(() => {
        message.classList.add('show');
        if (type === 'success') {
            message.classList.remove('danger')
            message.classList.add('success')
        } else {
            message.classList.remove('success')
            message.classList.add('danger')
        }
        setTimeout(() => {
            message.classList.remove('show');
        }, MESSAGE_DURATION)
    }, 100)
}

// Fetching information
async function apiRequest(url, options, showError = true) {
    try {
        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Ошибка запроса');
        }

        return data;
    } catch (error) {
        if (showError) {
            showMessage('danger', 'Произошла ошибка, попробуйте снова');
        }
        throw error;
    }
}

// Getting the current theme colors for charts
export const getColors = () => {
    // Список нужных переменных (все, кроме --bg-body и --bg-surface)
    const wantedVars = [
        '--text-primary',
        '--text-secondary',
        '--accent',
        '--border',
    ];

    const rootStyles = getComputedStyle(document.documentElement);
    let colors = wantedVars.map(name => ({
        name,
        value: rootStyles.getPropertyValue(name).trim()
    }));
    let pieColors = [
        '--chart-color-1',
        '--chart-color-2',
        '--chart-color-3',
        '--chart-color-4',
        '--chart-color-5',
        '--chart-color-6',
        '--chart-color-7',
        '--chart-color-8',
    ]

    let pie = pieColors.map(name => ({
        name,
        value: rootStyles.getPropertyValue(name).trim()
    }))

    colors['pieColors'] = pie;

    return colors
}


// ---------- ACTIONS WITH ACCOUNT ----------
// Check if the user authorized
if (localStorage.getItem('token')) {
    adminPanel.classList.remove('hidden');
    loginScreen.classList.add('hidden');

    let userEmail = document.querySelector('.user-email');
    userEmail.innerHTML = localStorage.getItem('email');
} else {
    adminPanel.classList.add('hidden');
    loginScreen.classList.remove('hidden');
}

// Authorization form processing
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail');
    const password = document.getElementById('loginPassword');

    let formData = new FormData(loginForm);
    const url = `${BASE_URL}/admin/auth`;
    const options = {method: 'POST',}
    options.body = formData;

    const data = await apiRequest(url, options, true);

    if (data['token']) {
        localStorage.setItem('token', data['token'])
        localStorage.setItem('email', data['email'])
    } else {
        let errors = data['errors']
        if (errors['email']) {
            showError(data, email, emailError, 'email')
        }
        if (errors['password']) {
            showError(data, password, passwordError, 'password')
        }
        return 0;
    }

    adminPanel.classList.remove('hidden');
    loginScreen.classList.add('hidden');
    email.value = '';
    password.value = '';
    showCoursesContent(1)
    getStatistics();
});

// Logout
logoutBtn.addEventListener('click', async () => {
    const url = `${BASE_URL}/admin/logout`;
    const options = {
        method: 'GET', headers: {
            Authorization: 'Bearer ' + localStorage.getItem('token')
        }
    }

    const data = await apiRequest(url, options, true)
    if (data['success'] === '1') {
        adminPanel.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        localStorage.removeItem('token')
        localStorage.removeItem('email')
    } else {
        return 0;
    }
});

// ---------- TABS ----------
// Switching main tabs
tabButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;

        coursesSection.classList.remove('active');
        studentsSection.classList.remove('active');
        statisticsSection.classList.remove('active');

        if (tab === 'courses') {
            showCoursesContent(1);
            getStatistics();
            coursesSection.classList.add('active');
            if (document.getElementById('coursesHeader')) {
                document.getElementById('coursesHeader').classList.remove('hidden');
                document.getElementById('lessonsHeader').classList.add('hidden');
                document.getElementById('coursesList').classList.remove('hidden');
                document.getElementById('lessonsDetailBlock').classList.add('hidden');
            }
        } else if (tab === 'students') {
            getStudents();
            studentsSection.classList.add('active');
        } else if (tab === 'statistics') {
            statisticsSection.classList.add('active');
            setTimeout(async () => {
                const info = await getStats();
                revenueChart.data.datasets[0].data = info['revenue']['values']
                revenueChart.data.labels = info['revenue']['dates']
                revenueChart.update()
            }, 300);
        }
    });
});

// Switching statistics tabs
statsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        statsTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabId = tab.dataset.statsTab;
        Object.values(statsContents).forEach(content => content.classList.remove('active'));
        if (statsContents[tabId]) {
            statsContents[tabId].classList.add('active');
            // Перерисовываем соответствующую диаграмму при активации
            setTimeout(async () => {
                if (tabId === 'revenuePie') {
                    getStats();
                    if (revenueChart) revenueChart.update();
                    if (pieChart) pieChart.update();
                } else if (tabId === 'top' && topCoursesChart) {
                    const data = await getTop();
                    topCoursesChart.data.datasets[0].data = data['top']['values'];
                    topCoursesChart.data.labels = data['top']['names'];
                    topCoursesChart.update();
                }
            }, 100);
        }
    });
});

// Showing all the courses with pagination
async function showCoursesContent(page) {
    let coursesList = document.querySelector('.courses-grid');
    let paginationBlock = document.querySelector('.pagination')
    coursesList.innerHTML = '';

    // Showing the courses skeleton loader
    showSkeletonLoader(coursesList);

    paginationBlock.classList.add('pagination-loading')

    const url = `${BASE_URL}/courses?page=${page}&per_page=${PER_PAGE}`;
    const options = {
        method: 'get',
        headers: {Authorization: 'Bearer ' + localStorage.getItem('token')}
    }

    const data = await apiRequest(url, options, true);
    let s = ''
    let courses = data['data']

    if (courses.length === 0) {
        s += `Курсов не найдено`
        coursesList.innerHTML = s;
        return 0;
    }
    courses.forEach((d) => {
        s += `
                 <div class="course-card" data-course-id="${d['id']}">
                        <div class="course-thumb"><img src="http://127.0.0.1:8000/img/${d['img']}" alt="${d['name']}"></div>
                        <div class="course-info">
                            <div class="course-title">${d['name']}</div>
                            <div class="course-meta"><i class="far fa-clock"></i> ${d['hours']} ч</div>
                            <div class="course-meta">
                                <i class="fas fa-tag"></i> <span class="price-highlight">${d['price']} ₽</span>
                            </div>
                            <div class="course-meta"><i class="far fa-calendar"></i> ${d['start_date']} — ${d['end_date']}</div>
                            <div class="course-actions">
                                <button class="btn-secondary edit-course" data-course-id="${d['id']}"><i class="fas fa-edit"></i></button>
                                <button class="btn-danger delete-course" data-course-id="${d['id']}"><i class="fas fa-trash"></i></button>
                                <button class="btn-primary view-lessons" data-course-id-view="${d['id']}"><i class="fas fa-eye"></i> Уроки (${d['count']})</button>
                            </div>
                        </div>
                    </div>`
    })

    setTimeout(() => {
        coursesList.innerHTML = s;
        let allPages = data['meta']['last_page'];
        let currentPage = parseInt(data['meta']['current_page']);
        let paginationBlock = document.querySelector('.pagination');
        let p;
        if (currentPage === 1) {
            p = `<button class="pagination-btn" disabled>
                    <i class="fas fa-chevron-left"></i>
                </button>`
        } else {
            p = `<button class="pagination-btn" data-page="${currentPage - 1}">
                    <i class="fas fa-chevron-left"></i>
                </button>`
        }

        for (let i = 0; i < allPages; i++) {
            if (i + 1 === currentPage) {
                p += `<button disabled data-page="${i + 1}" class="pagination-page active">${i + 1}</button>`
            } else {
                p += `<button data-page="${i + 1}" class="pagination-page">${i + 1}</button>`
            }
        }

        if (currentPage === allPages) {
            p += `<button class="pagination-btn" disabled>
                    <i class="fas fa-chevron-right"></i>
                </button>`
        } else {
            p += `<button class="pagination-btn" data-page="${currentPage + 1}">
                    <i class="fas fa-chevron-right"></i>
                </button>`
        }

        paginationBlock.innerHTML = p;
        paginationBlock.classList.remove('pagination-loading');

        document.querySelectorAll('.course-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('show')
            }, index * 50);
        })
    }, SKELETON_COOLDOWN)
}

// Processing of switching the pages of pagination
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.pagination').addEventListener('click', async function (e) {
        const button = e.target.closest('button[data-page]');
        if (button && !button.disabled) {
            const page = button.dataset.page;
            await showCoursesContent(page);
        }
    });

    if (localStorage.getItem('token')) {
        showCoursesContent(1);
        getStatistics();
    }
})

// Functions for showing skeleton loaders
function showSkeletonLoader(container) {
    let skeletonHTML = '';
    for (let i = 0; i < 8; i++) {
        skeletonHTML += `
            <div class="course-card skeleton">
                <div class="course-thumb skeleton-box"></div>
                <div class="course-info">
                    <div class="skeleton-line" style="width: 80%; height: 24px; margin-bottom: 10px;"></div>
                    <div class="skeleton-line" style="width: 40%; height: 16px; margin-bottom: 8px;"></div>
                    <div class="skeleton-line" style="width: 60%; height: 16px; margin-bottom: 8px;"></div>
                    <div class="skeleton-line" style="width: 70%; height: 16px;"></div>
                </div>
            </div>`;
    }
    container.innerHTML = skeletonHTML;
}

function showStatisticsSkeleton(container) {
    let skeletonHTML = '';
    for (let i = 0; i < 4; i++) {
        skeletonHTML += `
            <div class="stat-card skeleton">
                <div class="skeleton-line" style="height: 32px; width: 15%; margin-bottom: 10px"></div>
                <div class="skeleton-line" style="height: 33px; width: 25%;align-self: center; margin-bottom: 10px"></div>
                <div class="skeleton-line" style="height: 16px; width: 70%;align-self: center"></div>
            </div>`
    }
    container.innerHTML = skeletonHTML;
}

function showLessonsSkeleton(container) {
    let skeletonHTML = '';
    for (let i = 0; i < 2; i++) {
        skeletonHTML += `
            <div class="lesson-item skeleton">
                <div class="skeleton-line" style="height: 50px; width: 15%; margin-bottom: 10px"></div>
                <div class="skeleton-line" style="height: 33px; width: 25%; margin-bottom: 10px"></div>
                <div class="skeleton-line" style="height: 33px; width: 60%"></div>
            </div>`
    }
    container.innerHTML = skeletonHTML;
}

function showTableSkeleton(container) {
    let skeletonHTML = `<!-- Студент 1 -->
        <tr class="student-row skeleton-row">
            <td>
                <div class="skeleton-line" style="width: 150px; height: 20px; margin-bottom: 8px;"></div>
                <div class="skeleton-line" style="width: 180px; height: 14px;"></div>
            </td>
            <td colspan="5">
                <div class="skeleton-box" style="width: 100%; height: 20px;"></div>
            </td>
        </tr>

    <!-- Курсы студента 1 -->
    <tr class="course-row skeleton-row">
        <td></td>
        <td><div class="skeleton-line" style="width: 140px;"></div></td>
        <td><div class="skeleton-line" style="width: 80px;"></div></td>
        <td><div class="skeleton-box" style="width: 70px; height: 24px; border-radius: 20px;"></div></td>
        <td><div class="skeleton-line" style="width: 30px;"></div></td>
        <td><div class="skeleton-line" style="width: 100px;"></div></td>
    </tr>

    <tr class="course-row skeleton-row">
        <td></td>
        <td><div class="skeleton-line" style="width: 160px;"></div></td>
        <td><div class="skeleton-line" style="width: 80px;"></div></td>
        <td><div class="skeleton-box" style="width: 70px; height: 24px; border-radius: 20px;"></div></td>
        <td><div class="skeleton-line" style="width: 30px;"></div></td>
        <td><div class="skeleton-line" style="width: 110px;"></div></td>
    </tr>

    <!-- Студент 2 -->
    <tr class="student-row skeleton-row">
        <td>
            <div class="skeleton-line" style="width: 140px; height: 20px; margin-bottom: 8px;"></div>
            <div class="skeleton-line" style="width: 170px; height: 14px;"></div>
        </td>
        <td colspan="5">
            <div class="skeleton-box" style="width: 100%; height: 20px;"></div>
        </td>
    </tr>

    <!-- Курсы студента 2 -->
    <tr class="course-row skeleton-row">
        <td></td>
        <td><div class="skeleton-line" style="width: 150px;"></div></td>
        <td><div class="skeleton-line" style="width: 80px;"></div></td>
        <td><div class="skeleton-box" style="width: 70px; height: 24px; border-radius: 20px;"></div></td>
        <td><div class="skeleton-line" style="width: 30px;"></div></td>
        <td><div class="skeleton-line" style="width: 105px;"></div></td>
    </tr>

    <tr class="course-row skeleton-row">
        <td></td>
        <td><div class="skeleton-line" style="width: 180px;"></div></td>
        <td><div class="skeleton-line" style="width: 80px;"></div></td>
        <td><div class="skeleton-box" style="width: 70px; height: 24px; border-radius: 20px;"></div></td>
        <td><div class="skeleton-line" style="width: 30px;"></div></td>
        <td><div class="skeleton-line" style="width: 115px;"></div></td>
    </tr>

    <!-- Студент 3 -->
    <tr class="student-row skeleton-row">
        <td>
            <div class="skeleton-line" style="width: 135px; height: 20px; margin-bottom: 8px;"></div>
            <div class="skeleton-line" style="width: 165px; height: 14px;"></div>
        </td>
        <td colspan="5">
            <div class="skeleton-box" style="width: 100%; height: 20px;"></div>
        </td>
    </tr>

    <!-- Курс студента 3 -->
    <tr class="course-row skeleton-row">
        <td></td>
        <td><div class="skeleton-line" style="width: 155px;"></div></td>
        <td><div class="skeleton-line" style="width: 80px;"></div></td>
        <td><div class="skeleton-box" style="width: 70px; height: 24px; border-radius: 20px;"></div></td>
        <td><div class="skeleton-line" style="width: 30px;"></div></td>
        <td><div class="skeleton-line" style="width: 108px;"></div></td>
    </tr>`

    container.innerHTML = skeletonHTML
}

// Fetching the statistics
async function getStatistics() {
    let statContainer = document.querySelector('.stats-grid')

    showStatisticsSkeleton(statContainer);

    setTimeout(async () => {
        const url = `${BASE_URL}/stats`;
        const options = {
            method: 'GET', headers: {
                Authorization: 'Bearer ' + localStorage.getItem('token')
            }
        }

        const data = await apiRequest(url, options, true);

        let statHTML = '';
        Object.entries(data).forEach(([key, value]) => {
            statHTML += `<div class="stat-card"><i class="fas ${value['icon']}"></i>
                    <div class="stat-value">${value['stat']}</div>
                    <div class="stat-label">${value['label']}</div>
                 </div>`;
        })
        statContainer.innerHTML = statHTML

        document.querySelectorAll('.stat-card').forEach((e, index) => {
            setTimeout(() => {
                e.classList.add('show');
            }, index * 50)
        })
    }, SKELETON_COOLDOWN)
}

// Render the orders
function updateStudents(data) {
    let studentsTable = document.querySelector('.students-body');
    let studentsStat = document.querySelector('.stat-students-label')
    let studentsHTML = '';
    studentsStat.innerHTML = `Показано ${data['total_students']} студентов(а), всего записей ${data['total_signs']}`;

    data = data['data'];
    data.forEach(e => {
        studentsHTML += `<tr class="student-row">
                <td><i class="fas fa-user-graduate"></i> ${e['name']}<br><span class="text-small">${e['email']}</span></td>
                <td colspan="5"></td>
                </tr>`
        let courses = e['courses']
        courses.forEach(c => {
            studentsHTML += `<tr class="course-row">
                        <td></td>
                        <td>${c['course_name']}</td>
                        <td>${c['order_date']}</td>`;
            if (c['payment_status'] === 'success') {
                studentsHTML += `<td><span class="status paid">Оплачено</span></td>`
            } else if (c['payment_status'] === 'pending') {
                studentsHTML += `<td><span class="status pending">Ожидает</span></td>`
            } else {
                studentsHTML += `<td><span class="status error">Ошибка</span></td>`
            }
            studentsHTML += `<td><i class="fas fa-check-circle" style="color: var(--success-text);"></i> Да</td>`
            //     <td><i class="fas fa-times-circle" style="color: var(--danger);"></i> Нет</td>
            if (c['certificate'] !== null) {
                studentsHTML += `<td><span class="certificate">${c['certificate']}</span></td>`
            } else {
                studentsHTML += `<td>—</td>`;
            }
        })
    })
    studentsTable.innerHTML = studentsHTML;
}

// Fetching the orders
async function getStudents() {
    let studentsTable = document.querySelector('.students-body');
    showTableSkeleton(studentsTable)

    const url = `${BASE_URL}/students`;
    const options = {
        method: 'get', headers: {
            Authorization: 'Bearer ' + localStorage.getItem('token')
        }
    }

    const data = await apiRequest(url, options, true);

    setTimeout(() => {
        updateStudents(data)
    }, SKELETON_COOLDOWN)
}

// Filtration + search in the students section
async function getFilteredStudents(form) {
    let formData = new FormData(form);

    let studentsTable = document.querySelector('.students-body');
    showTableSkeleton(studentsTable)

    const url = `${BASE_URL}/students/filter`;
    const options = {
        method: 'POST', headers: {
            Authorization: 'Bearer ' + localStorage.getItem('token'),
        }, body: formData
    }

    const data = await apiRequest(url, options, true);

    setTimeout(() => {
        updateStudents(data);
    }, SKELETON_COOLDOWN)
}

// Processing the user data while filtering
let form = document.querySelector('#filter-form');
form.addEventListener('submit', (event) => {
    event.preventDefault();
    getFilteredStudents(form);
})

// Reset students info
document.addEventListener('click', (event) => {
    let btn = event.target.closest('#btnReset');
    event.stopPropagation();

    if (btn) {
        getStudents();
        event.stopPropagation();
    }
})

// Rendering lessons for certain course
async function renderLessonsForCourse(courseId) {
    let lessonsContainer = document.querySelector('#lessonsDetailBlock');
    let currentCourseName = document.getElementById('currentCourseName');

    showLessonsSkeleton(lessonsContainer);

    const url = `${BASE_URL}/courses/${courseId}/lessons`;
    const options = {
        method: 'get', headers: {
            Authorization: 'Bearer ' + localStorage.getItem('token')
        }
    }

    let data = await apiRequest(url, options, true);

    currentCourseName.innerHTML = data['course']['name'];

    //  add ID of course to form
    let courseInput = document.getElementById('CourseId');
    courseInput.value = courseId;

    // add ID of course in confirm modal
    let confirmBtn = document.getElementById('confirmDeleteBtn')
    confirmBtn.setAttribute('data-course-id', courseId);

    setTimeout(() => {
        if (data['message']) {
            lessonsContainer.innerHTML = 'У данного урока курсов не найдено';
            return 0;
        }
        data = data['data'];
        let lessonsHTML = ''
        data.forEach(lesson => {
            lessonsHTML += `
                <div class="lesson-item" data-lesson-id="${lesson['id']}">
                        <div class="lesson-header">
                            <div class="lesson-title">
                                <i class="fas fa-play-circle" style="color: var(--accent);"></i>
                                ${lesson['name']}
                            </div>
                            <span class="lesson-duration"><i class="far fa-clock"></i> ${lesson['hours']} ч</span>
                        </div>
                        <div class="lesson-description">
                            ${lesson['description']}
                        </div>
                        ${lesson.video ? `
                            <a href="${lesson['video-link']}" target="_blank" class="lesson-video-link">
                                <i class="fas fa-external-link-alt"></i> Смотреть видеоурок
                            </a>
                        ` : ''}
                        <div class="lesson-footer">
                            <div class="lesson-actions">
                                <button class="btn-secondary edit-lesson" data-lesson-id="${lesson['id']}"><i class="fas fa-edit"></i></button>
                                <button class="btn-danger delete-lesson" data-lesson-id="${lesson['id']}"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                `
        })
        lessonsContainer.innerHTML = lessonsHTML;

        let lessonItems = document.querySelectorAll('.lesson-item')
        lessonItems.forEach((e, index) => {
            setTimeout(() => {
                e.classList.add('show');
            }, 10 + 50 * index)

        })

        // Listeners for new buttons
        document.querySelectorAll('.edit-lesson').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('lessonModalTitle').innerHTML = '<i class="fas fa-edit"></i> Редактирование урока';
                openModal(lessonModal);
            });
        });
        document.querySelectorAll('.delete-lesson').forEach(btn => {
            btn.addEventListener('click', (e) => {
                let lessonId = btn.dataset.lessonId;
                let confirmBtn = document.getElementById('confirmDeleteBtn');
                confirmBtn.dataset.lessonId = lessonId
                e.stopPropagation();
                document.getElementById('confirmMessage').innerText = 'Вы уверены, что хотите удалить этот урок?';
                openModal(confirmModal);
            });
        });
    }, SKELETON_COOLDOWN)
}

document.addEventListener('click', function (event) {
    event.stopPropagation();
    let btn = event.target.closest('[data-course-id-view]')
    if (btn) {
        event.stopPropagation();
        const courseId = btn.dataset.courseIdView;
        coursesHeader.classList.add('hidden');
        lessonsHeader.classList.remove('hidden');
        coursesListDiv.classList.add('hidden');
        lessonsDetailBlock.classList.remove('hidden');
        pagination.classList.add('hidden');
        renderLessonsForCourse(courseId);
    }
})

backToCoursesBtn.addEventListener('click', () => {
    coursesHeader.classList.remove('hidden');
    lessonsHeader.classList.add('hidden');
    coursesListDiv.classList.remove('hidden');
    lessonsDetailBlock.classList.add('hidden');
    pagination.classList.remove('hidden')
    showCoursesContent(1);
    getStatistics();

    // Clearing ID from the form
    let courseInput = document.getElementById('CourseId');
    courseInput.value = '';
});

// ---------- MODAL WINDOWS ----------
function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

// Closing modals
closeModalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.dataset.modal;
        const modal = document.getElementById(modalId);
        if (modal) closeModal(modal);
    });
});

// Close modal windows when clicking the empty area
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay);
    });
});

// Processing adding of the course
let saveCourse = async (event, formElement) => {
    event.preventDefault();

    let formData = new FormData(formElement);

    const url = `${BASE_URL}/courses`
    const options = {
        method: 'post',
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('token')
        }, body: formData
    }

    const data = await apiRequest(url, options, true);

    if (data['success'] === false) {
        let errors = data['errors'];

        if (errors['name']) {
            let input = document.getElementById('courseTitle');
            let inputError = document.getElementById('nameError');

            showError(data, input, inputError, 'name')
        }
        if (errors['hours']) {
            let input = document.getElementById('courseDuration');
            let inputError = document.getElementById('hoursError');

            showError(data, input, inputError, 'hours')
        }
        if (errors['price']) {
            let input = document.getElementById('coursePrice');
            let inputError = document.getElementById('priceError');

            showError(data, input, inputError, 'price')
        }
        if (errors['start_date']) {
            let input = document.getElementById('courseStartDate');
            let inputError = document.getElementById('startDateError');

            showError(data, input, inputError, 'start_date')
        }
        if (errors['end_date']) {
            let input = document.getElementById('courseEndDate');
            let inputError = document.getElementById('endDateError');

            showError(data, input, inputError, 'end_date')
        }
        if (errors['img']) {
            let input = document.getElementById('courseImage');
            let inputError = document.getElementById('imageError');

            showError(data, input, inputError, 'img')
        }
        if (errors['description']) {
            let input = document.getElementById('courseDesc');
            let inputError = document.getElementById('descError');

            showError(data, input, inputError, 'description')
        }
    } else {
        showCoursesContent(1);
        getStatistics();
        closeModal(courseModal);
        showMessage('success', data['message']);
    }
}

// Processing adding of the lesson to course
let saveLesson = async (event, formElement) => {
    event.preventDefault();

    let formData = new FormData(formElement);
    let courseId = document.getElementById('CourseId').value

    const url = `${BASE_URL}/courses/${courseId}/lessons`
    const options = {
        method: 'post', headers: {
            Authorization: 'Bearer ' + localStorage.getItem('token')
        }, body: formData
    }

    const data = await apiRequest(url, options, true);
    if (data['success'] === false) {
        let errors = data['errors'];
        if (errors['name']) {
            let input = document.getElementById('lessonTitle')
            let error = document.getElementById('titleError');

            showError(data, input, error, 'name')
        }
        if (errors['hours']) {
            let input = document.getElementById('lessonDuration')
            let error = document.getElementById('durationError');

            showError(data, input, error, 'hours')
        }
        if (errors['description']) {
            let input = document.getElementById('lessonContent')
            let error = document.getElementById('descriptionError');

            showError(data, input, error, 'description')
        }
        if (errors['video_link']) {
            let input = document.getElementById('lessonVideo')
            let error = document.getElementById('videoError');

            showError(data, input, error, 'video_link')
        }
    } else {
        renderLessonsForCourse(data['id']);
        closeModal(lessonModal);
        showMessage('success', data['message']);
    }

}

// Function of clearing the forms from the old data
function clearAddAndEditForm() {
    // Очищение предыдущих данных
    let inputs = document.querySelectorAll(`.form-grid input`)
    let textarea = document.querySelectorAll(`.form-grid textarea`)
    let elements = [...inputs, ...textarea];
    let errors = document.querySelectorAll('#courseModal .error-message');

    elements.forEach(e => {
        e.style.border = `2px solid var(--border)`
        e.value = '';
    })
    errors.forEach(e => {
        e.innerHTML = '';
        e.classList.add('hidden');
    })
}

openCreateCourseBtn.addEventListener('click', () => {
    document.getElementById('courseModalTitle').innerHTML = '<i class="fas fa-graduation-cap"></i> Создание курса';
    clearAddAndEditForm();
    openModal(courseModal);
});

let createCourseForm = document.getElementById('courseForm');
createCourseForm.addEventListener('submit', (event) => {
    saveCourse(event, createCourseForm)
})

let createLessonForm = document.getElementById('lessonForm');
createLessonForm.addEventListener('submit', (event) => {
    saveLesson(event, createLessonForm);
})

openCreateLessonBtn.addEventListener('click', () => {
    document.getElementById('lessonModalTitle').innerHTML = '<i class="fas fa-video"></i> Создание урока';
    clearAddAndEditForm();
    openModal(lessonModal);
});

editCourseButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('courseModalTitle').innerHTML = '<i class="fas fa-edit"></i> Редактирование курса';
        openModal(courseModal);
    });
});

// Processing the confirmation of deleting
document.addEventListener('click', (event) => {
    event.stopPropagation();
    let btn = event.target.closest('.delete-course')
    if (btn) {
        document.getElementById('confirmMessage').innerText = 'Вы уверены, что хотите удалить этот курс?';
        let deleteBtn = document.getElementById('confirmDeleteCourseBtn');
        deleteBtn.setAttribute('data-course-id', btn.dataset.courseId)
        openModal(deleteModal);
    }
})

// Deleting of the lessons
document.getElementById('confirmDeleteBtn').addEventListener('click', async function () {
    let courseId = this.dataset.courseId;
    let lessonId = this.dataset.lessonId;
    const url = `${BASE_URL}/courses/${courseId}/lessons/${lessonId}`;
    const options = {
        method: 'delete', headers: {
            Authorization: 'Bearer ' + localStorage.getItem('token')
        }
    }

    const data = await apiRequest(url, options, true);
    if (data['success']) {
        showMessage('success', data['message'])
        renderLessonsForCourse(courseId);
    } else {
        showMessage('danger', data['message'])
    }
    closeModal(confirmModal);
});

// Deleting of the course
document.getElementById('confirmDeleteCourseBtn').addEventListener('click', async function () {
    let courseId = this.dataset.courseId;
    const url = `${BASE_URL}/courses/${courseId}`;
    const options = {
        method: 'delete', headers: {
            Authorization: 'Bearer ' + localStorage.getItem('token')
        }
    }

    const data = await apiRequest(url, options, true);

    if (data['success']) {
        showMessage('success', data['message'])
        showCoursesContent(1);
    } else {
        showMessage('danger', data['message'])
    }

    closeModal(deleteModal);
});


// Save buttons of the forms
document.getElementById('saveCourseBtn').addEventListener('click', () => {
    let createForm = document.getElementById('courseForm');
    createForm.removeEventListener('submit', (event) => {
        saveCourse(event, createForm)
    })
});
document.getElementById('saveLessonBtn').addEventListener('click', () => {
    let createForm = document.getElementById('lessonForm')
    createForm.removeEventListener('submit', (event) => {
        saveLesson(event, createForm)
    })
});

// File preview
if (fileInput) {
    fileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            fileNameSpan.textContent = file.name;
            const reader = new FileReader();
            reader.onload = function (ev) {
                imagePreview.style.backgroundImage = `url('${ev.target.result}')`;
                imagePreview.classList.add('show');
            };
            reader.readAsDataURL(file);
        } else {
            fileNameSpan.textContent = 'Файл не выбран';
            imagePreview.style.backgroundImage = '';
            imagePreview.classList.remove('show');
        }
    });
}