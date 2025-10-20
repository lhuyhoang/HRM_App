import { createTable, showAlert, showConfirm } from './uiHelpers.js';
const DEPARTMENT_KEY = 'hrm_departments';
const initialData = () => [];
const saveDepartments = (departments) => {
    localStorage.setItem(DEPARTMENT_KEY, JSON.stringify(departments));
};
export const init = () => {
    if (!localStorage.getItem(DEPARTMENT_KEY)) {
        saveDepartments(initialData());
    }
};
export const getAllDepartments = () => {
    try {
        return JSON.parse(localStorage.getItem(DEPARTMENT_KEY)) || [];
    } catch (error) {
        console.error('Failed to parse departments from storage', error);
        return [];
    }
};
export const addDepartment = (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
        throw new Error('Tên phòng ban không được để trống');
    }
    const departments = getAllDepartments();
    const isDuplicate = departments.some(
        (dept) => dept.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
        throw new Error('Phòng ban đã tồn tại');
    }
    const newDepartment = {
        id: Date.now(),
        name: trimmedName,
    };
    departments.push(newDepartment);
    saveDepartments(departments);
    return newDepartment;
};
export const deleteDepartment = (id) => {
    const departments = getAllDepartments();
    const nextDepartments = departments.filter((dept) => dept.id !== id);
    if (nextDepartments.length === departments.length) {
        return false;
    }
    saveDepartments(nextDepartments);
    return true;
};
export const render = (container) => {
    init();
    const renderTable = () => {
        const departments = getAllDepartments();
        const tableWrapper = container.querySelector('#department-table');
        if (!tableWrapper) {
            return;
        }
        if (departments.length === 0) {
            tableWrapper.innerHTML = '<p>Chưa có phòng ban nào.</p>';
            return;
        }
        const tableHtml = createTable(
            ['ID', 'Tên phòng ban', 'Hành động'],
            departments,
            (dept) => `
                <tr>
                    <td>${dept.id}</td>
                    <td>${dept.name}</td>
                    <td><button class="danger" data-action="delete" data-id="${dept.id}">Xóa</button></td>
                </tr>
            `
        );
        tableWrapper.innerHTML = tableHtml;
    };
    container.innerHTML = `
        <h2>Quản lý phòng ban</h2>
        <form id="department-form" class="form-group">
            <label for="new-department-name" class="sr-only">Tên phòng ban mới</label>
            <input type="text" id="new-department-name" placeholder="Tên phòng ban mới" required />
            <button type="submit" id="add-department">Thêm</button>
        </form>
        <div id="department-table"></div>
    `;
    const form = container.querySelector('#department-form');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const input = form.querySelector('#new-department-name');
        try {
            addDepartment(input.value);
            input.value = '';
            showAlert('Thêm phòng ban thành công');
            renderTable();
        } catch (error) {
            showAlert(error.message || 'Không thể thêm phòng ban', 'error');
        }
    });
    container.querySelector('#department-table').addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-action="delete"]');
        if (!button) {
            return;
        }
        const id = Number(button.dataset.id);
        if (Number.isNaN(id)) {
            return;
        }
        const confirmed = await showConfirm('Bạn có chắc chắn muốn xóa phòng ban này?');
        if (!confirmed) {
            return;
        }
        if (deleteDepartment(id)) {
            showAlert('Đã xóa phòng ban');
            renderTable();
        } else {
            showAlert('Không tìm thấy phòng ban để xóa', 'error');
        }
    });
    renderTable();
};
