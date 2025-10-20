import * as EmployeeDB from './employeeDb.js';
import * as DeptDB from './department.js';
import { createTable, showAlert } from './uiHelpers.js';
export const render = (container) => {
    const employees = EmployeeDB.getAllEmployees();

    if (employees.length === 0) {
        container.innerHTML = `
            <h2>Bảng lương</h2>
            <p>Chưa có nhân viên để hiển thị lương.</p>
        `;
        return;
    }
    const departments = DeptDB.getAllDepartments();
    const deptOptions = [`<option value="">-- Tất cả phòng ban --</option>`]
        .concat(departments.map((d) => `<option value="${d.id}">${d.name}</option>`))
        .join('');
    container.innerHTML = `
        <h2>Bảng lương</h2>
        <p>Cập nhật thưởng và khấu trừ cho từng nhân viên để tính lương thực lĩnh.</p>
        <div class="form-group">
            <label for="salary-department-filter">Lọc theo phòng ban</label>
            <select id="salary-department-filter">
                ${deptOptions}
            </select>
        </div>
        <div id="salary-table"></div>
    `;
    const tableWrapper = container.querySelector('#salary-table');
    const deptFilter = container.querySelector('#salary-department-filter');
    let selectedDeptId = '';
    const getFilteredEmployees = () => {
        const latest = EmployeeDB.getAllEmployees();
        if (!selectedDeptId) return latest;
        const deptIdNum = Number(selectedDeptId);
        return latest.filter((emp) => emp.departmentId === deptIdNum);
    };
    const renderTable = () => {
        const latestEmployees = getFilteredEmployees();
        if (latestEmployees.length === 0) {
            tableWrapper.innerHTML = '<p>Không có nhân viên thuộc phòng ban đã chọn.</p>';
            return;
        }
        const tableHtml = createTable(
            ['ID', 'Tên', 'Lương cơ bản', 'Thưởng', 'Khấu trừ', 'Thực lĩnh', 'Hành động'],
            latestEmployees,
            (emp) => {
                const baseSalary = Number(emp.salary) || 0;
                const bonus = Number(emp.bonus) || 0;
                const deduction = Number(emp.deduction) || 0;
                const netSalary = baseSalary + bonus - deduction;
                return `
                    <tr>
                        <td>${emp.id}</td>
                        <td>${emp.name}</td>
                        <td>${baseSalary.toLocaleString()}</td>
                        <td><input type="number" class="bonus-input" data-id="${emp.id}" value="${bonus}" min="0"></td>
                        <td><input type="number" class="deduction-input" data-id="${emp.id}" value="${deduction}" min="0"></td>
                        <td>${netSalary.toLocaleString()}</td>
                        <td><button data-action="save" data-id="${emp.id}">Lưu</button></td>
                    </tr>
                `;
            }
        );
        tableWrapper.innerHTML = tableHtml;
    };
    deptFilter.addEventListener('change', () => {
        selectedDeptId = deptFilter.value;
        renderTable();
    });
    tableWrapper.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action="save"]');
        if (!button) {
            return;
        }
        const id = button.dataset.id;
        const bonusInput = tableWrapper.querySelector(`.bonus-input[data-id="${id}"]`);
        const deductionInput = tableWrapper.querySelector(`.deduction-input[data-id="${id}"]`);
        if (!bonusInput || !deductionInput) {
            return;
        }
        const bonus = Number.parseFloat(bonusInput.value) || 0;
        const deduction = Number.parseFloat(deductionInput.value) || 0;
        const employee = EmployeeDB.getEmployeeById(id);
        if (!employee) {
            showAlert('Không tìm thấy nhân viên', 'error');
            return;
        }
        EmployeeDB.updateEmployee({
            ...employee,
            bonus,
            deduction,
        });
        showAlert('Đã cập nhật bảng lương');
        renderTable();
    });
    renderTable();
};
