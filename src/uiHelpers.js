/**
 * @param {string[]} headers
 * @param {Object[]} data
 * @param {(row: Object) => string} rowRenderer
 */
export const createTable = (headers, data, rowRenderer) => {
    const headerHTML = headers.map((header) => `<th>${header}</th>`).join('');
    const bodyHTML = data.map(rowRenderer).join('');
    return `
        <table>
            <thead>
                <tr>${headerHTML}</tr>
            </thead>
            <tbody>
                ${bodyHTML}
            </tbody>
        </table>
    `;
};
const removeModal = (overlay) => {
    overlay.classList.remove('show');
    const transitionMs = 250;
    setTimeout(() => {
        overlay.remove();
    }, transitionMs);
};
const ensureToastContainer = () => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
};
export const showToast = (message, type = 'info') => {
    if (typeof document === 'undefined') {
        return;
    }
    const normalizedType = ['success', 'error', 'info'].includes(type) ? type : 'info';
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${normalizedType}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    const displayDuration = 1500;
    const transitionDuration = 300;
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
            if (!container.hasChildNodes()) {
                container.remove();
            }
        }, transitionDuration);
    }, displayDuration);
};
const buildDialog = (message, options = {}) => {
    if (typeof document === 'undefined') {
        return null;
    }
    const {
        title = '',
        confirmText = 'Có',
        cancelText = 'Không',
        showCancel = true,
        type = 'info',
    } = options;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = `modal-dialog modal-${type}`;
    if (title) {
        const heading = document.createElement('h3');
        heading.textContent = title;
        dialog.appendChild(heading);
    }
    const body = document.createElement('p');
    body.textContent = message;
    dialog.appendChild(body);
    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    let cancelBtn = null;
    if (showCancel) {
        cancelBtn = document.createElement('button');
        cancelBtn.textContent = cancelText;
        cancelBtn.classList.add('secondary');
        actions.appendChild(cancelBtn);
    }
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = confirmText;
    confirmBtn.classList.add('primary');
    actions.appendChild(confirmBtn);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
        overlay.classList.add('show');
    });
    return { overlay, confirmBtn, cancelBtn, dialog };
};
export const showDialog = (message, options = {}) => {
    return new Promise((resolve) => {
        const modal = buildDialog(message, options);
        if (!modal) {
            resolve(false);
            return;
        }
        const { overlay, confirmBtn, cancelBtn } = modal;
        let resolved = false;
        let keyListener = null;
        const cleanup = (result) => {
            if (resolved) {
                return;
            }
            resolved = true;
            if (keyListener) {
                document.removeEventListener('keydown', keyListener);
            }
            removeModal(overlay);
            resolve(result);
        };
        keyListener = (event) => {
            if (event.key === 'Escape') {
                cleanup(false);
            }
        };
        document.addEventListener('keydown', keyListener);
        confirmBtn.addEventListener('click', () => cleanup(true));
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => cleanup(false));
        }
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                cleanup(false);
            }
        });
    });
};
export const showAlert = (message, type = 'info') => {
    showToast(message, type);
    return Promise.resolve();
};
export const showConfirm = (message, options = {}) => {
    return showDialog(message, {
        type: options.type || 'info',
        confirmText: options.confirmText || 'Có',
        cancelText: options.cancelText || 'Không',
        showCancel: true,
    });
};