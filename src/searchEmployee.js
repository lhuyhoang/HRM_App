import * as db from './employeeDb.js';
import * as deptDb from './department.js';
import { createTable, showAlert, showConfirm } from './uiHelpers.js';
import { render as renderEditForm } from './editEmployee.js';
export const render = (container) => {
    const departments = deptDb.getAllDepartments();
    const deptOptions = departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    container.innerHTML = `
        <h2>Tìm kiếm, Sửa và Xóa Nhân viên</h2>
        <div class="form-container" style="max-width: none; padding: 1rem; background: var(--secondary-color);">
            <div class="form-group">
                <input type="text" id="search-name" placeholder="Tìm theo tên...">
                <select id="search-dept">
                    <option value="">Tất cả phòng ban</option>
                    ${deptOptions}
                </select>
                <button id="search-btn">Tìm kiếm</button>
            </div>
        </div>
        <div id="search-results"></div>
        <div id="edit-form-container"></div>
    `;
    const searchBtn = document.getElementById('search-btn');
    const resultsContainer = document.getElementById('search-results');
    const editContainer = document.getElementById('edit-form-container');
    const performSearch = () => {
        const nameQuery = document.getElementById('search-name').value.toLowerCase();
        const deptQuery = document.getElementById('search-dept').value;
        const results = db.findEmployees(emp => {
            const nameMatch = emp.name.toLowerCase().includes(nameQuery);
            const deptMatch = deptQuery ? emp.departmentId == deptQuery : true;
            return nameMatch && deptMatch;
        });
        displayResults(results);
    };
    const displayResults = (employees) => {
        if (employees.length === 0) {
            resultsContainer.innerHTML = '<p>Không tìm thấy nhân viên nào.</p>';
            return;
        }
        const table = createTable(
            ['ID', 'Tên', 'Phòng ban', 'Lương', 'Hành động'],
            employees,
            (emp) => {
                const department = deptDb.getAllDepartments().find(d => d.id === emp.departmentId);
                return `
                    <tr>
                        <td>${emp.id}</td>
                        <td>${emp.name}</td>
                        <td>${department ? department.name : 'N/A'}</td>
                        <td>$${emp.salary.toLocaleString()}</td>
                        <td>
                            <button class="edit-btn" data-id="${emp.id}">Sửa</button>
                            <button class="danger delete-btn" data-id="${emp.id}">Xóa</button>
                        </td>
                    </tr>
                `
            }
        );
        resultsContainer.innerHTML = table;
    };
    searchBtn.addEventListener('click', performSearch);
    resultsContainer.addEventListener('click', async (e) => {
        const target = e.target;
        const employeeId = target.dataset.id;
        if (target.classList.contains('delete-btn')) {
            const confirmed = await showConfirm(`Bạn có chắc chắn muốn xóa nhân viên có ID ${employeeId}?`);
            if (!confirmed) {
                return;
            }
            db.deleteEmployee(employeeId);
            showAlert('Xóa nhân viên thành công!');
            performSearch();
        }
        if (target.classList.contains('edit-btn')) {
            renderEditForm(editContainer, employeeId, () => {
                editContainer.innerHTML = '';
                performSearch();
            });
        }
    });
    performSearch();
};