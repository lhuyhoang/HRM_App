import * as EmployeeDB from './employeeDb.js';
import * as DeptDB from './department.js';
import * as PositionDB from './position.js';
import { createTable, showAlert, showConfirm } from './uiHelpers.js';
const STORAGE_KEY = 'hrm_leave_requests';
const readRequests = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
        console.error('Failed to parse leave requests', error);
        return [];
    }
};
const writeRequests = (requests) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
};
export const init = () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
        writeRequests([]);
    }
};
export const getAllRequests = () => readRequests();
export const addRequest = ({ employeeId, startDate, endDate, reason }) => {
    const requests = readRequests();
    const newRequest = {
        id: Date.now(),
        employeeId,
        startDate,
        endDate,
        reason,
        status: 'pending',
    };
    requests.push(newRequest);
    writeRequests(requests);
    return newRequest;
};
export const updateStatus = (id, status) => {
    const requests = readRequests();
    const updated = requests.map((request) =>
        request.id === id ? { ...request, status } : request
    );
    writeRequests(updated);
};
export const deleteRequest = (id) => {
    const requests = readRequests();
    const next = requests.filter((request) => request.id !== id);
    writeRequests(next);
};
const STATUS_LABELS = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
};
export const render = (container) => {
    init();
    const employees = EmployeeDB.getAllEmployees();
    if (employees.length === 0) {
        container.innerHTML = `
            <h2>Quản lý nghỉ phép</h2>
            <p>Vui lòng thêm nhân viên trước khi tạo yêu cầu nghỉ phép.</p>
        `;
        return;
    }
    const departments = DeptDB.getAllDepartments();
    const deptOptions = departments
        .map((dept) => `<option value="${dept.id}">${dept.name}</option>`)
        .join('');
    container.innerHTML = `
        <h2>Quản lý nghỉ phép</h2>
        <form id="leave-form" class="form-group">
            <label for="leave-department">Phòng ban</label>
            <select id="leave-department" required>
                <option value="">-- Chọn phòng ban --</option>
                ${deptOptions}
            </select>
            <label for="leave-position">Vị trí</label>
            <select id="leave-position" required disabled>
                <option value="">-- Chọn vị trí --</option>
            </select>
            <label for="leave-employee">Nhân viên</label>
            <select id="leave-employee" required disabled>
                <option value="">-- Chọn nhân viên --</option>
            </select>
            <label for="leave-start">Ngày bắt đầu</label>
            <input type="date" id="leave-start" required>
            <label for="leave-end">Ngày kết thúc</label>
            <input type="date" id="leave-end" required>
            <label for="leave-reason">Lý do</label>
            <input type="text" id="leave-reason" required placeholder="Nhập lý do">
            <button type="submit">Tạo yêu cầu</button>
        </form>
        <div id="leave-table"></div>
    `;
    const form = container.querySelector('#leave-form');
    const tableWrapper = container.querySelector('#leave-table');
    const deptSelect = form.querySelector('#leave-department');
    const positionSelect = form.querySelector('#leave-position');
    const employeeSelect = form.querySelector('#leave-employee');
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
        const requests = getAllRequests();
        const currentEmployees = EmployeeDB.getAllEmployees();
        if (requests.length === 0) {
            tableWrapper.innerHTML = '<p>Chưa có yêu cầu nghỉ phép.</p>';
            return;
        }
        const tableHtml = createTable(
            ['Nhân viên', 'Thời gian', 'Lý do', 'Trạng thái', 'Hành động'],
            requests,
            (request) => {
                const employee = currentEmployees.find((emp) => emp.id === request.employeeId);
                const statusLabel = STATUS_LABELS[request.status] || request.status;
                return `
                    <tr>
                        <td>${employee ? employee.name : 'N/A'} (${request.employeeId})</td>
                        <td>${request.startDate} → ${request.endDate}</td>
                        <td>${request.reason}</td>
                        <td>${statusLabel}</td>
                        <td>
                            <button data-action="approve" data-id="${request.id}">Duyệt</button>
                            <button data-action="reject" data-id="${request.id}">Từ chối</button>
                            <button class="danger" data-action="delete" data-id="${request.id}">Xóa</button>
                        </td>
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
        const startDate = form.querySelector('#leave-start').value;
        const endDate = form.querySelector('#leave-end').value;
        const reason = form.querySelector('#leave-reason').value.trim();
        if (!deptVal || !posVal || !employeeId || !startDate || !endDate || !reason) {
            showAlert('Vui lòng chọn phòng ban, vị trí, nhân viên và điền đầy đủ thông tin', 'error');
            return;
        }
        const emp = EmployeeDB.getEmployeeById(employeeId);
        if (!emp || emp.departmentId !== Number(deptVal) || emp.positionId !== Number(posVal)) {
            showAlert('Nhân viên không thuộc phòng ban/ vị trí đã chọn', 'error');
            return;
        }
        if (endDate < startDate) {
            showAlert('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu', 'error');
            return;
        }
        addRequest({ employeeId, startDate, endDate, reason });
        form.reset();
        deptSelect.value = '';
        resetSelect(positionSelect, '-- Chọn vị trí --', true);
        resetSelect(employeeSelect, '-- Chọn nhân viên --', true);
        showAlert('Đã tạo yêu cầu nghỉ phép');
        renderTable();
    });
    tableWrapper.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) {
            return;
        }
        const id = Number(button.dataset.id);
        if (Number.isNaN(id)) {
            return;
        }
        const action = button.dataset.action;
        if (action === 'approve' || action === 'reject') {
            updateStatus(id, action === 'approve' ? 'approved' : 'rejected');
            showAlert('Đã cập nhật trạng thái');
            renderTable();
            return;
        }
        if (action === 'delete') {
            const confirmed = await showConfirm('Xóa yêu cầu nghỉ phép này?');
            if (!confirmed) {
                return;
            }
            deleteRequest(id);
            showAlert('Đã xóa yêu cầu');
            renderTable();
        }
    });
    renderTable();
};
