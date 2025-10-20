import * as db from './employeeDb.js';
import * as deptDb from './department.js';
import * as posDb from './position.js';
import { showAlert } from './uiHelpers.js';
export const render = (container) => {
    const departments = deptDb.getAllDepartments();
    const positions = posDb.getAllPositions();
    if (departments.length === 0 || positions.length === 0) {
        container.innerHTML = `
            <h2>Thêm Nhân viên Mới</h2>
            <p>Vui lòng tạo phòng ban và vị trí trước khi thêm nhân viên.</p>
        `;
        return;
    }
    const deptOptions = departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    const posOptions = positions.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
    container.innerHTML = `
    <h2>Thêm Nhân viên Mới</h2>
        <form id="add-employee-form">
            <div class="form-group">
                <label for="name">Họ và Tên</label>
                <input type="text" id="name" required>
            </div>
            <div class="form-group">
                <label for="department">Phòng ban</label>
                <select id="department" required>${deptOptions}</select>
            </div>
            <div class="form-group">
                <label for="position">Vị trí</label>
                <select id="position" required>${posOptions}</select>
            </div>
            <div class="form-group">
                <label for="salary">Lương ($)</label>
                <input type="number" id="salary" required min="0">
            </div>
            <div class="form-group">
                <label for="hireDate">Ngày vào làm</label>
                <input type="date" id="hireDate" required>
            </div>
            <button type="submit">Thêm Nhân viên</button>
        </form>
    `;
    const form = container.querySelector('#add-employee-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const newEmployee = {
            name: container.querySelector('#name').value.trim(),
            departmentId: Number(container.querySelector('#department').value),
            positionId: Number(container.querySelector('#position').value),
            salary: Number.parseFloat(container.querySelector('#salary').value),
            hireDate: container.querySelector('#hireDate').value,
            bonus: 0,
            deduction: 0
        };
        if (!newEmployee.name || Number.isNaN(newEmployee.salary) || newEmployee.salary <= 0) {
            showAlert('Dữ liệu không hợp lệ', 'error');
            return;
        }
        db.addEmployee(newEmployee);
        showAlert('Thêm nhân viên thành công');
        form.reset();
    });
};