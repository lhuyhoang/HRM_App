import * as DeptDB from './department.js';
import { createTable, showAlert, showConfirm } from './uiHelpers.js';
const POSITION_KEY = 'hrm_positions';
const initialData = () => [];
const savePositions = (positions) => {
    localStorage.setItem(POSITION_KEY, JSON.stringify(positions));
};
export const init = () => {
    if (!localStorage.getItem(POSITION_KEY)) {
        savePositions(initialData());
    }
};
export const getAllPositions = () => {
    try {
        return JSON.parse(localStorage.getItem(POSITION_KEY)) || [];
    } catch (error) {
        console.error('Failed to parse positions from storage', error);
        return [];
    }
};
export const getPositionById = (id) => getAllPositions().find((pos) => pos.id === id) || null;
export const getPositionsByDepartment = (departmentId) => {
    return getAllPositions().filter((pos) => pos.departmentId === departmentId);
};
export const addPosition = ({ title, departmentId = null, baseSalary = 0 }) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
        throw new Error('Position title is required');
    }
    const positions = getAllPositions();
    const newPosition = {
        id: Date.now(),
        title: trimmedTitle,
        departmentId,
        baseSalary: Number.isFinite(baseSalary) ? baseSalary : 0,
    };
    positions.push(newPosition);
    savePositions(positions);
    return newPosition;
};
export const updatePosition = (updatedPosition) => {
    const positions = getAllPositions();
    const nextPositions = positions.map((pos) => (pos.id === updatedPosition.id ? updatedPosition : pos));
    savePositions(nextPositions);
};
export const deletePosition = (id) => {
    const positions = getAllPositions();
    const nextPositions = positions.filter((pos) => pos.id !== id);
    if (nextPositions.length === positions.length) {
        return false;
    }
    savePositions(nextPositions);
    return true;
};
const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(Number(value) || 0);
};
export const render = (container) => {
    init();
    const departments = DeptDB.getAllDepartments();
    const departmentOptions = departments
        .map((dept) => `<option value="${dept.id}">${dept.name}</option>`)
        .join('');
    container.innerHTML = `
		<h2>Quản lý vị trí</h2>
		${departments.length === 0
            ? '<p>Vui lòng tạo phòng ban trước khi thêm vị trí.</p>'
            : `
			<form id="position-form">
				<div class="form-group">
					<label for="position-title">Tên vị trí</label>
					<input type="text" id="position-title" required>
				</div>
				<div class="form-group">
					<label for="position-department">Phòng ban</label>
					<select id="position-department" required>
						<option value="">-- Chọn phòng ban --</option>
						${departmentOptions}
					</select>
				</div>
				<div class="form-group">
					<label for="position-salary">Lương cơ bản (VND)</label>
					<input type="number" id="position-salary" min="0" step="100000" placeholder="0">
				</div>
				<button type="submit">Thêm vị trí</button>
			</form>
		`
        }
		<div id="position-table"></div>
	`;
    const tableWrapper = container.querySelector('#position-table');
    const renderTable = () => {
        const positions = getAllPositions();
        if (positions.length === 0) {
            tableWrapper.innerHTML = '<p>Chưa có vị trí nào.</p>';
            return;
        }
        const tableHtml = createTable(
            ['ID', 'Tên vị trí', 'Phòng ban', 'Lương cơ bản (VND)', 'Hành động'],
            positions,
            (pos) => {
                const department = DeptDB.getAllDepartments().find((dept) => dept.id === pos.departmentId);
                const departmentName = department ? department.name : 'Không xác định';
                const salaryLabel = pos.baseSalary ? `${formatCurrency(pos.baseSalary)}` : '0';
                return `
					<tr>
						<td>${pos.id}</td>
						<td>${pos.title}</td>
						<td>${departmentName}</td>
						<td>${salaryLabel}</td>
						<td><button class="danger" data-action="delete" data-id="${pos.id}">Xóa</button></td>
					</tr>
				`;
            }
        );
        tableWrapper.innerHTML = tableHtml;
    };
    renderTable();
    const form = container.querySelector('#position-form');
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const titleInput = form.querySelector('#position-title');
            const departmentSelect = form.querySelector('#position-department');
            const salaryInput = form.querySelector('#position-salary');
            const title = titleInput.value.trim();
            const departmentValue = departmentSelect.value;
            const baseSalary = Number(salaryInput.value);
            if (!title) {
                showAlert('Tên vị trí không được để trống', 'error');
                return;
            }
            if (!departmentValue) {
                showAlert('Vui lòng chọn phòng ban', 'error');
                return;
            }
            const departmentId = Number(departmentValue);
            try {
                addPosition({
                    title,
                    departmentId,
                    baseSalary: Number.isFinite(baseSalary) ? baseSalary : 0,
                });
                showAlert('Thêm vị trí thành công');
                form.reset();
                renderTable();
            } catch (error) {
                console.error(error);
                showAlert('Không thể thêm vị trí', 'error');
            }
        });
    }
    tableWrapper.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-action="delete"]');
        if (!button) {
            return;
        }
        const id = Number(button.dataset.id);
        if (Number.isNaN(id)) {
            return;
        }
        const confirmed = await showConfirm('Bạn có chắc chắn muốn xóa vị trí này?');
        if (!confirmed) {
            return;
        }
        if (deletePosition(id)) {
            showAlert('Đã xóa vị trí');
            renderTable();
        } else {
            showAlert('Không tìm thấy vị trí để xóa', 'error');
        }
    });
};
