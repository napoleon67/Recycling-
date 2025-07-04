
const avatarInput = document.getElementById('avatarInput');
const avatar = document.getElementById('avatar');
const usernameInput = document.getElementById('usernameInput');
const username = document.getElementById('username');

avatarInput.addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function () {
      avatar.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
});

usernameInput.addEventListener('input', function () {
  username.textContent = this.value || 'Misafir';
});
