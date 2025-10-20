import * as EmployeeDB from './employeeDb.js';
import * as DeptDB from './department.js';
import * as PositionDB from './position.js';
import { createTable, showAlert, showConfirm } from './uiHelpers.js';
const STORAGE_KEY = 'hrm_attendance_records';
const readRecords = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
        console.error('Failed to parse attendance records', error);
        return [];
    }
};
const writeRecords = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};
export const init = () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
        writeRecords([]);
    }
};
export const getAllRecords = () => readRecords();
export const addRecord = ({ employeeId, date, status, note }) => {
    const records = readRecords();
    const newRecord = {
        id: Date.now(),
        employeeId,
        date,
        status,
        note,
    };
    records.push(newRecord);
    writeRecords(records);
    return newRecord;
};
export const deleteRecord = (id) => {
    const records = readRecords();
    const next = records.filter((record) => record.id !== id);
    writeRecords(next);
};
const ATTENDANCE_STATUSES = [
    { value: 'present', label: 'Có mặt' },
    { value: 'absent', label: 'Vắng mặt' },
    { value: 'late', label: 'Đi trễ' },
    { value: 'remote', label: 'Làm từ xa' },
];
export const render = (container) => {
    init();
    const employees = EmployeeDB.getAllEmployees();
    if (employees.length === 0) {
        container.innerHTML = `
            <h2>Chấm công</h2>
            <p>Vui lòng thêm nhân viên trước khi sử dụng chức năng chấm công.</p>
        `;
        return;
    }
    const departments = DeptDB.getAllDepartments();
    const deptOptions = departments
        .map((dept) => `<option value="${dept.id}">${dept.name}</option>`)
        .join('');
    const statusOptions = ATTENDANCE_STATUSES
        .map((status) => `<option value="${status.value}">${status.label}</option>`)
        .join('');
    container.innerHTML = `
        <h2>Chấm công</h2>
        <form id="attendance-form" class="form-group">
            <label for="attendance-department">Phòng ban</label>
            <select id="attendance-department" required>
                <option value="">-- Chọn phòng ban --</option>
                ${deptOptions}
            </select>
            <label for="attendance-position">Vị trí</label>
            <select id="attendance-position" required disabled>
                <option value="">-- Chọn vị trí --</option>
            </select>
            <label for="attendance-employee">Nhân viên</label>
            <select id="attendance-employee" required disabled>
                <option value="">-- Chọn nhân viên --</option>
            </select>
            <label for="attendance-date">Ngày</label>
            <input type="date" id="attendance-date" required>
            <label for="attendance-status">Trạng thái</label>
            <select id="attendance-status" required>
                ${statusOptions}
            </select>
            <label for="attendance-note">Ghi chú</label>
            <input type="text" id="attendance-note" placeholder="Ghi chú (không bắt buộc)">
            <button type="submit">Lưu</button>
        </form>
        <div id="attendance-table"></div>
    `;
    const form = container.querySelector('#attendance-form');
    const tableWrapper = container.querySelector('#attendance-table');
    const dateInput = form.querySelector('#attendance-date');
    const deptSelect = form.querySelector('#attendance-department');
    const positionSelect = form.querySelector('#attendance-position');
    const employeeSelect = form.querySelector('#attendance-employee');
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    dateInput.setAttribute('max', todayStr);
    if (!dateInput.value) {
        dateInput.value = todayStr;
    }
    const resetSelect = (selectEl, placeholder, disabled = true) => {
        selectEl.innerHTML = `<option value="">${placeholder}</option>`;
        selectEl.disabled = disabled;
    };
    const populatePositions = (departmentId) => {
        const positions = PositionDB.getPositionsByDepartment(departmentId);
        const options = positions.map((pos) => `<option value="${pos.id}">${pos.title}</option>`).join('');
        positionSelect.innerHTML = `<option value="">-- Chọn vị trí --</option>${options}`;
        positionSelect.disabled = positions.length === 0;
    };
    const populateEmployees = (departmentId, positionId) => {
        const filtered = EmployeeDB.getAllEmployees().filter(
            (emp) => emp.departmentId === departmentId && emp.positionId === positionId
        );
        const options = filtered.map((emp) => `<option value="${emp.id}">${emp.name} (${emp.id})</option>`).join('');
        employeeSelect.innerHTML = `<option value="">-- Chọn nhân viên --</option>${options}`;
        employeeSelect.disabled = filtered.length === 0;
    };
    resetSelect(positionSelect, '-- Chọn vị trí --', true);
    resetSelect(employeeSelect, '-- Chọn nhân viên --', true);

    deptSelect.addEventListener('change', () => {
        const deptVal = deptSelect.value;
        resetSelect(positionSelect, '-- Chọn vị trí --', true);
        resetSelect(employeeSelect, '-- Chọn nhân viên --', true);
        if (!deptVal) return;
        populatePositions(Number(deptVal));
    });
    positionSelect.addEventListener('change', () => {
        const deptVal = deptSelect.value;
        const posVal = positionSelect.value;
        resetSelect(employeeSelect, '-- Chọn nhân viên --', true);
        if (!deptVal || !posVal) return;
        populateEmployees(Number(deptVal), Number(posVal));
    });
    const renderTable = () => {
        const records = getAllRecords();
        const currentEmployees = EmployeeDB.getAllEmployees();
        if (records.length === 0) {
            tableWrapper.innerHTML = '<p>Chưa có dữ liệu chấm công.</p>';
            return;
        }
        const tableHtml = createTable(
            ['Nhân viên', 'Ngày', 'Trạng thái', 'Ghi chú', 'Hành động'],
            records,
            (record) => {
                const employee = currentEmployees.find((emp) => emp.id === record.employeeId);
                const statusLabel = ATTENDANCE_STATUSES.find((item) => item.value === record.status)?.label || record.status;
                return `
                    <tr>
                        <td>${employee ? employee.name : 'N/A'} (${record.employeeId})</td>
                        <td>${record.date}</td>
                        <td>${statusLabel}</td>
                        <td>${record.note || ''}</td>
                        <td><button class="danger" data-id="${record.id}">Xóa</button></td>
                    </tr>
                `;
            }
        );
        tableWrapper.innerHTML = tableHtml;
    };
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const deptVal = deptSelect.value;
        const posVal = positionSelect.value;
        const employeeId = employeeSelect.value;
        const date = form.querySelector('#attendance-date').value;
        const status = form.querySelector('#attendance-status').value;
        const note = form.querySelector('#attendance-note').value.trim();
        if (!deptVal || !posVal || !employeeId || !date || !status) {
            showAlert('Vui lòng chọn phòng ban, vị trí và nhân viên, cũng như điền đủ thông tin', 'error');
            return;
        }
        const emp = EmployeeDB.getEmployeeById(employeeId);
        if (!emp || emp.departmentId !== Number(deptVal) || emp.positionId !== Number(posVal)) {
            showAlert('Nhân viên không thuộc phòng ban/ vị trí đã chọn', 'error');
            return;
        }
        if (date > todayStr) {
            showAlert('Ngày chấm công chỉ được là hôm nay hoặc ngày trong quá khứ', 'error');
            return;
        }
        addRecord({ employeeId, date, status, note });
        form.reset();
        dateInput.setAttribute('max', todayStr);
        dateInput.value = todayStr;
        deptSelect.value = '';
        resetSelect(positionSelect, '-- Chọn vị trí --', true);
        resetSelect(employeeSelect, '-- Chọn nhân viên --', true);
        showAlert('Đã lưu chấm công');
        renderTable();
    });
    tableWrapper.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-id]');
        if (!button) {
            return;
        }
        const id = Number(button.dataset.id);
        if (Number.isNaN(id)) {
            return;
        }
        const confirmed = await showConfirm('Xóa bản ghi chấm công này?');
        if (!confirmed) {
            return;
        }
        deleteRecord(id);
        showAlert('Đã xóa bản ghi');
        renderTable();
    });
    renderTable();
};
