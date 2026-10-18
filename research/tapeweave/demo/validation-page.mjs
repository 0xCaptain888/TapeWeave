import {makeRecord} from './validation-record.mjs';
const form = document.querySelector('#record-form');
const output = document.querySelector('#output');
const status = document.querySelector('#status');
const copy = document.querySelector('#copy');
function clear() { output.value = ''; copy.disabled = true; status.textContent = ''; }
form.addEventListener('input', clear);
form.addEventListener('change', clear);
form.addEventListener('submit', event => {
  event.preventDefault(); clear();
  try {
    const input = Object.fromEntries(new FormData(form));
    input.consent = form.elements.consent.checked;
    output.value = JSON.stringify(makeRecord(input), null, 2);
    copy.disabled = false;
    status.textContent = '已生成自报记录，未核验身份或实际体验。';
  } catch (error) { status.textContent = error.message; }
});
copy.addEventListener('click', async () => {
  const value = output.value;
  try {
    await navigator.clipboard.writeText(value);
    if (output.value === value) status.textContent = '已复制未认证记录。';
  } catch {
    if (output.value !== value) return;
    output.focus(); output.select();
    status.textContent = '复制不可用，已选中文本，请手动复制。';
  }
});
