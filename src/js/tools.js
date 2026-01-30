export function permit(res, status) {
  status.textContent = 'ACCESS GRANTED';
  status.classList.add('success');
  console.log("successful");
  window.location.replace("/chat");
}