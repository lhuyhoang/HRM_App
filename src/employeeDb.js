const EMPLOYEE_KEY = `hrm_employees`;
const initialData = () => [];
export const init = () => {
    if (!localStorage.getItem(EMPLOYEE_KEY)) {
        localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(initialData()));
    }
};
export const getAllEmployees = () => {
    return JSON.parse(localStorage.getItem(EMPLOYEE_KEY)) || [];
};
export const saveEmployees = (employees) => {
    localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(employees));
};
export const getEmployeeById = (id) => {
    return getAllEmployees().find(emp => emp.id === id);
};
export const findEmployees = (filterFn) => {
    return getAllEmployees().filter(filterFn);
};
export const addEmployee = (employee) => {
    const employees = getAllEmployees();
    const newId = `EMP${String(Date.now()).slice(-6)}`;
    const newEmployee = { ...employee, id: newId };
    employees.push(newEmployee);
    saveEmployees(employees);
    return newEmployee;
};
export const updateEmployee = (updatedEmployee) => {
    let employees = getAllEmployees();
    employees = employees.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp);
    saveEmployees(employees);
};
export const deleteEmployee = (id) => {
    let employees = getAllEmployees();
    employees = employees.filter(emp => emp.id !== id);
    saveEmployees(employees);
};