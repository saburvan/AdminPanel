import {getColors, showMessage} from "./script.js";

const link = document.querySelector('.additionalStyle')
link.addEventListener('changeTheme', () => {
    const colors = getColors();
    const pieColors = colors['pieColors'].map(function (item) {return item.value})
    console.log(pieColors)
    const primaryText = colors.filter((item) => item.name === '--text-primary')[0].value
    const accentText = colors.filter((item) => item.name === '--accent')[0].value
    const border = colors.filter((item) => item.name === '--border')[0].value
    if (pieChart) {
        pieChart.data.datasets[0].backgroundColor = pieColors;
        pieChart.options.plugins.legend.labels.color = colors.filter((item) => item.name === '--text-primary')[0].value
        pieChart.update()
    }
    if (revenueChart) {
        revenueChart.data.datasets[0].borderColor = border
        revenueChart.data.datasets[0].backgroundColor = accentText + '99'
        revenueChart.data.datasets[0].pointBackgroundColor = border
        revenueChart.data.datasets[0].pointBorderColor = primaryText + '99'
        revenueChart.options.plugins.datalabels.color = primaryText
        revenueChart.update()
    }
    if (topCoursesChart) {
        topCoursesChart.data.datasets[0].borderColor = border
        topCoursesChart.data.datasets[0].backgroundColor = accentText
        topCoursesChart.options.plugins.datalabels.color = primaryText
        topCoursesChart.update();
    }
})

// ---------- Initializing of the charts ----------
const Chart = window.Chart
const ChartDataLabels = window.ChartDataLabels

// Registration of the plugin in order to use data labels
Chart.register(ChartDataLabels);

let revenueChart, pieChart, topCoursesChart;

