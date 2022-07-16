// hides the body until the page is finished being built
const styleEl = document.createElement('style');
styleEl.innerHTML = 'body {visibility:hidden;}';
document.head.appendChild(styleEl);

window.addEventListener('GooseLoaded', () => {
  styleEl.remove();
});

