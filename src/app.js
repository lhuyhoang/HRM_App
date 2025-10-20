import * as Auth from './auth.js';
import * as Register from './register.js';
import * as EmployeeDB from './employeeDb.js';
import * as DeptDB from './department.js';
import * as AddEmployee from './addEmployee.js';
import * as SearchEmployee from './searchEmployee.js';
import * as Department from './department.js';
import * as Position from './position.js';
import * as Salary from './salary.js';
import * as Attendance from './attendance.js';
import * as Leaves from './leaves.js';
import * as Performance from './performance.js';
const authContainer = document.getElementById('auth-container');
const mainDashboard = document.getElementById('main-dashboard');
const sidebar = document.getElementById('sidebar');
const logoutBtn = document.getElementById('logout-btn');
const appContent = document.getElementById('app-content');
const routes = {
    'addEmployee': AddEmployee.render,
    'searchEmployee': SearchEmployee.render,
    'department': Department.render,
    'departments': Department.render,
    'dashboard': (container) => {
        container.innerHTML = `
            <h2>Chào mừng đến với Hệ thống HRM!</h2>
            <p>Chọn một chức năng từ menu bên trái để bắt đầu.</p>
        `;
    },
    'positions': Position.render,
    'salary': Salary.render,
    'attendance': Attendance.render,
    'leaves': Leaves.render,
    'performance': Performance.render,
};
const navigateTo = (moduleName) => {
    if (!Auth.isAuthenticated()) {
        showLogin();
        return;
    }
    const renderFunction = routes[moduleName];
    if (renderFunction) {
        renderFunction(appContent);
    } else {
        routes['dashboard'](appContent);
    }
};
const showDashboard = () => {
    authContainer.classList.add('hidden');
    mainDashboard.classList.remove('hidden');
    navigateTo('dashboard');
};
const showLogin = () => {
    mainDashboard.classList.add('hidden');
    authContainer.classList.remove('hidden');
    Auth.renderLogin(authContainer, showDashboard, showRegister);
};
const showRegister = () => {
    mainDashboard.classList.add('hidden');
    authContainer.classList.remove('hidden');
    Register.render(authContainer, showLogin);
};
const handleLogout = () => {
    Auth.logout();
    showLogin();
};
const initializeApp = () => {
    EmployeeDB.init();
    DeptDB.init();
    Position.init();
    Attendance.init();
    Leaves.init();
    Performance.init();
    if (Auth.isAuthenticated()) {
        showDashboard();
    } else {
        showLogin();
    }
};
sidebar.addEventListener('click', (e) => {
    e.preventDefault();
    if (e.target.tagName === 'A' && e.target.dataset.module) {
        if (!Auth.isAuthenticated()) {
            showLogin();
            return;
        }
        const moduleName = e.target.dataset.module;
        navigateTo(moduleName);
    }
});
logoutBtn.addEventListener('click', handleLogout);
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}