export const initCharts = (info) => {
    const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
    const colors = getColors();
    const primaryText = colors.filter((item) => item.name === '--text-primary')[0].value
    const accentText = colors.filter((item) => item.name === '--accent')[0].value
    const border = colors.filter((item) => item.name === '--border')[0].value
    if (revenueCtx) {
        if (revenueChart) revenueChart.destroy();

        const data = info['revenue']['values'];
        const months = info['revenue']['dates'];

        revenueChart = new Chart(revenueCtx, {
            type: 'line', data: {
                labels: months, datasets: [{
                    label: 'Выручка (руб.)',
                    data: data,
                    borderColor: border,
                    backgroundColor: accentText + '99', // 99 is opacity for hex code
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: border,
                    pointBorderColor: primaryText + '99',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            }, options: {
                responsive: true, maintainAspectRatio: false, plugins: {
                    legend: {display: false}, tooltip: {
                        callbacks: {
                            label: (context) => `${context.raw} руб.`,
                            color: primaryText
                        },
                    }, datalabels: {
                        align: 'top', color: primaryText, font: {weight: 'bold'}, formatter: (value) => value
                    }
                }, scales: {
                    y: {
                        beginAtZero: true, ticks: {
                            callback: (value) => value + ' руб.'
                        }
                    }
                }
            }
        });
    }

    // Pie chart
    const pieCtx = document.getElementById('pieChart')?.getContext('2d');
    if (pieCtx) {
        if (pieChart) pieChart.destroy();
        // Оттенки фиолетового от светлого к темному
        const colors = getColors();
        const pieColors = colors['pieColors'].map(function (item) {return item.value})

        pieChart = new Chart(pieCtx, {
            type: 'pie', data: {
                labels: info['pie']['labels'], datasets: [{
                    data: info['pie']['values'], backgroundColor: pieColors, borderWidth: 0
                }]
            }, options: {
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                responsive: true, maintainAspectRatio: false, plugins: {
                    legend: {
                        tooltip: {
                            callbacks: {
                                label: (context) => `${context.raw} руб.`,
                                color: primaryText
                            },
                        },
                        position: 'right', labels: {
                            font: {
                                size: 12, weight: '500'
                            }, padding: 20, color: primaryText
                        }
                    }, datalabels: {
                        color: '#ffffff',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: 6,
                        padding: {top: 6, bottom: 6, left: 8, right: 8},
                        font: {weight: 'bold', size: 12},
                        formatter: (value) => value + '%'
                    }
                }
            }
        });
    }

    // Course bar chart
    const topCtx = document.getElementById('topCoursesChart')?.getContext('2d');
    if (topCtx) {
        if (topCoursesChart) topCoursesChart.destroy();
        topCoursesChart = new Chart(topCtx, {
            type: 'bar', data: {
                labels: ['JavaScript', 'React', 'Python', 'DevOps', 'UI/UX', 'Go', 'Java', 'PHP', 'Swift', 'Kotlin'],
                datasets: [{
                    label: 'Количество записей',
                    data: [245, 189, 156, 112, 98, 76, 54, 43, 38, 29],
                    backgroundColor: accentText,
                    borderRadius: 6
                }]
            }, options: {
                responsive: true, maintainAspectRatio: false, plugins: {
                    legend: {display: false}, datalabels: {
                        anchor: 'end',
                        align: 'bottom',
                        offset: 4,
                        color: primaryText,
                        font: {weight: 'bold', size: 16},
                        formatter: (value) => value,
                    }
                }, scales: {
                    y: {
                        beginAtZero: true, ticks: {
                            callback: (value) => value + ' зап.'
                        }
                    }
                }
            }
        });
    }
}

export const getStats = async () => {
    let form = document.querySelector('#incomeForm')
    let formData = new FormData(form);

    const url = 'http://127.0.0.1:8000/api/stats/revenue';
    const options = {
        method: 'post', headers: {
            Authorization: 'Bearer ' + localStorage.getItem('token')
        }, body: formData
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();

        return {
            'revenue': {
                'dates': data['revenue']['dates'], 'values': data['revenue']['values']
            }, 'pie': {
                'labels': data['pie']['labels'], 'values': data['pie']['values']
            }
        }
    } catch (error) {
        showMessage('danger', 'Произошла ошибка, попробуйте снова или повторите позже')
    }
}

export const getTop = async () => {
    let form = document.querySelector('#topForm')
    let formData = new FormData(form);

    const url = 'http://127.0.0.1:8000/api/stats/top';
    const options = {
        method: 'post', headers: {
            Authorization: 'Bearer ' + localStorage.getItem('token')
        }, body: formData
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();

        return {
            'top': {
                'names': data['top']['names'], 'values': data['top']['values']
            }
        }
    } catch (error) {
        showMessage('danger', 'Произошла ошибка, попробуйте снова или повторите позже')
    }
}

// Processing
let form = document.querySelector('#incomeForm')
form.addEventListener('click', async (event) => {
    event.preventDefault()
    const info = await getStats();

    // Для линейной диаграммы
    revenueChart.data.datasets[0].data = info['revenue']['values']
    revenueChart.data.labels = info['revenue']['dates']
    revenueChart.update()

    // Для круговой диаграммы с анимацией
    if (pieChart) {
        // Временно увеличиваем длительность анимации
        const originalDuration = pieChart.options.animation.duration;
        pieChart.options.animation.duration = 1500; // Увеличиваем для плавности

        // Обновляем данные
        pieChart.data.datasets[0].data = info['pie']['values']
        pieChart.data.labels = info['pie']['labels']

        // Обновляем с анимацией
        pieChart.update();

        // Возвращаем оригинальную длительность после анимации
        setTimeout(() => {
            if (pieChart) {
                pieChart.options.animation.duration = originalDuration;
            }
        }, 1600);
    }
});

let topForm = document.querySelector('#topForm')
topForm.addEventListener('click', async (event) => {
    event.preventDefault()
    const data = await getTop();
    topCoursesChart.data.datasets[0].data = data['top']['values'];
    topCoursesChart.data.labels = data['top']['names'];
    topCoursesChart.update();
});

function defaultDiagram() {
    let endMonth = document.getElementById('endMonth');
    let endYear = document.getElementById('endYear')
    let startMonth = document.getElementById('startMonth');
    let startYear = document.getElementById('startYear')

    let now = new Date();
    endMonth.value = now.getMonth() + 1;
    endYear.value = now.getFullYear();
    startMonth.value = now.getMonth() + 1;
    startYear.value = now.getFullYear() - 1;
}

// Initializing when loaded
window.addEventListener('load', () => {
    setTimeout(async () => {
        defaultDiagram();
        const info = await getStats();
        initCharts(info)
    }, 500)

});

setTimeout(async () => {
    const info = await getStats();
    revenueChart.data.datasets[0].data = info['revenue']['values']
    revenueChart.data.labels = info['revenue']['dates']
    revenueChart.update()
}, 1000);

export {revenueChart, pieChart, topCoursesChart};