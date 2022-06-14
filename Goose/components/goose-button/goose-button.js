Array.from(document.getElementsByClassName('goose-button')).forEach((button) => {
  button.addEventListener('click', () => {
    const originalText = button.innerHTML;
    const newText = 'Click!';
    button.innerHTML = newText;
    if (originalText !== newText)
      setTimeout(() => {
        button.innerHTML = originalText;
      }, 750);
  });
});
