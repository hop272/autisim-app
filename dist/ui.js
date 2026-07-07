export function createButton(label, onClick, variant = 'primary') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `button button-${variant}`;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
}
export function createCard() {
    const card = document.createElement('section');
    card.className = 'card';
    return card;
}
export function createSectionHeader(title, subtitle) {
    const wrap = document.createElement('div');
    wrap.className = 'section-header';
    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    wrap.appendChild(titleEl);
    if (subtitle) {
        const sub = document.createElement('p');
        sub.className = 'section-subtitle';
        sub.textContent = subtitle;
        wrap.appendChild(sub);
    }
    return wrap;
}
export function createBadge(text, variant = 'default') {
    const badge = document.createElement('span');
    badge.className = `badge badge-${variant}`;
    badge.textContent = text;
    return badge;
}
export function createSlider(label, value, onChange) {
    const row = document.createElement('label');
    row.className = 'slider-row';
    const meta = document.createElement('div');
    meta.className = 'slider-meta';
    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    const valueEl = document.createElement('strong');
    valueEl.textContent = String(value);
    meta.appendChild(labelEl);
    meta.appendChild(valueEl);
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '1';
    input.max = '10';
    input.value = String(value);
    input.addEventListener('input', () => {
        const next = Number(input.value);
        valueEl.textContent = String(next);
        onChange(next);
    });
    row.appendChild(meta);
    row.appendChild(input);
    return row;
}
